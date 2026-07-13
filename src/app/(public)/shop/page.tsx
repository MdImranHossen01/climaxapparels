import { headers } from 'next/headers';
import { Suspense } from 'react';
import { getCachedProducts, getCachedCategories, getCachedSettings } from '@/lib/data-fetching';
import { ShopHeaderSkeleton, ProductCardSkeleton } from '@/components/storefront/Skeletons';
import { ShopListingSelector } from '@/components/templates/ServerRegistry';

import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getCachedSettings();
  const brandName = settings?.brandName || 'Climax Apparels';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const headersList = await headers();
  const hostname = headersList.get('host') || 'localhost';
  const baseUrl = `${protocol}://${hostname}`;

  return {
    title: `Shop Premium Healthcare & Medicines | ${brandName}`,
    description: `Buy high-quality prescription medicines, OTC daily healthcare, surgical instruments, diagnostic devices, baby care, and personal wellness essentials online at ${brandName}. Fast home delivery and 100% authentic products.`,
    openGraph: {
      title: `Shop | ${brandName}`,
      description: `Explore the wide range of products at ${brandName}.`,
      url: `${baseUrl}/shop`,
      siteName: brandName,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Shop | ${brandName}`,
      description: `Explore the wide range of products at ${brandName}.`,
    },
  };
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  // Fetch initial data on the server with caching
  const [initialProducts, initialCategories, settings] = await Promise.all([
    getCachedProducts({}, 1000),
    getCachedCategories(),
    getCachedSettings()
  ]);

  const style = settings?.uiTemplates?.shopListing || 'v1';
  const productCardStyle = settings?.uiTemplates?.productCard || 'v1';

  return (
    <Suspense fallback={<ShopFallback />}>
      <ShopListingSelector
        style={style}
        productCardStyle={productCardStyle}
        products={initialProducts}
        categories={initialCategories}
        searchParams={searchParams}
      />
    </Suspense>
  );
}

function ShopFallback() {
  return (
    <div className="container py-10">
      <ShopHeaderSkeleton />
      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        </aside>
        <div className="flex-1">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

