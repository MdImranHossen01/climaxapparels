/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ShoppingCart, Heart, Search, MoreVertical, Edit, Trash2, Settings, PlusCircle } from 'lucide-react';
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

export default function ProductCardV2({ product: initialProduct, isFlashSale }: ProductCardProps) {
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
  const [isHovered, setIsHovered] = useState(false);
  const quickAddRef = useRef<HTMLButtonElement>(null);

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
      toast.error('Please login to add to wishlist');
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
        throw new Error('Server synchronization failed');
      }
      
      toast.success(willBeInWishlist ? 'Added to wishlist' : 'Removed from wishlist');
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
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Product deleted successfully');
      router.refresh();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  return (
    <div 
      className="group relative flex flex-col bg-background rounded-none border border-border/50 overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(255,255,255,0.05)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-aos="fade-up"
    >
      {/* Image Section */}
      <div className="relative aspect-[4/5] overflow-hidden bg-muted/20">
        <Link href={`/product/${product.slug}`} className="relative block h-full w-full">
          <Image
            src={product.images?.[0] || '/placeholder.png'}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-110"
          />
        </Link>

        {/* Badges Overlay */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {discount > 0 && (
            <div className="bg-primary text-primary-foreground text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
              -{discount}%
            </div>
          )}
          {isFlashSale && (
            <div className="bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg animate-pulse">
              Flash
            </div>
          )}
        </div>

        {/* Floating Actions Overlay */}
        <div className={`absolute inset-0 bg-black/20 backdrop-blur-[2px] hidden md:flex items-center justify-center gap-3 transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-11 w-11 rounded-full shadow-2xl hover:scale-110 transition-transform bg-white/90 dark:bg-neutral-900/90"
                  onClick={handleFavorite}
                >
                  <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-foreground'}`} />
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
                  className="h-12 w-12 rounded-full shadow-2xl hover:scale-110 transition-transform bg-[#00a870] text-white hover:bg-[#008f5d] border-none"
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

        {/* Admin Menu */}
        {isAdmin && (
          <div className="absolute top-4 right-4 z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-white/50 backdrop-blur-md hover:bg-white/80">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-2xl">
                <DropdownMenuItem onClick={() => router.push(`/admin/products/${product.slug}`)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteProduct} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/admin/products')}>
                  <Settings className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Quick Add Tab */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-500 transform ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
          <Button 
            ref={quickAddRef}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
            onClick={handleAddToCartClick}
            disabled={product.stock === 0}
          >
            <ShoppingCart className="mr-2 h-4 w-4" /> {product.stock === 0 ? 'Out of Stock' : 'Quick Add'}
          </Button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex flex-col items-center text-center space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
            {product.isNewArrival && <span className="text-emerald-500">New Arrival</span>}
            {product.isFeatured && <span className="text-primary">Best Choice</span>}
          </div>
          <Link href={`/product/${product.slug}`} className="block group/title">
            <h3 className="text-lg font-bold tracking-tight line-clamp-1 group-hover/title:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          
          {(product.numReviews || 0) > 0 && (
            <div 
              className="flex items-center justify-center gap-1.5 mt-1"
              aria-label={`${product.ratings || 0} out of 5 stars, ${product.numReviews || 0} reviews`}
            >
              <RatingStars rating={product.ratings || 0} starClassName="h-3 w-3" />
              <span className="text-[10px] text-muted-foreground font-bold">({product.numReviews})</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xl font-black text-[#00a870]">
            ${Math.round(product.salePrice ?? product.price)}
          </span>
          {product.salePrice != null && product.salePrice < product.price && (
            <span className="text-sm text-muted-foreground line-through decoration-primary/20">
              ${Math.round(product.price)}
            </span>
          )}
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

