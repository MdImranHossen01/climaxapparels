/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Heart, Minus, Plus, Star, MoreVertical, Edit, Trash2, Settings, Sparkles, Share2, ArrowRight, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
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

const CURRENCY_SYMBOL = '$';

interface ProductDetailsV5ClientProps {
  product: any;
}

export default function ProductDetailsV5Client({ product }: ProductDetailsV5ClientProps) {
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
  const [activeImage, setActiveImage] = useState(
    (product?.variants && product.variants.length > 0 ? product.variants[0]?.image : product?.images?.[0]) || '/placeholder.png'
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  useEffect(() => {
    if (allImages && allImages.length > 0) {
      setActiveImage(allImages[0]);
    } else {
      setActiveImage('/placeholder.png');
    }
  }, [allImages]);

  useEffect(() => {
    if (!product) return;
    setSelectedColor(uniqueColors[0] || null);
    setActiveImage(
      (product.variants && product.variants.length > 0 ? product.variants[0]?.image : product.images?.[0]) || '/placeholder.png'
    );
  }, [product?._id, uniqueColors]);

  useEffect(() => {
    if (selectedSize == null || !availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes[0] || null);
    }
  }, [selectedColor, availableSizes]);

  const hasVariants = (uniqueColors.length > 0 || uniqueSizes.length > 0);
  const currentVariant = activeVariant || defaultVariant;

  const displayPrice = hasVariants ? (currentVariant?.price ?? 0) : product.price;
  const displaySalePrice = hasVariants ? currentVariant?.salePrice : product.salePrice;
  const displayStock = hasVariants ? (currentVariant?.stock ?? 0) : (product.stock ?? 0);

  const handleAddToCart = () => {
    if (displayStock <= 0) return toast.error('Unavailable');
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
    toast.success(`Exclusive piece added to bag`);
  };

  const handleFavorite = async () => {
    if (!session) return toast.error('Discovery requires login');
    
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
        throw new Error('Sync failed with server');
      }
      
      toast.success(willBeInWishlist ? 'Saved to Atelier' : 'Removed from Atelier');
    } catch (err) {
      console.error('Wishlist error:', err);
      // Revert
      dispatch(toggleWishlist(product._id));
      toast.error('Unable to sync collection. Please try again.');
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
      toast.success('Piece removed from atelier');
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
    <div className="flex flex-col lg:flex-row min-h-screen animate-in fade-in duration-1000">
      {/* Left: Immersive Visuals */}
      <div className="lg:w-1/2 h-[70vh] lg:h-screen sticky top-0 overflow-hidden group">
         <Image 
            src={activeImage} 
            alt={product.name} 
            fill 
            className="object-cover transition-all duration-[2s] group-hover:scale-105" 
            priority
         />
         <div className="absolute inset-0 bg-black/10" />
         
         <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-4 p-4 bg-white/10 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 shadow-2xl">
            {allImages?.slice(0, 6).map((img: string, i: number) => (
               <button 
                  key={img}
                  onClick={() => setActiveImage(img)}
                  className={`relative h-20 w-20 rounded-2xl overflow-hidden border-4 transition-all duration-500 ${activeImage === img ? 'border-primary scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
               >
                  <Image src={img} alt={`Slide ${i + 1}`} fill className="object-cover" />
               </button>
            ))}
         </div>
      </div>

      {/* Right: Scrolling Details */}
      <div className="lg:w-1/2 bg-background p-8 md:p-16 lg:p-24 flex flex-col justify-center">
         <div className="max-w-2xl mx-auto w-full space-y-12">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.4em] text-[10px]">
                   <Sparkles className="h-4 w-4 fill-current" /> Intentionally Crafted
                </div>
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-3xl w-52">
                      <DropdownMenuItem onClick={() => router.push(`/admin/products/${product.slug}`)}>Edit Piece</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowDeleteModal(true)} className="text-destructive">Remove Piece</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-none">{product.name}</h1>
              <div className="flex items-baseline gap-6">
                 <span className="text-5xl font-black">{CURRENCY_SYMBOL}{displaySalePrice || displayPrice}</span>
                 {displaySalePrice && <span className="text-2xl text-muted-foreground line-through opacity-30 font-medium">{CURRENCY_SYMBOL}{displayPrice}</span>}
              </div>
            </div>

            <p className="text-xl text-muted-foreground leading-relaxed font-medium italic">
               {product.description}
            </p>

            <Separator />

            <div className="space-y-10">
               {uniqueColors.length > 0 && (
                  <div className="space-y-4">
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Color Palette</span>
                     <div className="flex flex-wrap gap-4">
                        {uniqueColors.map((color) => (
                           <button 
                             key={color} 
                             onClick={() => setSelectedColor(color)}
                             className={`px-8 py-4 rounded-full border-2 transition-all font-black text-xs uppercase tracking-[0.2em] ${selectedColor === color ? 'border-primary bg-primary text-white shadow-2xl shadow-primary/30 scale-105' : 'border-neutral-100 dark:border-neutral-800 hover:border-primary/50'}`}
                           >
                              {color}
                           </button>
                        ))}
                     </div>
                  </div>
               )}

               {uniqueSizes.length > 0 && (
                  <div className="space-y-4">
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Selection Size</span>
                     <div className="flex flex-wrap gap-3">
                        {uniqueSizes.map((size) => (
                           <button 
                             key={size} 
                             disabled={!availableSizes.includes(size)}
                             onClick={() => setSelectedSize(size)}
                             className={`h-14 w-14 rounded-full border-2 flex items-center justify-center font-black text-xs transition-all ${selectedSize === size ? 'border-primary bg-primary text-white scale-110' : 'border-neutral-100 dark:border-neutral-800 hover:border-primary/50'}`}
                           >
                              {size}
                           </button>
                        ))}
                     </div>
                  </div>
               )}
            </div>

            <div className="flex flex-col gap-6 pt-6">
               <div className="flex items-center gap-6">
                  <div className="flex items-center border-b border-neutral-100 dark:border-neutral-800 h-16 w-40">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                      className="px-6 hover:text-primary transition-colors disabled:opacity-30"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="flex-1 text-center font-serif italic text-xl">{quantity}</span>
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
                    className="h-16 flex-1 rounded-full bg-primary text-white font-black text-xl uppercase tracking-widest shadow-[0_20px_40px_-10px_rgba(var(--primary-rgb),0.4)] hover:scale-[1.02] active:scale-95 transition-all"
                  >
                     {displayStock > 0 ? 'Reserve Piece' : 'Sold Out'}
                  </Button>
               </div>
               <div className="flex gap-10 pt-4">
                 <button onClick={handleFavorite} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 hover:text-primary transition-all">
                    <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-primary text-primary' : ''}`} /> Atelier_Save
                 </button>
                 <button 
                    onClick={async () => {
                       const shareData = { title: product.name, url: window.location.href };
                       try {
                          if (navigator.share) {
                             await navigator.share(shareData);
                          } else {
                             await navigator.clipboard.writeText(window.location.href);
                             toast.success('Link Manifested');
                          }
                       } catch (err: any) {
                          if (err.name !== 'AbortError') {
                             toast.error('Sharing failed');
                          }
                       }
                    }} 
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 hover:text-primary transition-all"
                 >
                    <Share2 className="h-4 w-4" /> Atelier_Share
                 </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-10 pt-16 border-t border-neutral-100 dark:border-neutral-800">
               {[
                 { icon: Truck, label: 'Concierge Delivery' },
                 { icon: ShieldCheck, label: 'Authentic Vault' },
                 { icon: RefreshCw, label: 'Seamless Exchange' }
               ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-4 text-center">
                     <div className="h-14 w-14 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                        <item.icon className="h-7 w-7 stroke-[1.5]" />
                     </div>
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{item.label}</span>
                  </div>
               ))}
            </div>

            <div className="pt-20">
               <Tabs defaultValue="reviews" className="w-full">
                  <TabsList className="w-full justify-start gap-12 border-b rounded-none h-auto p-0 bg-transparent mb-12">
                     <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-6 font-black uppercase text-[10px] tracking-[0.3em]">Client Experiences ({product.numReviews || 0})</TabsTrigger>
                     <TabsTrigger value="story" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-6 font-black uppercase text-[10px] tracking-[0.3em]">The Story</TabsTrigger>
                  </TabsList>
                  <TabsContent value="reviews" className="animate-in fade-in duration-500">
                     <ReviewsSection productId={product._id} />
                  </TabsContent>
                  <TabsContent value="story" className="animate-in fade-in duration-500">
                     <div 
                        className="ProseMirror max-w-none text-muted-foreground italic text-lg leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: generateHtml(product.description) }}
                     />
                  </TabsContent>
               </Tabs>
            </div>
         </div>
      </div>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="rounded-[4rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif italic text-3xl">Permanent Removal</DialogTitle>
            <DialogDescription className="text-lg">Are you sure you wish to permanently remove this piece from the atelier?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-6 mt-10">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)} className="rounded-full h-14 px-8">Abort</Button>
            <Button variant="destructive" onClick={handleDeleteProduct} disabled={isDeleting} className="rounded-full h-14 px-8 font-black">{isDeleting ? 'Removing...' : 'Confirm Removal'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

