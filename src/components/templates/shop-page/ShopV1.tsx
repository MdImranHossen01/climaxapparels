import { Suspense } from 'react';
import ShopClient from './ShopClient';
import { ShopHeaderSkeleton, ProductCardSkeleton } from '@/components/storefront/Skeletons';

export default function ShopV1({ products, categories, searchParams, style, productCardStyle }: { products: any[], categories: any[], searchParams: any, style?: string, productCardStyle?: string }) {
  return (
    <Suspense fallback={
      // ... (keeping existing fallback code)
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
    }>
      <ShopClient 
        initialProducts={products} 
        initialCategories={categories} 
        searchParams={searchParams}
        cardStyle={productCardStyle}
      />
    </Suspense>
  );
}

