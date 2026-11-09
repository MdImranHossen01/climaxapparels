import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2';
import crypto from 'crypto';

async function resolveStoragePrefix(session: any, folder: string): Promise<string> {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'climaxapparels.com';
  const platform = rootDomain.split('.')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'climaxapparels';
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'uploads';

  const user = session?.user;
  const role = user?.role;

  if (['admin', 'super_admin', 'manager', 'moderator'].includes(role)) {
    return `${platform}/mother/${safeFolder}`;
  }

  return `${platform}/users/${safeFolder}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const image = formData.get('image');
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!image) {
      return NextResponse.json({ message: 'No image provided' }, { status: 400 });
    }

    let buffer: Buffer;
    let contentType = 'image/jpeg';
    let originalName = 'image.jpg';

    if (image instanceof File) {
      const bytes = await image.arrayBuffer();
      buffer = Buffer.from(bytes);
      contentType = image.type || 'image/jpeg';
      originalName = image.name || 'image.jpg';
    } else if (typeof image === 'string') {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
      const match = image.match(/^data:(image\/\w+);base64,/);
      if (match) contentType = match[1];
    } else {
      return NextResponse.json({ message: 'Unsupported image format' }, { status: 400 });
    }

    const MAX_ALLOWED_BYTES = 1 * 1024 * 1024; // 1 MB
    if (buffer.length > MAX_ALLOWED_BYTES) {
      const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        { message: `Image size cannot exceed 1 MB! Your file is ${sizeMB} MB.` },
        { status: 400 }
      );
    }

    const isSvg = contentType.includes('svg');
    const isGif = contentType.includes('gif');
    let ext = 'webp';

    if (!isSvg && !isGif) {
      try {
        const sharp = (await import('sharp')).default;
        const isBanner = folder === 'banners' || folder.includes('banner') || folder.includes('hero');
        const maxDim = isBanner ? 2160 : 1200;
        const targetSize = isBanner ? 450 * 1024 : 155 * 1024;
        const initialQuality = 82;
        const fallbackQuality = 78;

        let optimized = await sharp(buffer)
          .rotate()
          .resize({ width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: initialQuality, effort: 5 })
          .toBuffer();

        if (optimized.length > targetSize) {
          optimized = await sharp(buffer)
            .rotate()
            .resize({ width: Math.round(maxDim * 0.94), height: Math.round(maxDim * 0.94), fit: 'inside', withoutEnlargement: true })
            .webp({ quality: fallbackQuality, effort: 5 })
            .toBuffer();
        }

        buffer = optimized;
        contentType = 'image/webp';
        ext = 'webp';
      } catch (sharpErr) {
        console.warn('[Sharp] WebP conversion fallback:', sharpErr);
        const rawExt = originalName.split('.').pop()?.toLowerCase() || 'jpg';
        ext = rawExt.replace(/[^a-z0-9]/g, '') || 'jpg';
      }
    } else {
      const rawExt = originalName.split('.').pop()?.toLowerCase() || (isSvg ? 'svg' : 'gif');
      ext = rawExt.replace(/[^a-z0-9]/g, '') || 'jpg';
    }

    const storagePrefix = await resolveStoragePrefix(session, folder);
    const fileKey = `${storagePrefix}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: contentType,
    });

    await r2Client.send(command);

    const publicUrl = `${R2_PUBLIC_URL}/${fileKey}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileKey,
    });
  } catch (error: any) {
    console.error('Error in Cloudflare R2 /api/upload:', error);
    return NextResponse.json(
      { message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
