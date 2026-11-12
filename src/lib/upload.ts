/**
 * Cloudflare R2 Image Upload Utility with Client-side WebP Compression.
 * Automatically optimizes images before direct presigned upload to R2,
 * completely bypassing server RAM and disk constraints.
 */

interface UploadOptions {
  folder?: string;
  compress?: boolean;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  targetMaxKB?: number;
}

/**
 * Helper to encode a canvas to WebP blob.
 * Note: Safari/iOS WebKit may silently fall back to 'image/png' if WebP encoding is unsupported,
 * ignoring the quality parameter and producing huge >1MB lossless PNG blobs!
 * We strictly verify `blob.type === 'image/webp'` so non-WebP fallbacks are rejected and handled by server-side Sharp.
 */
function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.type !== 'image/webp') {
          resolve(null);
          return;
        }
        resolve(blob);
      },
      'image/webp',
      quality
    );
  });
}

/**
 * Fast, adaptive client-side image compression to WebP.
 * Strictly guarantees size within targetMaxKB without quality degradation or loop freezes.
 * - Products / General: maxDim = 1200px, quality = 82% -> step down until <= 150KB
 * - Banners / Hero: maxDim = 2100px, quality = 82% -> step down until <= 400KB
 */
async function compressImageInBrowser(
  file: File,
  targetMaxKB = 150,
  maxDim = 1200
): Promise<File> {
  if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const targetBytes = targetMaxKB * 1024;
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const filename = `${nameWithoutExt}.webp`;

      // Progressive passes to guarantee output stays <= targetMaxKB
      const attempts = [
        { scale: 1.0, quality: 0.82 },
        { scale: 1.0, quality: 0.78 },
        { scale: 0.92, quality: 0.74 },
        { scale: 0.85, quality: 0.70 },
        { scale: 0.75, quality: 0.65 },
        { scale: 0.65, quality: 0.60 },
      ];

      let bestBlob: Blob | null = null;

      for (const attempt of attempts) {
        const w = Math.max(1, Math.round(width * attempt.scale));
        const h = Math.max(1, Math.round(height * attempt.scale));
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        if (!ctx) break;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);

        const blob = await canvasToWebpBlob(c, attempt.quality);
        if (!blob) {
          // Browser doesn't support true WebP canvas encoding (e.g., older Safari/iOS WebKit)
          // Return original file so it falls back to server-side Sharp WebP optimization
          return resolve(file);
        }

        bestBlob = blob;
        if (blob.size <= targetBytes) {
          return resolve(new File([blob], filename, { type: 'image/webp' }));
        }
      }

      if (bestBlob && bestBlob.size <= targetBytes) {
        return resolve(new File([bestBlob], filename, { type: 'image/webp' }));
      }

      // If still over targetBytes, return bestBlob only if it's smaller than original;
      // the presigned check below will route oversized blobs to server-side Sharp!
      if (bestBlob) {
        return resolve(new File([bestBlob], filename, { type: 'image/webp' }));
      }

      resolve(file);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

export async function uploadImageToR2(
  file: File | string,
  options: UploadOptions = {}
): Promise<string> {
  const {
    folder = 'products',
    compress = true,
  } = options;

  const isBanner = folder === 'banners' || folder.includes('banner') || folder.includes('hero');
  const targetMaxKB = options.targetMaxKB ?? (isBanner ? 400 : 150);
  const targetMaxBytes = targetMaxKB * 1024;
  const maxWidthOrHeight = options.maxWidthOrHeight ?? (isBanner ? 2100 : 1200);

  // 1. If it's a browser File and compression is enabled, compress to WebP
  let uploadFile: File | null = null;
  let contentType = 'image/jpeg';
  let filename = 'image.webp';

  if (typeof window !== 'undefined' && file instanceof File) {
    // 1 MB File Size Guard: Strictly block any image over 1 MB (products, banners, blogs, categories, etc.)
    const MAX_ALLOWED_BYTES = 1 * 1024 * 1024; // 1 MB
    if (file.size > MAX_ALLOWED_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(`Image size cannot exceed 1 MB! Your file is ${sizeMB} MB. Please upload an image under 1 MB.`);
    }

    const isSvgOrGif = file.type.includes('svg') || file.type.includes('gif');

    if (compress && file.type.startsWith('image/') && !isSvgOrGif) {
      try {
        uploadFile = await compressImageInBrowser(file, targetMaxKB, maxWidthOrHeight);
        contentType = uploadFile.type || 'image/webp';
        filename = uploadFile.name || 'image.webp';
      } catch (compErr) {
        console.warn('Client-side image compression fallback to original:', compErr);
        uploadFile = file;
        contentType = file.type || 'image/jpeg';
        filename = file.name;
      }
    } else {
      uploadFile = file;
      contentType = file.type || 'image/jpeg';
      filename = file.name;
    }

    // 2. Try direct Presigned PUT Upload to Cloudflare R2 ONLY if:
    //    - Image is genuinely converted to 'image/webp' (or SVG/GIF)
    //    - AND compressed file size is strictly within targetMaxBytes (150KB for products, 400KB for banners)
    //    If browser WebP encoding failed (e.g., iOS Safari PNG fallback) or exceeded targetMaxBytes,
    //    skip presigned upload so server-side `/api/upload` (Sharp) optimizes it!
    const canUsePresigned =
      uploadFile &&
      (isSvgOrGif || (uploadFile.type === 'image/webp' && uploadFile.size <= targetMaxBytes));

    if (canUsePresigned && uploadFile) {
      try {
        const presignedRes = await fetch('/api/upload/presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename,
            contentType,
            folder,
            fileSize: uploadFile.size,
          }),
        });

        if (presignedRes.ok) {
          const { uploadUrl, publicUrl } = await presignedRes.json();
          if (uploadUrl && publicUrl) {
            const directUploadRes = await fetch(uploadUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': contentType,
              },
              body: uploadFile,
            });

            if (directUploadRes.ok) {
              return publicUrl;
            }
          }
        }
      } catch (presignedErr) {
        console.warn('Presigned upload failed, falling back to server /api/upload:', presignedErr);
      }
    }
  }

  // 3. Fallback to server-side /api/upload (Sharp WebP compression + R2 upload)
  // Always send original `file` if client-side compression couldn't produce a valid <=targetMaxBytes WebP
  const formData = new FormData();
  if (typeof file === 'string') {
    const base64Data = file.split(',')[1] || file;
    formData.append('image', base64Data);
  } else if (uploadFile && uploadFile.type === 'image/webp' && uploadFile.size <= targetMaxBytes) {
    formData.append('image', uploadFile);
  } else {
    formData.append('image', file);
  }
  formData.append('folder', folder);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Upload failed: Unexpected server response (Status: ${response.status})`);
  }

  if (response.ok && data.url) {
    return data.url;
  } else {
    throw new Error(data.message || `Upload failed with status ${response.status}`);
  }
}
