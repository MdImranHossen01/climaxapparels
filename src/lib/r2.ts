import { S3Client, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID || '2a9302464bab79b94f3b96091e05eaa5';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || '8d6ad7c48293e166cbf8f9d2ec9fd48e';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '53554534cf0a5d79d00bb925cd285f3c9568788b1d86dec6384170c5bd0e3d22';
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'climaxapparels';
export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://pub-6097ad99e6e94e079a0ee47bbbe3b921.r2.dev';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export function extractR2Key(urlOrKey: string): string | null {
  if (!urlOrKey) return null;
  const trimmed = urlOrKey.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  }

  try {
    const urlObj = new URL(trimmed);
    const pathname = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;
    return pathname || null;
  } catch {
    return null;
  }
}

export async function deleteFromR2(urlOrKey: string): Promise<boolean> {
  const key = extractR2Key(urlOrKey);
  if (!key) return false;

  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch (err) {
    console.error('Error deleting object from R2:', key, err);
    return false;
  }
}

export async function deleteMultipleFromR2(urlsOrKeys: string[]): Promise<number> {
  if (!Array.isArray(urlsOrKeys) || urlsOrKeys.length === 0) return 0;

  const validKeys = Array.from(
    new Set(
      urlsOrKeys
        .map(extractR2Key)
        .filter((k): k is string => Boolean(k) && typeof k === 'string')
    )
  );

  if (validKeys.length === 0) return 0;

  try {
    const chunks: string[][] = [];
    for (let i = 0; i < validKeys.length; i += 1000) {
      chunks.push(validKeys.slice(i, i + 1000));
    }

    let deletedCount = 0;
    for (const chunk of chunks) {
      const res = await r2Client.send(
        new DeleteObjectsCommand({
          Bucket: R2_BUCKET_NAME,
          Delete: {
            Objects: chunk.map((Key) => ({ Key })),
            Quiet: true,
          },
        })
      );
      deletedCount += chunk.length - (res.Errors?.length || 0);
    }

    return deletedCount;
  } catch (err) {
    console.error('Error batch deleting from R2:', err);
    return 0;
  }
}
