/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ShoppingCart, Heart, Share2, Star, Minus, Plus, ChevronRight, LayoutDashboard, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart } from '@/store/slices/cartSlice';
import { toggleWishlist } from '@/store/slices/wishlistSlice';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Swal from 'sweetalert2';
import { generateHtml } from '@/lib/server-html';

interface ProductDetailsV3ClientProps {
  product: any;
}

export default function ProductDetailsV3Client({ product }: ProductDetailsV3ClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const wishlist = useAppSelector((state) => state.wishlist.items);
  const isInWishlist = wishlist.includes(product._id);
  const isAdmin = (session?.user as any)?.role === 'admin';

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
  const [selectedColor, setSelectedColor] = useState<string | null>(defaultVariant?.color || null);
  const [selectedSize, setSelectedSize] = useState<string | null>(defaultVariant?.size || null);

  const uniqueColors = useMemo(() => 
    Array.from(new Set((product.variants || []).map((v: any) => v.color).filter(Boolean))) as any[],
    [product.variants]
  );

  const uniqueSizes = useMemo(() => 
    Array.from(new Set((product.variants || []).map((v: any) => v.size).filter(Boolean))) as any[],
    [product.variants]
  );

  const availableSizes = useMemo(() => {
    if (!selectedColor) return uniqueSizes;
    return (product.variants || [])
      .filter((v: any) => v.color === selectedColor)
      .map((v: any) => v.size)
      .filter(Boolean) as any[];
  }, [product.variants, selectedColor, uniqueSizes]);

  useEffect(() => {
    if (!product) return;
    setSelectedColor(uniqueColors[0] || null);
  }, [product?._id, uniqueColors]);

  useEffect(() => {
    if (selectedSize == null || !availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes[0] || null);
    }
  }, [selectedColor, availableSizes, selectedSize]);

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
    setSelectedImage(0);
  }, [activeVariant]);

  const hasVariants = (uniqueColors.length > 0 || uniqueSizes.length > 0);
  const currentVariant = activeVariant || defaultVariant;

  const displayPrice = hasVariants ? (currentVariant?.price ?? 0) : product.price;
  const displaySalePrice = hasVariants ? currentVariant?.salePrice : product.salePrice;
  const displayStock = hasVariants ? (currentVariant?.stock ?? 0) : (product.stock ?? 0);

  const handleAddToCart = () => {
    if (displayStock <= 0) return toast.error('Selection Unavailable');
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
    toast.success(`${product.name} initialized in cart`);
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
        throw new Error('Server sync failed');
      }
      
      toast.success(willBeInWishlist ? 'Saved to collection' : 'Removed from collection');
    } catch (err) {
      console.error('Wishlist error:', err);
      // Revert on failure
      dispatch(toggleWishlist(product._id));
      toast.error('Unable to update collection. Please try again.');
    }
  };

  const handleDeleteProduct = async () => {
    const result = await Swal.fire({
      title: 'Purge Product?',
      text: 'Execute deletion sequence? This action is irreversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Execute Purge'
    });

    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/products/${product.slug}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Product purged from system');
        router.push('/shop');
      } else {
        toast.error('System bypass failed');
      }
    } catch (err) {
      toast.error('Deletion error');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Visual Architecture */}
          <div className="space-y-6">
             <div className="relative aspect-square rounded-[3rem] overflow-hidden bg-neutral-50 dark:bg-neutral-900 border-2 border-neutral-100 dark:border-neutral-800 group">
                 <Image 
                   src={allImages[selectedImage] || '/placeholder.png'} 
                   alt={product.name} 
                   fill 
                   className="object-cover transition-transform duration-[2s] group-hover:scale-105"
                 />
                
                {isAdmin && (
                  <div className="absolute top-8 right-8 z-20">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="outline" className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-xl border-white/30 hover:bg-white/40">
                          <Settings className="h-6 w-6 text-white" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-neutral-100 shadow-2xl">
                        <DropdownMenuItem onClick={() => router.push(`/admin/products/${product.slug}`)} className="rounded-xl cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" /> Edit Parameters
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDeleteProduct} className="rounded-xl cursor-pointer text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Purge Product
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                <div className="absolute bottom-8 left-8 flex flex-col gap-2">
                   {product.isNewArrival && <Badge className="w-fit bg-emerald-500 rounded-lg font-mono px-3 py-1 text-[10px]">VER_2026.0</Badge>}
                   <Badge variant="outline" className="w-fit backdrop-blur-md bg-white/10 text-white border-white/20 rounded-lg font-mono px-3 py-1 text-[10px]">
                      {displayStock > 0 ? `SYS_READY: ${displayStock}U` : 'SYS_OFFLINE'}
                   </Badge>
                </div>
             </div>
             
             <div className="grid grid-cols-4 gap-4">
                {allImages?.map((img: string, i: number) => (
                   <div 
                     key={i} 
                     onClick={() => setSelectedImage(i)}
                     className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${selectedImage === i ? 'border-primary' : 'border-neutral-100 dark:border-neutral-800 hover:border-primary'}`}
                   >
                      <Image src={img} alt={`${product.name} ${i}`} fill className="object-cover" />
                   </div>
                ))}
             </div>
          </div>

          {/* Technical Data Sheet */}
          <div className="flex flex-col">
             <div className="mb-10 space-y-4">
                <div className="flex items-center gap-3">
                   <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                   <span className="text-[10px] font-mono font-black text-primary uppercase tracking-[0.4em]">Product_Intelligence</span>
                </div>
                <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none">{product.name}</h1>
                <div className="flex items-center gap-6 pt-4">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-mono text-muted-foreground uppercase mb-1">Base_Val</span>
                      <span className="text-4xl font-black">${displaySalePrice || displayPrice}</span>
                   </div>
                   {displaySalePrice && (
                     <div className="flex flex-col">
                        <span className="text-[8px] font-mono text-muted-foreground uppercase mb-1">Prev_Val</span>
                        <span className="text-2xl font-bold text-muted-foreground line-through opacity-30">${displayPrice}</span>
                     </div>
                   )}
                </div>
             </div>

             <div className="space-y-12 mb-12">
                {uniqueColors.length > 0 && (
                   <div className="space-y-4">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.3em]">C_ID / Aesthetic</span>
                      <div className="flex gap-4">
                         {uniqueColors.map((color: any) => (
                            <button 
                              key={color} 
                              onClick={() => setSelectedColor(color)}
                              className={`group relative h-12 w-12 rounded-full p-1 border-2 transition-all ${selectedColor === color ? 'border-primary scale-110' : 'border-transparent hover:border-neutral-200'}`}
                            >
                               <div className="h-full w-full rounded-full border border-black/5 shadow-inner" style={{ backgroundColor: color }} />
                               <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity uppercase">{color}</span>
                            </button>
                         ))}
                      </div>
                   </div>
                )}
                {uniqueSizes.length > 0 && (
                   <div className="space-y-4">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.3em]">S_ID / Size</span>
                      <div className="flex flex-wrap gap-2">
                         {uniqueSizes.map((size: any) => (
                            <button 
                              key={size} 
                              disabled={!availableSizes.includes(size)}
                              onClick={() => setSelectedSize(size)}
                              className={`h-10 w-10 rounded-xl border-2 flex items-center justify-center font-mono text-xs font-black transition-all ${selectedSize === size ? 'border-primary bg-primary text-white scale-110 shadow-lg' : 'border-neutral-100 dark:border-neutral-800 hover:border-primary'}`}
                            >
                               {size}
                            </button>
                         ))}
                      </div>
                   </div>
                )}
             </div>

             {/* Technical Action Panel */}
             <div className="flex flex-col gap-4 p-6 rounded-[2.5rem] bg-neutral-50 dark:bg-neutral-900 border-2 border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-4">
                   <div className="flex items-center border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl h-14 bg-background">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                        className="px-5 hover:text-primary disabled:opacity-30"
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center font-mono font-black text-lg">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(Math.min(displayStock, quantity + 1))} 
                        className="px-5 hover:text-primary disabled:opacity-30"
                        disabled={quantity >= displayStock}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                   </div>
                   <Button 
                     size="lg" 
                     onClick={handleAddToCart}
                     disabled={displayStock <= 0}
                     className="h-14 flex-1 rounded-2xl bg-primary text-white font-mono font-black text-lg gap-3 uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
                   >
                      <ShoppingCart className="h-5 w-5" /> {displayStock > 0 ? 'Initialize Purchase' : 'System Offline'}
                   </Button>
                </div>
                
                <div className="flex gap-4">
                   <Button variant="outline" className="flex-1 h-14 rounded-2xl border-2 font-mono font-black text-[10px] uppercase tracking-widest gap-2" onClick={handleFavorite}>
                      <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-primary text-primary' : ''}`} /> Save_Collection
                   </Button>
                   <Button variant="outline" className="h-14 w-14 rounded-2xl border-2" onClick={() => {
                      if (navigator.share) navigator.share({ title: product.name, url: window.location.href });
                      else { navigator.clipboard.writeText(window.location.href); toast.success('Link Manifested'); }
                   }}>
                      <Share2 className="h-4 w-4" />
                   </Button>
                </div>
             </div>

             <div className="mt-12 space-y-6 pt-12 border-t border-neutral-100 dark:border-neutral-800">
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-1">
                      <span className="text-[8px] font-mono text-muted-foreground uppercase">Material_Spec</span>
                      <p className="text-xs font-bold uppercase tracking-tighter italic">High-Grade Technical Fabric</p>
                   </div>
                   <div className="space-y-1">
                      <span className="text-[8px] font-mono text-muted-foreground uppercase">Origin_Trace</span>
                      <p className="text-xs font-bold uppercase tracking-tighter italic">Boutique Atelier_01</p>
                   </div>
                </div>
                <div 
                   className="ProseMirror max-w-none text-muted-foreground"
                   dangerouslySetInnerHTML={{ __html: generateHtml(product.description) }}
                />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

