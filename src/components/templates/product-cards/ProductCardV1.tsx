/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, Search, MoreVertical, Edit, Trash2, Settings, PlusCircle } from 'lucide-react';
import { RatingStars } from '@/components/ui/rating-stars';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart } from '@/store/slices/cartSlice';
import { toggleWishlist } from '@/store/slices/wishlistSlice';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { QuickViewModal } from './QuickViewModal';
import { fbEvent } from '@/lib/fpixel';
import { ttEvent } from '@/lib/tiktok';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Swal from 'sweetalert2';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    salePrice?: number;
    images: string[];
    isFeatured?: boolean;
    isNewArrival?: boolean;
    stock: number;
    categories?: any[];
    variants?: any[];
    ratings?: number;
    numReviews?: number;
    sku?: string;
  };
  isFlashSale?: boolean;
}

export default function ProductCardV1({ product: initialProduct, isFlashSale }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const { data: session, status } = useSession();
  const wishlist = useAppSelector((state) => state.wishlist.items);
  const isInWishlist = wishlist.includes(initialProduct._id);
  const router = useRouter();
  const isAdmin = (session?.user as any)?.role === 'admin';
  
  const firstVariant = initialProduct.variants && initialProduct.variants.length > 0 ? initialProduct.variants[0] : null;
  const product = firstVariant ? {
    ...initialProduct,
    price: firstVariant.price,
    salePrice: firstVariant.salePrice,
    stock: firstVariant.stock ?? initialProduct.stock,
    sku: firstVariant.sku ?? initialProduct.sku,
    images: firstVariant.image ? [firstVariant.image, ...initialProduct.images.filter((img: string) => img !== firstVariant.image)] : initialProduct.images
  } : initialProduct;

  const hasVariants = product.variants && product.variants.length > 0;

  const [showQuickViewModal, setShowQuickViewModal] = useState(false);

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (hasVariants) {
      setShowQuickViewModal(true);
    } else {
      executeAddToCart();
    }
  };

  const executeAddToCart = () => {
    const displayPrice = product.price;
    const displaySalePrice = product.salePrice;

    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      price: (displaySalePrice !== undefined && displaySalePrice !== null) ? displaySalePrice : displayPrice,
      basePrice: displayPrice,
      quantity: 1,
      color: undefined,
      size: undefined
    }));

    // Track AddToCart
    const addToCartPayload = {
      content_name: product.name,
      content_category: product.categories?.[0]?.name || 'Uncategorized',
      content_ids: [product._id],
      content_type: 'product',
      value: displaySalePrice ?? displayPrice,
      currency: 'BDT',
      quantity: 1
    };
    fbEvent('AddToCart', addToCartPayload);
    ttEvent('AddToCart', addToCartPayload);

    toast.success(`${product.name} added to cart`);
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      toast.error('Please login to add to wishlist');
      return;
    }

    // Toggle locally (optimistic update)
    dispatch(toggleWishlist(product._id));

    // Determine the message based on the NEW state
    const willBeInWishlist = !isInWishlist;
    toast.success(willBeInWishlist ? 'Added to wishlist' : 'Removed from wishlist');

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id }),
      });

      if (!res.ok) {
        throw new Error('Failed to update wishlist server-side');
      }

      if (willBeInWishlist) {
        // Track AddToWishlist
        const addToWishlistPayload = {
          content_name: product.name,
          content_category: product.categories?.[0]?.name || 'Uncategorized',
          content_ids: [product._id],
          content_type: 'product',
          value: product.salePrice ?? product.price,
          currency: 'BDT'
        };
        fbEvent('AddToWishlist', addToWishlistPayload);
        ttEvent('AddToWishlist', addToWishlistPayload);
      }
    } catch (err) {
      console.error('API toggle error:', err);
      // Rollback optimistic update
      dispatch(toggleWishlist(product._id));
      toast.error('Failed to sync wishlist. Please try again.');
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowQuickViewModal(true);
  };

  const handleDeleteProduct = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = await Swal.fire({
      title: 'Delete Product?',
      text: 'Are you sure you want to delete this product? This action is permanent.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/products/${product.slug}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Product deleted successfully');
      router.refresh();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      toast.error(`Error deleting product: ${err.message || 'Unknown error'}`);
    }
  };

  const discount = (product.salePrice !== undefined && product.salePrice !== null && product.price > 0)
    ? Math.max(0, Math.round(((product.price - product.salePrice) / product.price) * 100))
    : 0;

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-none border bg-background transition-all hover:shadow-xl"
      data-aos="fade-up"
    >
      <Link href={`/product/${product.slug}`} className="relative aspect-square overflow-hidden bg-muted rounded-none">
        {product.images?.length > 0 ? (
          <div className="relative h-full w-full">
            {/* Primary Image */}
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className={`object-cover transition-all duration-700 ${product.images.length > 1 ? 'group-hover:opacity-0 group-hover:scale-105' : 'group-hover:scale-110'}`}
            />
            {/* Secondary Image (on Hover) */}
            {product.images.length > 1 && (
              <Image
                src={product.images[1]}
                alt={`${product.name} alternate view`}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className="absolute inset-0 object-cover transition-all duration-700 opacity-0 group-hover:opacity-100 scale-110 group-hover:scale-100"
              />
            )}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            No image
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {discount > 0 && (
            <Badge variant="default" className="bg-primary text-primary-foreground font-bold">-{discount}%</Badge>
          )}
          {product.isFeatured && (
            <Badge variant="default" className="bg-primary hover:bg-primary font-bold uppercase text-[10px]">Featured</Badge>
          )}
          {product.isNewArrival && (
            <Badge variant="secondary" className="bg-emerald-500 hover:bg-emerald-600 text-white border-none font-bold uppercase text-[10px]">New Arrival</Badge>
          )}
          {product.stock === 0 && (
            <Badge variant="secondary" className="font-bold uppercase text-[10px]">Out of Stock</Badge>
          )}
          {isFlashSale && (
            <Badge variant="default" className="bg-primary text-primary-foreground animate-pulse font-bold uppercase text-[10px]">Flash Deal</Badge>
          )}
        </div>

        {/* Hover Actions */}
        <div className="absolute inset-0 hidden md:flex items-center justify-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-black/5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 rounded-full shadow-lg hover:scale-110 transition-transform bg-white text-gray-900 hover:bg-white"
                  onClick={handleFavorite}
                  disabled={status === 'loading'}
                >
                  <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-12 w-12 rounded-full shadow-lg hover:scale-110 transition-transform bg-primary text-white hover:bg-primary/90 border-none"
                  onClick={handleQuickView}
                >
                  <Search className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Quick View</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Link>

      {/* Admin Quick Actions Overlay */}
      {isAdmin && (
        <div className="absolute top-2 right-2 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none transition-transform hover:scale-110 drop-shadow-md">
              <MoreVertical className="h-5 w-5 text-foreground/80 hover:text-primary" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => router.push(`/admin/products/${product.slug}`)} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" /> Edit Product
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeleteProduct} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Product
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/admin/products')} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" /> Manage Products
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/admin/products/new')} className="cursor-pointer">
                <PlusCircle className="mr-2 h-4 w-4" /> Create Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="flex flex-1 flex-col px-2 md:px-4 py-2 md:py-4 ">

        {(product.numReviews || 0) > 0 && (
          <div 
            className="flex items-center gap-2 mb-1"
            aria-label={`${product.ratings || 0} out of 5 stars, ${product.numReviews || 0} reviews`}
          >
              <RatingStars rating={product.ratings || 0} starClassName="h-3 w-3" />
            <span className="text-[10px] text-muted-foreground font-bold">({product.numReviews})</span>
          </div>
        )}

        <div className="mb-2 h-12 md:h-10">
          <Link
            href={`/product/${product.slug}`}
            className="md:text-lg text-xs  font-semibold text-foreground hover:text-primary transition-colors line-clamp-3 md:line-clamp-2"
          >
            {product.name}
          </Link>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex flex-col justify-end min-h-[48px]">
            {product.salePrice !== undefined && product.salePrice !== null ? (
              <>
                <span className="text-xs line-through text-muted-foreground leading-none mb-1">
                  ${product.price ? Math.round(product.price) : '0'}
                </span>
                <span className="font-bold text-lg text-primary leading-none">
                  ${Math.round(product.salePrice)}
                </span>
              </>
            ) : (
              <span className="font-bold text-lg text-primary leading-none">
                ${product.price ? Math.round(product.price) : '0'}
              </span>
            )}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="h-9 w-9 rounded-full p-0 flex items-center justify-center transition-all hover:scale-110 cursor-pointer bg-white border border-gray-100 text-gray-900 hover:bg-gray-50"
                  disabled={product.stock === 0}
                  onClick={handleAddToCartClick}
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add to cart</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <QuickViewModal
        product={initialProduct}
        isOpen={showQuickViewModal}
        onClose={() => setShowQuickViewModal(false)}
      />
    </div>
  );
}

