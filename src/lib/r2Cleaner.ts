import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL, deleteMultipleFromR2 } from '@/lib/r2';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Banner from '@/models/Banner';
import Blog from '@/models/Blog';
import User from '@/models/User';
import GlobalSettings from '@/models/GlobalSettings';

export interface OrphanImageItem {
  key: string;
  filename: string;
  size: number;
  formattedSize: string;
  lastModified: string;
  url: string;
}

export interface ScanResult {
  prefix: string;
  totalObjects: number;
  totalSize: number;
  formattedTotalSize: string;
  orphanCount: number;
  orphanSize: number;
  formattedOrphanSize: string;
  orphans: OrphanImageItem[];
  scannedAt: string;
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getPlatformStoragePrefix(): string {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'climaxapparels.com';
  const platform = rootDomain.split('.')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'climaxapparels';
  return `${platform}/`;
}

export async function scanOrphanR2Images(options?: {
  prefix?: string;
  minAgeMinutes?: number;
}): Promise<ScanResult> {
  const targetPrefix = options?.prefix ?? getPlatformStoragePrefix();
  const minAgeMinutes = options?.minAgeMinutes ?? 60;
  const cutoffTime = Date.now() - minAgeMinutes * 60 * 1000;

  const r2Objects: Array<{ Key: string; Size: number; LastModified: Date }> = [];
  let continuationToken: string | undefined = undefined;

  do {
    const listCommand: ListObjectsV2Command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: targetPrefix,
      ContinuationToken: continuationToken,
    });

    const response = await r2Client.send(listCommand);
    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key && typeof obj.Size === 'number') {
          r2Objects.push({
            Key: obj.Key,
            Size: obj.Size,
            LastModified: obj.LastModified ? new Date(obj.LastModified) : new Date(),
          });
        }
      }
    }
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  const totalObjects = r2Objects.length;
  const totalSize = r2Objects.reduce((acc, curr) => acc + curr.Size, 0);

  await connectToDatabase();

  // Safely import optional models
  let BrandModel: any = null;
  // @ts-ignore
  try { BrandModel = (await import("@/models/Brand")).default; } catch {}
  let SliderModel: any = null;
  // @ts-ignore
  try { SliderModel = (await import("@/models/Slider")).default; } catch {}
  let LandingPageModel: any = null;
  // @ts-ignore
  try { LandingPageModel = (await import("@/models/LandingPage")).default; } catch {}

  const [
    products,
    categories,
    brands,
    banners,
    sliders,
    blogs,
    users,
    settings,
    landingPages,
  ] = await Promise.all([
    Product.find({}, { images: 1, featuredImage: 1, thumbnail: 1, description: 1 }).lean().catch(() => []),
    Category.find({}, { image: 1, banner: 1 }).lean().catch(() => []),
    BrandModel ? BrandModel.find({}, { logo: 1 }).lean().catch(() => []) : Promise.resolve([]),
    Banner.find({}, { imageUrl: 1, mobileImageUrl: 1 }).lean().catch(() => []),
    SliderModel ? SliderModel.find({}, { image: 1, mobileImage: 1 }).lean().catch(() => []) : Promise.resolve([]),
    Blog.find({}, { featuredImage: 1, content: 1 }).lean().catch(() => []),
    User.find({}, { image: 1, avatar: 1 }).lean().catch(() => []),
    GlobalSettings.find({}).lean().catch(() => []),
    LandingPageModel ? LandingPageModel.find({}).lean().catch(() => []) : Promise.resolve([]),
  ]);

  const combinedDbText = JSON.stringify({
    products,
    categories,
    brands,
    banners,
    sliders,
    blogs,
    users,
    settings,
    landingPages,
  });

  const orphans: OrphanImageItem[] = [];
  let orphanSize = 0;

  for (const obj of r2Objects) {
    const filename = obj.Key.split('/').pop();
    if (!filename) continue;

    if (obj.LastModified.getTime() > cutoffTime) {
      continue;
    }

    const isReferenced = combinedDbText.includes(filename);

    if (!isReferenced) {
      orphanSize += obj.Size;
      orphans.push({
        key: obj.Key,
        filename,
        size: obj.Size,
        formattedSize: formatBytes(obj.Size),
        lastModified: obj.LastModified.toISOString(),
        url: `${R2_PUBLIC_URL}/${obj.Key}`,
      });
    }
  }

  return {
    prefix: targetPrefix,
    totalObjects,
    totalSize,
    formattedTotalSize: formatBytes(totalSize),
    orphanCount: orphans.length,
    orphanSize,
    formattedOrphanSize: formatBytes(orphanSize),
    orphans,
    scannedAt: new Date().toISOString(),
  };
}

export async function purgeOrphanR2Images(keys: string[]): Promise<{
  success: boolean;
  deletedCount: number;
}> {
  if (!keys || keys.length === 0) {
    return { success: true, deletedCount: 0 };
  }

  const deletedCount = await deleteMultipleFromR2(keys);
  return {
    success: true,
    deletedCount,
  };
}
