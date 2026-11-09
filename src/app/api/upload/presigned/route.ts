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
    const { filename, contentType, folder = 'products' } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        { message: 'filename and contentType are required' },
        { status: 400 }
      );
    }

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
    ];
    if (!allowedTypes.includes(contentType.toLowerCase())) {
      return NextResponse.json(
        { message: 'Invalid file type. Only image files are allowed.' },
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
