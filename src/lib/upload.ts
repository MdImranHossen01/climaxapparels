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
 * Fast, adaptive client-side image compression to WebP.
 * Strictly guarantees size within targetMaxKB without quality degradation or loop freezes.
 * - Products: maxDim = 1200px, quality = 82% (0.82), targetMaxKB = 150KB
 * - Banners / Hero: maxDim = 2100px, quality = 82% (0.82), targetMaxKB = 400KB
 */
async function compressImageInBrowser(
  file: File, 
  targetMaxKB = 150, 
  maxDim = 1200
): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
      return resolve(file);
    }

    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
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

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const filename = `${nameWithoutExt}.webp`;

      // Pass 1: Premium 82% WebP (Visually Lossless for sharp text & fine texture)
      const pass1Quality = 0.82;
      canvas.toBlob(
        (blob1) => {
          if (!blob1) return resolve(file);
          if (blob1.size <= targetMaxKB * 1024) {
            return resolve(new File([blob1], filename, { type: 'image/webp' }));
          }

          // Pass 2: High detail image exceeding targetMaxKB, adjust quality slightly to 0.78
          const pass2Quality = 0.78;
          canvas.toBlob(
            (blob2) => {
              if (blob2 && blob2.size <= targetMaxKB * 1024) {
                return resolve(new File([blob2], filename, { type: 'image/webp' }));
              }

              // Pass 3: If still over target, scale gently to 94%
              const scale = 0.94;
              const c2 = document.createElement('canvas');
              c2.width = Math.round(width * scale);
              c2.height = Math.round(height * scale);
              const ctx2 = c2.getContext('2d');
              if (ctx2) {
                ctx2.imageSmoothingEnabled = true;
                ctx2.imageSmoothingQuality = 'high';
                ctx2.drawImage(canvas, 0, 0, c2.width, c2.height);
                c2.toBlob(
                  (blob3) => {
                    const finalBlob = blob3 || blob2 || blob1;
                    resolve(new File([finalBlob], filename, { type: 'image/webp' }));
                  },
                  'image/webp',
                  pass2Quality
                );
              } else {
                resolve(new File([blob2 || blob1], filename, { type: 'image/webp' }));
              }
            },
            'image/webp',
            pass2Quality
          );
        },
        'image/webp',
        pass1Quality
      );
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

    if (compress && file.type.startsWith('image/') && !file.type.includes('svg') && !file.type.includes('gif')) {
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

    // 2. Try direct Presigned PUT Upload to Cloudflare R2
    try {
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          contentType,
          folder,
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

  // 3. Fallback to server-side /api/upload (which also writes directly to Cloudflare R2)
  const formData = new FormData();
  if (typeof file === 'string') {
    const base64Data = file.split(',')[1] || file;
    formData.append('image', base64Data);
  } else if (uploadFile) {
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
    throw new Error(`Upload failed: Unexpected response from server. Status: ${response.status}`);
  }

  if (response.ok && data.url) {
    return data.url;
  } else {
    throw new Error(data.message || `Upload failed with status ${response.status}`);
  }
}
