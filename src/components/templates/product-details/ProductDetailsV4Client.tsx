/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Heart, Minus, Plus, Star, MoreVertical, Edit, Trash2, Settings, ShieldCheck, Clock, Share2, Tag, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart } from '@/store/slices/cartSlice';
import { toggleWishlist } from '@/store/slices/wishlistSlice';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import ReviewsSection from '@/components/storefront/ReviewsSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProductImageGallery } from '@/components/storefront/ProductImageGallery';
import { generateHtml } from '@/lib/server-html';
import ShareDialog from '@/components/storefront/ShareDialog';

const CURRENCY_SYMBOL = '৳';

interface ProductDetailsV4ClientProps {
  product: any;
}

export default function ProductDetailsV4Client({ product }: ProductDetailsV4ClientProps) {
  const dispatch = useAppDispatch();
  const { data: session } = useSession();
  const wishlist = useAppSelector((state) => state.wishlist.items);
  const isInWishlist = wishlist.includes(product?._id);
  const router = useRouter();
  const isAdmin = (session?.user as any)?.role === 'admin';

  const [quantity, setQuantity] = useState(1);
  const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
  const [selectedColor, setSelectedColor] = useState<string | null>(defaultVariant?.color || null);
  const [selectedSize, setSelectedSize] = useState<string | null>(defaultVariant?.size || null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const uniqueColors = useMemo(() =>
    Array.from(new Set((product.variants || []).map((v: any) => v.color))).filter(Boolean) as string[],
    [product.variants]
  );

  const uniqueSizes = useMemo(() =>
    Array.from(new Set((product.variants || []).map((v: any) => v.size))).filter(Boolean) as string[],
    [product.variants]
  );

  const availableSizes = useMemo(() =>
    (product.variants || [])
      .filter((v: any) => !selectedColor || v.color === selectedColor)
      .map((v: any) => v.size)
      .filter(Boolean) as string[],
    [product.variants, selectedColor]
  );
  const activeVariant = useMemo(() =>
    (product.variants || []).find(
      (v: any) =>
        (v.color || null) === (selectedColor || null) &&
        (v.size || null) === (selectedSize || null)
    ),
    [product.variants, selectedColor, selectedSize]
  );

  const allImages = useMemo(() => {
    if (activeVariant) {
      const activeImages = [
        ...(activeVariant.images || []),
        activeVariant.image
      ].filter(Boolean) as string[];
      if (activeImages.length > 0) {
        return Array.from(new Set(activeImages));
      }
    }
    return product.images || [];
  }, [product.images, activeVariant]);

  const hasVariants = (uniqueColors.length > 0 || uniqueSizes.length > 0);
  const currentVariant = activeVariant || defaultVariant;

  const displayPrice = hasVariants ? (currentVariant?.price ?? 0) : product.price;
  const displaySalePrice = hasVariants ? currentVariant?.salePrice : product.salePrice;
  const displayStock = hasVariants ? (currentVariant?.stock ?? 0) : (product.stock ?? 0);

  useEffect(() => {
    if (!product) return;
    setSelectedColor(uniqueColors[0] || null);
  }, [product?._id, uniqueColors]);

  useEffect(() => {
    if (selectedSize == null || !availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes[0] || null);
    }
  }, [selectedColor, availableSizes, selectedSize]);

  useEffect(() => {
    if (quantity > displayStock) {
      setQuantity(Math.max(1, displayStock));
    }
  }, [displayStock, quantity]);

  const handleAddToCart = () => {
    if (displayStock <= 0) {
      toast.error('Item is currently unavailable');
      return false;
    }

    if (quantity > displayStock) {
      toast.error(`Only ${displayStock} units`);
      setQuantity(displayStock);
      return false;
    }

    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      price: displaySalePrice || displayPrice,
      basePrice: displayPrice,
      quantity: quantity,
      image: activeVariant?.image || (product.variants && product.variants.length > 0 ? product.variants[0]?.image : product.images?.[0]),
      color: selectedColor || undefined,
      size: selectedSize || undefined
    }));
    toast.success(`Item added to your collection`);
    return true;
  };

  const handleFavorite = async () => {
    if (!session) return toast.error('Authentication required');

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

      toast.success(willBeInWishlist ? 'Saved to collection' : 'Removed from collection');
    } catch (err) {
      console.error('Wishlist error:', err);
      // Revert
      dispatch(toggleWishlist(product._id));
      toast.error('Unable to sync collection. Please try again.');
    }
  };

  const handleBuyNow = async () => {
    const success = handleAddToCart();
    if (success) {
      router.push('/checkout');
    }
  };

  const handleDeleteProduct = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${product.slug}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete product');
      }
      toast.success('Selection removed from collection');
      router.push('/shop');
    } catch (err: any) {
      toast.error(`Removal failed: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const discount = (displayPrice > 0 && displaySalePrice && displaySalePrice < displayPrice)
    ? Math.round(((displayPrice - displaySalePrice) / displayPrice) * 100)
    : 0;

  return (
    <div className="grid lg:grid-cols-2 gap-16 animate-in fade-in duration-1000">
      {/* Serenity Gallery */}
      <div className="space-y-6">
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-[3rem] p-6 shadow-sm">
          <ProductImageGallery images={allImages} />
        </div>
        <div className="flex items-center justify-center gap-12 pt-4">
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Store Official</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center text-primary">
              <Clock className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rapid Courier</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center text-primary">
              <Tag className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Best Price</span>
          </div>
        </div>
      </div>

      {/* Boutique Details */}
      <div className="flex flex-col py-6 space-y-10">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.3em]">
              <Star className="h-3 w-3 fill-current" /> Boutique Selection
            </div>
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl">
                  <DropdownMenuItem onClick={() => router.push(`/admin/products/${product.slug}`)}>Edit Selection</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowDeleteModal(true)} className="text-destructive">Remove Selection</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <h1 className="text-5xl md:text-6xl font-serif italic tracking-tight leading-tight">{product.name}</h1>

          <div className="flex items-center gap-6">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black">{CURRENCY_SYMBOL}{displaySalePrice || displayPrice}</span>
              {displaySalePrice && <span className="text-xl text-muted-foreground line-through opacity-40 font-medium">{CURRENCY_SYMBOL}{displayPrice}</span>}
            </div>
            {discount > 0 && <Badge variant="outline" className="rounded-full border-primary text-primary px-4 py-1 font-black text-[10px] uppercase tracking-widest">Saving {discount}%</Badge>}
          </div>
        </div>

        <Separator className="bg-neutral-100 dark:bg-neutral-800" />

        <div className="space-y-8">
          {uniqueColors.length > 0 && (
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Color Palette</span>
              <div className="flex flex-wrap gap-3">
                {uniqueColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`h-12 px-6 rounded-2xl border-2 transition-all font-bold text-xs uppercase tracking-widest ${selectedColor === color ? 'border-primary bg-primary text-white shadow-xl shadow-primary/10' : 'border-neutral-100 dark:border-neutral-800 hover:border-primary/50'}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}
          {uniqueSizes.length > 0 && (
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Size Profile</span>
              <div className="flex flex-wrap gap-2">
                {uniqueSizes.map((size) => (
                  <button
                    key={size}
                    disabled={!availableSizes.includes(size)}
                    onClick={() => setSelectedSize(size)}
                    className={`h-12 w-12 rounded-2xl border-2 flex items-center justify-center font-black text-xs transition-all ${selectedSize === size ? 'border-primary bg-primary text-white shadow-lg' : 'border-neutral-100 dark:border-neutral-800 hover:border-primary/50'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center border rounded-[1.5rem] h-16 bg-neutral-50 dark:bg-neutral-900/50">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-6 hover:text-primary transition-colors disabled:opacity-30"
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-black text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                className="px-6 hover:text-primary transition-colors disabled:opacity-30"
                disabled={quantity >= displayStock}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={displayStock <= 0}
              className="h-16 flex-1 rounded-[1.5rem] bg-primary text-white font-black text-lg uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <ShoppingCart className="mr-3 h-5 w-5" /> {displayStock > 0 ? 'Add to Bag' : 'Sold Out'}
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full h-16 rounded-[1.5rem] border-2 border-neutral-200 dark:border-neutral-800 font-black text-lg uppercase tracking-[0.2em] hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all"
            onClick={handleBuyNow}
          >
            <ShoppingBag className="mr-3 h-5 w-5" /> Express Checkout
          </Button>
          <div className="flex justify-center gap-8 pt-4">
            <button onClick={handleFavorite} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
              <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-primary text-primary' : ''}`} /> Save for Later
            </button>
            <button
              onClick={() => setIsShareOpen(true)}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
            >
              <Share2 className="h-4 w-4" /> Share Collection
            </button>
          </div>
        </div>

        <div className="pt-10">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start gap-10 border-b rounded-none h-auto p-0 bg-transparent mb-8">
              <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-4 font-black uppercase text-[10px] tracking-widest text-muted-foreground data-[state=active]:text-foreground">About Piece</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-4 font-black uppercase text-[10px] tracking-widest text-muted-foreground data-[state=active]:text-foreground">Client Feedback ({product.numReviews || 0})</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="animate-in fade-in duration-500">
               <div 
                  className="ProseMirror max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: generateHtml(product.description) }}
               />
            </TabsContent>
            <TabsContent value="reviews" className="animate-in fade-in duration-500">
               <ReviewsSection productId={product._id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="rounded-[3rem]">
          <DialogHeader>
            <DialogTitle className="font-serif italic text-2xl">Remove Selection</DialogTitle>
            <DialogDescription>Are you sure you wish to remove this piece from the boutique?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="rounded-2xl">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProduct} disabled={isDeleting} className="rounded-2xl font-bold">{isDeleting ? 'Removing...' : 'Confirm Removal'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ShareDialog isOpen={isShareOpen} onOpenChange={setIsShareOpen} title={product.name} />
    </div>
  );
}

