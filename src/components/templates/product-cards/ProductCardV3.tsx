/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ShoppingCart, Heart, Search, MoreVertical, Edit, Trash2, Settings, Layers } from 'lucide-react';
import { RatingStars } from '@/components/ui/rating-stars';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart } from '@/store/slices/cartSlice';
import { toggleWishlist } from '@/store/slices/wishlistSlice';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { QuickViewModal } from './QuickViewModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

export default function ProductCardV3({ product: initialProduct, isFlashSale }: ProductCardProps) {
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

  const discount = (product.price > 0 && product.salePrice && product.salePrice < product.price) 
    ? Math.round(((product.price - product.salePrice) / product.price) * 100) 
    : 0;

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (hasVariants) {
      setShowQuickViewModal(true);
    } else {
      executeAddToCart();
    }
  };

  const executeAddToCart = () => {
    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      price: product.salePrice ?? product.price,
      basePrice: product.price,
      quantity: 1,
      image: product.images?.[0]
    }));
    toast.success(`${product.name} added to cart`);
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (status === 'unauthenticated') {
      toast.error('Please login to save to wishlist');
      return;
    }

    // Optimistic update
    dispatch(toggleWishlist(product._id));
    const willBeInWishlist = !isInWishlist;

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id }),
      });
      
      if (!res.ok) {
        throw new Error('Server error updating wishlist');
      }
      
      toast.success(willBeInWishlist ? 'Saved to wishlist' : 'Removed from wishlist');
    } catch (err) {
      console.error('Wishlist error:', err);
      // Rollback
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
      const res = await fetch(`/api/products/${product.slug}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete product');
      }
      toast.success('Product removed successfully');
      router.refresh();
    } catch (err: any) {
      toast.error(`Error: ${err.message || 'Failed to delete product'}`);
    }
  };

  return (
    <div 
      className="group relative flex flex-col bg-background border border-neutral-200 dark:border-neutral-800 transition-all duration-300 hover:border-primary"
      data-aos="fade-up"
    >
      {/* Industrial Visual Container */}
      <div className="relative aspect-square overflow-hidden bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
        <Link href={`/product/${product.slug}`} className="relative block h-full w-full">
          <Image
            src={product.images?.[0] || '/placeholder.png'}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Technical Badges */}
        <div className="absolute top-0 left-0 flex flex-col z-10">
          {discount > 0 && (
            <div className="bg-primary text-primary-foreground font-mono text-[10px] px-2 py-1 uppercase tracking-tighter">
              DISC_{discount}%
            </div>
          )}
          {isFlashSale && (
            <div className="bg-orange-500 text-white font-mono text-[10px] px-2 py-1 uppercase tracking-tighter animate-pulse">
              LIVE_FLASH
            </div>
          )}
        </div>

        {/* Action Sidebar */}
        <div className="absolute top-0 right-0 h-full hidden md:flex flex-col border-l border-neutral-100 dark:border-neutral-800 translate-x-full group-hover:translate-x-0 transition-transform duration-300 bg-background/80 backdrop-blur-md">
           <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={handleFavorite}
                  className="flex-1 px-3 hover:text-primary transition-colors border-b border-neutral-100 dark:border-neutral-800"
                >
                  <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-primary text-primary' : ''}`} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={handleQuickView}
                  className="flex-1 px-3 hover:text-primary transition-colors border-b border-neutral-100 dark:border-neutral-800"
                >
                  <Search className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Quick View</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="flex-1 px-3 hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info('Comparison feature coming soon');
                  }}
                >
                  <Layers className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Compare</p>
              </TooltipContent>
            </Tooltip>
           </TooltipProvider>
        </div>

        {/* Admin Overlay */}
        {isAdmin && (
          <div className="absolute bottom-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline" className="h-8 w-8 border-neutral-800 bg-black/50 text-white hover:bg-primary">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/admin/products/${product.slug}`)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteProduct} className="text-destructive">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Technical Content Section */}
      <div className="p-4 flex flex-col gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
            {product.isNewArrival && <span className="text-emerald-500">[ NEW_ARRV ]</span>}
            {product.isFeatured && <span className="text-primary">[ FT_ITEM ]</span>}
          </div>
          <Link href={`/product/${product.slug}`} className="block">
            <h3 className="text-base font-bold uppercase tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          {(product.numReviews || 0) > 0 && (
            <div 
              className="flex items-center gap-1.5 mt-1"
              aria-label={`${product.ratings || 0} out of 5 stars, ${product.numReviews || 0} reviews`}
            >
              <RatingStars rating={product.ratings || 0} starClassName="h-2.5 w-2.5" />
              <span className="text-[9px] font-mono text-muted-foreground font-bold">({product.numReviews})</span>
            </div>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div className="flex flex-col">
             <span className="text-xs font-mono text-muted-foreground uppercase mb-1">Price_</span>
             <div className="flex items-center gap-2">
                <span className="text-xl font-black font-mono text-primary">
                  ${Math.round(product.salePrice ?? product.price)}
                </span>
                {product.salePrice != null && product.salePrice < product.price && (
                  <span className="text-xs font-mono text-muted-foreground line-through opacity-50">
                    ${Math.round(product.price)}
                  </span>
                )}
             </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon"
                  className="rounded-none h-10 w-10 bg-primary hover:bg-primary-foreground hover:text-primary border border-primary transition-all"
                  onClick={handleAddToCartClick}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="h-5 w-5" />
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

