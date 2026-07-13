'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Heart, Loader2, ShoppingBag } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function WishlistPage() {
  const { status } = useSession();
  const wishlistIds = useAppSelector((state) => state.wishlist.items);
  const isHydrated = useAppSelector((state) => state.wishlist.isHydrated);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHydrated || status === 'loading') return;

    const controller = new AbortController();
    let isMounted = true;

    async function fetchWishlistProducts() {
      setLoading(true);
      try {
        let url = '';
        if (status === 'authenticated') {
          url = '/api/wishlist';
        } else if (wishlistIds.length > 0) {
          url = `/api/products?ids=${wishlistIds.join(',')}`;
        }

        if (url) {
          const res = await fetch(url, { signal: controller.signal });
          if (res.ok) {
            const data = await res.json();
            const productsArray = data.products || data;
            if (isMounted) setProducts(Array.isArray(productsArray) ? productsArray : []);
          } else {
            throw new Error(`Failed to fetch: ${res.status}`);
          }
        } else {
          if (isMounted) setProducts([]);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching wishlist products:', error);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchWishlistProducts();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [wishlistIds, isHydrated, status]);

  if (!isHydrated || (loading && products.length === 0)) {
    return (
      <div className="flex h-[40vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
            <Heart className="h-8 w-8 text-destructive fill-destructive" />
            My Wishlist
          </h1>
          <p className="text-muted-foreground text-sm">
            {products.length === 0
              ? "Your wishlist is empty."
              : `You have ${products.length} item${products.length === 1 ? '' : 's'} in your wishlist.`}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">No items found</h2>
          <p className="text-muted-foreground mb-8 text-center max-w-sm text-sm">
            Looks like you haven't added anything to your wishlist yet.
            Start exploring our shop to find something you'll love!
          </p>
          <Button
            asChild
            size="lg"
            className="rounded-full px-8 font-bold"
          >
            <Link href="/shop">Go to Shop</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

