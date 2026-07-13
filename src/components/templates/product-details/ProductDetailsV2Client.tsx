/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Heart, Minus, Plus, Star, MoreVertical, Edit, Trash2, Settings, PlusCircle, ShieldCheck, Truck, RefreshCw, Share2 } from 'lucide-react';
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
import Image from 'next/image';
import { generateHtml } from '@/lib/server-html';
import ShareDialog from '@/components/storefront/ShareDialog';

const CURRENCY_SYMBOL = '৳';

interface ProductDetailsV2ClientProps {
  product: any;
}

export default function ProductDetailsV2Client({ product }: ProductDetailsV2ClientProps) {
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
    setQuantity(1);
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
    if (uniqueColors.length > 0 && !selectedColor) return toast.error('Select color');
    if (uniqueSizes.length > 0 && !selectedSize) return toast.error('Select size');
    
    if (displayStock <= 0) return toast.error('Out of stock');
    if (quantity > displayStock) {
      toast.error(`Only ${displayStock} items available in stock`);
      setQuantity(displayStock);
      return;
    }

    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      price: displaySalePrice ?? displayPrice,
      basePrice: displayPrice,
      quantity: quantity,
      image: activeVariant?.image || (product.variants && product.variants.length > 0 ? product.variants[0]?.image : product.images?.[0]),
      color: selectedColor || undefined,
      size: selectedSize || undefined
    }));
    toast.success(`Added ${product.name} to cart`);
    return true;
  };

  const handleFavorite = async () => {
    if (!session) return toast.error('Please login to save masterpiece');
    
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
        throw new Error('Failed to update wishlist on server');
      }
      
      toast.success(willBeInWishlist ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (err) {
      console.error('Wishlist sync error:', err);
      // Rollback
      dispatch(toggleWishlist(product._id));
      toast.error('Sync failed. Please try again.');
    }
  };

  const handleShare = () => {
    setIsShareOpen(true);
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
      toast.success('Masterpiece removed successfully');
      router.push('/shop');
    } catch (err: any) {
      toast.error(`Deletion failed: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const discount = (displayPrice > 0 && displaySalePrice && displaySalePrice < displayPrice)
    ? Math.round(((displayPrice - displaySalePrice) / displayPrice) * 100)
    : 0;

  return (
    <div className="grid lg:grid-cols-12 gap-12 animate-in fade-in duration-1000">
      {/* Left: Vertical Image List (Luxury Style) */}
      <div className="lg:col-span-7 space-y-8">
        <div className="grid grid-cols-1 gap-6">
          {allImages?.map((img: string, i: number) => (
            <div key={i} className="relative aspect-[3/4] rounded-[3rem] overflow-hidden bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-2xl shadow-black/5 group">
              <Image 
                src={img} 
                alt={`${product.name} - ${i + 1}`} 
                fill 
                className="object-cover transition-transform duration-[2000ms] group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
            </div>
          ))}
        </div>
      </div>

      {/* Right: Sticky Content Panel */}
      <div className="lg:col-span-5">
        <div className="sticky top-32 space-y-10">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="rounded-full px-4 py-1 border-primary text-primary font-black text-[10px] uppercase tracking-widest">Masterpiece</Badge>
                {discount > 0 && <Badge className="bg-red-500 rounded-full font-black text-[10px]">-{discount}% OFF</Badge>}
              </div>
              {isAdmin && (
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                        <MoreVertical className="h-5 w-5" />
                     </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end" className="rounded-2xl w-52">
                      <DropdownMenuItem onClick={() => router.push(`/admin/products/${product.slug}`)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowDeleteModal(true)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
              )}
            </div>

            <div className="space-y-2">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">{product.name}</h1>
              <div className="flex items-center gap-4">
                 <div className="flex text-primary">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                 </div>
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Handcrafted Excellence</span>
              </div>
            </div>

            <div className="flex items-end gap-6">
              <span className="text-4xl font-black text-foreground">{CURRENCY_SYMBOL}{displaySalePrice ?? displayPrice}</span>
              {displaySalePrice != null && displaySalePrice !== displayPrice && <span className="text-2xl text-muted-foreground line-through opacity-40 font-medium">{CURRENCY_SYMBOL}{displayPrice}</span>}
            </div>
          </div>

          <Separator className="bg-neutral-100 dark:bg-neutral-800" />

          {/* Options Selection */}
          <div className="space-y-8">
             {uniqueColors.length > 0 && (
                <div className="space-y-4">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Select Color Palette</span>
                   <div className="flex flex-wrap gap-3">
                      {uniqueColors.map((color) => (
                         <button 
                            key={color} 
                            onClick={() => setSelectedColor(color)}
                            className={`px-6 py-3 rounded-full border-2 transition-all font-bold text-xs uppercase tracking-widest ${selectedColor === color ? 'border-primary bg-primary text-white shadow-xl shadow-primary/20 scale-105' : 'border-neutral-100 dark:border-neutral-800 hover:border-primary/50'}`}
                         >
                            {color}
                         </button>
                      ))}
                   </div>
                </div>
             )}

             {uniqueSizes.length > 0 && (
                <div className="space-y-4">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Select Size Profile</span>
                   <div className="flex flex-wrap gap-2">
                      {uniqueSizes.map((size) => (
                         <button 
                            key={size} 
                            disabled={!availableSizes.includes(size)}
                            onClick={() => setSelectedSize(size)}
                            className={`h-12 w-12 rounded-2xl border-2 flex items-center justify-center transition-all font-black text-xs disabled:opacity-20 ${selectedSize === size ? 'border-primary bg-primary text-white scale-110 shadow-lg' : 'border-neutral-100 dark:border-neutral-800 hover:border-primary/50'}`}
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
                <div className="flex items-center border-2 border-neutral-100 dark:border-neutral-800 rounded-2xl h-16 bg-neutral-50 dark:bg-neutral-900/50">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    className="px-5 hover:text-primary transition-colors disabled:opacity-30"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <span className="w-10 text-center font-black text-lg">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(displayStock, quantity + 1))} 
                    className="px-5 hover:text-primary transition-colors disabled:opacity-30"
                    disabled={quantity >= displayStock}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <Button 
                  onClick={handleAddToCart}
                  disabled={displayStock <= 0}
                  className="h-16 flex-1 rounded-2xl bg-primary text-primary-foreground font-black text-lg uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                   {displayStock > 0 ? 'Inquire & Add' : 'Sold Out'}
                </Button>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-14 rounded-2xl gap-2 font-black uppercase text-[10px] tracking-widest" onClick={handleFavorite}>
                   <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-primary text-primary' : ''}`} /> Wishlist
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl gap-2 font-black uppercase text-[10px] tracking-widest" onClick={handleShare}>
                   <Share2 className="h-4 w-4" /> Share
                </Button>
             </div>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-10">
             {[
               { icon: Truck, label: 'Global Priority' },
               { icon: ShieldCheck, label: 'Secure Vault' },
               { icon: RefreshCw, label: 'Elite Returns' }
             ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                   <div className="h-12 w-12 rounded-2xl bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center text-primary shadow-sm border border-neutral-100 dark:border-neutral-800">
                      <item.icon className="h-6 w-6 stroke-[1.5]" />
                   </div>
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">{item.label}</span>
                </div>
             ))}
          </div>

          {/* Details & Reviews Tabs */}
          <div className="pt-12">
            <Tabs defaultValue="specs" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-8">
                 <TabsTrigger value="specs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-4 font-black uppercase tracking-widest text-[10px]">Specifications</TabsTrigger>
                 <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-4 font-black uppercase tracking-widest text-[10px]">Reviews</TabsTrigger>
              </TabsList>
              <TabsContent value="specs" className="py-8">
                 <div 
                    className="ProseMirror max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: generateHtml(product.description) }}
                 />
              </TabsContent>
              <TabsContent value="reviews" className="py-8">
                 <ReviewsSection productId={product._id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="rounded-[2rem]">
          <DialogHeader>
            <DialogTitle>Permanent Deletion</DialogTitle>
            <DialogDescription>This action will remove this masterpiece from the catalog permanently.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:justify-end mt-6">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="rounded-xl">Retain</Button>
            <Button variant="destructive" onClick={handleDeleteProduct} disabled={isDeleting} className="rounded-xl font-bold">{isDeleting ? 'Deleting...' : 'Confirm Deletion'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <ShareDialog
        isOpen={isShareOpen}
        onOpenChange={setIsShareOpen}
        title={product.name}
      />
    </div>
  );
}

