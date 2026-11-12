import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2';
import crypto from 'crypto';

async function resolveStoragePrefix(session: any, folder: string): Promise<string> {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'climaxapparels.com';
  const platform = rootDomain.split('.')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'climaxapparels';
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'products';

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

    const body = await req.json();
    const { filename, contentType, folder = 'products', fileSize } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        { message: 'filename and contentType are required' },
        { status: 400 }
      );
    }

    const isBanner = folder === 'banners' || folder.includes('banner') || folder.includes('hero');
    const maxAllowedBytes = isBanner ? 400 * 1024 : 150 * 1024;

    if (typeof fileSize !== 'number' || fileSize <= 0 || fileSize > maxAllowedBytes) {
      return NextResponse.json(
        { message: `Direct presigned upload requires optimized file size <= ${Math.round(maxAllowedBytes / 1024)}KB. Use /api/upload for server optimization.` },
        { status: 400 }
      );
    }

    // Only allow already-optimized WebP (or SVG/GIF) for direct presigned upload;
    // raw JPEG/PNG or Safari PNG-fallback blobs must go through `/api/upload` (Sharp)
    const allowedTypes = [
      'image/webp',
      'image/gif',
      'image/svg+xml',
    ];
    if (!allowedTypes.includes(contentType.toLowerCase())) {
      return NextResponse.json(
        { message: 'Direct upload only accepts optimized WebP/SVG/GIF. Falling back to server optimization.' },
        { status: 400 }
      );
    }

    const rawExt = filename.split('.').pop()?.toLowerCase() || 'webp';
    const ext = rawExt.replace(/[^a-z0-9]/g, '') || 'webp';

    const storagePrefix = await resolveStoragePrefix(session, folder);
    const fileKey = `${storagePrefix}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
      ContentLength: Number(fileSize),
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
    const publicUrl = `${R2_PUBLIC_URL}/${fileKey}`;

    return NextResponse.json({
      success: true,
      uploadUrl,
      publicUrl,
      fileKey,
    });
  } catch (error: any) {
    console.error('Error generating Cloudflare R2 Presigned URL:', error);
    return NextResponse.json(
      { message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
