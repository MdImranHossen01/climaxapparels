/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  Heart,
  Minus,
  Plus,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  Settings,
  PlusCircle,
  Loader2,
  Share2
} from 'lucide-react';
import { generateHtml } from '@/lib/server-html';
import ShareDialog from '@/components/storefront/ShareDialog';
import { RatingStars } from '@/components/ui/rating-stars';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart } from '@/store/slices/cartSlice';
import { toggleWishlist } from '@/store/slices/wishlistSlice';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { Suspense } from 'react';
import Image from 'next/image';
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
import { fbEvent } from '@/lib/fpixel';
import { ttEvent } from '@/lib/tiktok';

const CURRENCY_SYMBOL = '$';

interface ProductDetailsClientProps {
  product: any;
}

export default function ProductDetailsClient({ product }: ProductDetailsClientProps) {
  const dispatch = useAppDispatch();
  const { data: session } = useSession();
  const wishlist = useAppSelector((state) => state.wishlist.items);
  const isInWishlist = wishlist.includes(product?._id);
  const router = useRouter();
  const isAdmin = (session?.user as any)?.role === 'admin';

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, percentageX: 0, percentageY: 0 });
  const [showZoom, setShowZoom] = useState(false);
  const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
  const [selectedColor, setSelectedColor] = useState<string | null>(defaultVariant?.color || null);
  const [selectedSize, setSelectedSize] = useState<string | null>(defaultVariant?.size || null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [eligibility, setEligibility] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('description');
  const [shouldScrollToReviewForm, setShouldScrollToReviewForm] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Derive available options from variants
  const uniqueColors = useMemo(() =>
    Array.from(new Set((product.variants || []).map((v: any) => v.color))).filter(Boolean) as string[],
    [product.variants]
  );

  const uniqueSizes = useMemo(() =>
    Array.from(new Set((product.variants || []).map((v: any) => v.size))).filter(Boolean) as string[],
    [product.variants]
  );

  // Hierarchical filtering (only show sizes that have stock for selected color)
  const availableSizes = useMemo(() =>
    (product.variants || [])
      .filter((v: any) => (!selectedColor || v.color === selectedColor) && (v.stock || 0) > 0)
      .map((v: any) => v.size)
      .filter(Boolean) as string[],
    [product.variants, selectedColor]
  );

  const activeVariant = useMemo(() =>
    (product.variants || []).find(
      (v: any) =>
        String(v.color || '').trim() === String(selectedColor || '').trim() &&
        String(v.size || '').trim() === String(selectedSize || '').trim()
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

  // Reset selected image when active variant changes to avoid out-of-bounds indices
  useEffect(() => {
    setSelectedImage(0);
  }, [activeVariant]);


  // Auto-select first available options on mount or product change
  useEffect(() => {
    if (!product) return;

    const initialColor = uniqueColors[0] || null;
    setSelectedColor(initialColor);

    const initialSizes = (product.variants || [])
      .filter((v: any) => !initialColor || v.color === initialColor)
      .map((v: any) => v.size)
      .filter(Boolean);
    const initialSize = initialSizes[0] || null;
    setSelectedSize(initialSize);

    setSelectedImage(0);
    setQuantity(1);

    // Track ViewContent
    const viewContentPayload = {
      content_name: product.name,
      content_category: product.categories?.[0]?.name || 'Uncategorized',
      content_ids: [product._id],
      content_type: 'product',
      value: product.salePrice || product.price,
      currency: 'BDT'
    };
    const trackingUser = {
      em: session?.user?.email || undefined,
      ph: (session?.user as any)?.phone || undefined,
      fn: session?.user?.name || undefined
    };

    fbEvent('ViewContent', viewContentPayload, trackingUser);
    ttEvent('ViewContent', viewContentPayload, trackingUser);
  }, [product?._id, uniqueColors, product.variants, session]);

  // Fetch review eligibility separately to avoid unnecessary re-triggers
  useEffect(() => {
    if (!session?.user || !product?._id) {
      setEligibility(null);
      return;
    }

    const controller = new AbortController();
    setEligibility(null); // Reset to avoid stale UI

    async function checkEligibility() {
      try {
        const res = await fetch(`/api/reviews/check-eligibility?productId=${product._id}`, {
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          setEligibility(data);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Eligibility Check Error:', error);
        }
      }
    }

    checkEligibility();
    return () => controller.abort();
  }, [product?._id, session]);

  // Handle scroll to review form when tab changes and scroll is requested
  useEffect(() => {
    if (activeTab === 'reviews' && shouldScrollToReviewForm) {
      const element = document.getElementById('review-form');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setShouldScrollToReviewForm(false);
      } else {
        // If element not yet in DOM, retry briefly
        const timer = setTimeout(() => {
          document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setShouldScrollToReviewForm(false);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [activeTab, shouldScrollToReviewForm]);

  // Adjust selection if dependencies change and current choice is unavailable
  useEffect(() => {
    if (selectedSize == null || !availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes[0] || null);
    }

    // Update main image if variant has one
    const activeImg = activeVariant?.images?.[0] || activeVariant?.image;
    if (activeImg) {
      const variantImgIndex = (allImages || []).findIndex((img: string) => img === activeImg);
      if (variantImgIndex !== -1) {
        setSelectedImage(variantImgIndex);
      }
    }
  }, [selectedColor, selectedSize, availableSizes, activeVariant, allImages]);

  const hasVariants = (uniqueColors.length > 0 || uniqueSizes.length > 0);
  const currentVariant = activeVariant || defaultVariant;

  const displayPrice = hasVariants ? (currentVariant?.price ?? 0) : product.price;
  const displaySalePrice = hasVariants ? currentVariant?.salePrice : product.salePrice;
  const displayStock = hasVariants ? (currentVariant?.stock ?? 0) : (product.stock ?? 0);
  const displaySku = hasVariants ? (currentVariant?.sku ?? '') : product.sku;

  // Debug log for troubleshooting stock discrepancies
  useEffect(() => {
    if (selectedSize || selectedColor) {
      console.log('--- Variant Stock Debug ---');
      console.log('Selected:', { color: selectedColor, size: selectedSize });
      console.log('Active Variant:', activeVariant);
      console.log('Computed displayStock:', displayStock);
    }
  }, [selectedColor, selectedSize, activeVariant, displayStock]);
  const handleAddToCart = () => {
    if (uniqueColors.length > 0 && !selectedColor) {
      toast.error('Please select a color');
      return false;
    }
    if (uniqueSizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return false;
    }

    const stock = displayStock || 0;
    if (stock <= 0) {
      toast.error('This item is currently out of stock');
      return false;
    }

    const finalQuantity = quantity > stock ? stock : quantity;
    if (quantity > stock) {
      toast.info(`Adjusted quantity to ${stock} (available stock)`);
    }

    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      price: displaySalePrice || displayPrice,
      basePrice: displayPrice,
      quantity: finalQuantity,
      image: activeVariant?.images?.[0] || activeVariant?.image || (product.variants && product.variants.length > 0 ? (product.variants[0]?.images?.[0] || product.variants[0]?.image) : product.images?.[0]),
      color: selectedColor || undefined,
      size: selectedSize || undefined
    }));

    // Track AddToCart
    const addToCartPayload = {
      content_name: product.name,
      content_category: product.categories?.[0]?.name || 'Uncategorized',
      content_ids: [product._id],
      content_type: 'product',
      value: (displaySalePrice || displayPrice) * finalQuantity,
      currency: 'BDT',
      quantity: finalQuantity
    };
    const trackingUser = {
      em: session?.user?.email || undefined,
      ph: (session?.user as any)?.phone || undefined,
      fn: session?.user?.name || undefined
    };

    fbEvent('AddToCart', addToCartPayload, trackingUser);
    ttEvent('AddToCart', addToCartPayload, trackingUser);

    toast.success(`Added ${finalQuantity} ${product.name} to cart`);
    return true;
  };

  const handleBuyNow = () => {
    const success = handleAddToCart();
    if (success) {
      router.push('/checkout');
    }
  };

  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setWhatsappNumber(data.socialLinks?.whatsapp || null);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleFavorite = async () => {
    if (!product?._id) return;

    if (!session) {
      toast.error('Please login to add to wishlist');
      return;
    }

    // Toggle locally (optimistic update)
    dispatch(toggleWishlist(product._id));

    // Determine the message based on the NEW state
    const willBeInWishlist = !isInWishlist;
    const successMsg = willBeInWishlist ? 'Added to wishlist' : 'Removed from wishlist';

    // If authenticated, update database and wait for response
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id }),
      });

      if (!res.ok) {
        throw new Error('Failed to update wishlist server-side');
      }

      // Only show success toast after server confirmation
      toast.success(successMsg);

      if (willBeInWishlist) {
        // Track AddToWishlist
        const addToWishlistPayload = {
          content_name: product.name,
          content_category: product.categories?.[0]?.name || 'Uncategorized',
          content_ids: [product._id],
          content_type: 'product',
          value: displaySalePrice || displayPrice,
          currency: 'BDT'
        };
        const trackingUser = {
          em: session?.user?.email || undefined,
          ph: (session?.user as any)?.phone || undefined,
          fn: session?.user?.name || undefined
        };

        fbEvent('AddToWishlist', addToWishlistPayload, trackingUser);
        ttEvent('AddToWishlist', addToWishlistPayload, trackingUser);
      }
    } catch (err) {
      console.error('API toggle error:', err);
      // Rollback optimistic update
      dispatch(toggleWishlist(product._id));
      toast.error('Failed to sync wishlist. Please try again.');
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
      toast.success('Product deleted successfully');
      router.push('/');
    } catch (err: any) {
      console.error('Error deleting product:', err);
      toast.error(`Error deleting product: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const discount = (displayPrice > 0 && displaySalePrice && displaySalePrice < displayPrice)
    ? Math.max(0, Math.round(((displayPrice - displaySalePrice) / displayPrice) * 100))
    : 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();

    // Lens size (150x150) - sync with CSS
    const lensWidth = 150;
    const lensHeight = 150;

    // Calculate cursor pos relative to container
    let x = e.clientX - left;
    let y = e.clientY - top;

    // Clamp lens to stay within boundaries
    x = Math.max(lensWidth / 2, Math.min(x, width - lensWidth / 2));
    y = Math.max(lensHeight / 2, Math.min(y, height - lensHeight / 2));

    // Calculate percentage for background-position
    const percentageX = ((x - lensWidth / 2) / (width - lensWidth)) * 100;
    const percentageY = ((y - lensHeight / 2) / (height - lensHeight)) * 100;

    setZoomPos({
      x: x - lensWidth / 2,
      y: y - lensHeight / 2,
      percentageX,
      percentageY
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Gallery Section */}
      <div className="space-y-4">
        <div className="relative group/zoom">
          <div
            className="relative aspect-square overflow-hidden rounded-xl border bg-white cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setShowZoom(true)}
            onMouseLeave={() => setShowZoom(false)}
          >
            {allImages && allImages.length > 0 && selectedImage < allImages.length ? (
              <>
                <Image
                  src={allImages[selectedImage]}
                  alt={product.name}
                  width={400}
                  height={400}
                  priority
                  loading="eager"
                  fetchPriority="high"
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="h-full w-full object-contain p-4"
                />

                {/* Lens - Daraz Style Overlay */}
                {showZoom && (
                  <div
                    className="absolute border border-primary/30 bg-primary/10 shadow-inner pointer-events-none hidden lg:block"
                    style={{
                      width: '150px',
                      height: '150px',
                      left: `${zoomPos.x}px`,
                      top: `${zoomPos.y}px`,
                    }}
                  />
                )}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground italic">
                No images available
              </div>
            )}

            {discount > 0 && (
              <div className="absolute top-4 left-4">
                <Badge variant="destructive" className="font-bold text-sm px-3 h-8 shadow-lg">-{discount}% OFF</Badge>
              </div>
            )}
          </div>

          {/* External Zoom Preview Window - Daraz Style */}
          {/* Placed outside the overflow-hidden container so it can overlay the right column */}
          {showZoom && allImages && allImages.length > 0 && allImages[selectedImage] && (
            <div
              className="absolute left-full ml-10 top-0 w-[120%] h-full border-2 border-primary/20 rounded-2xl bg-white shadow-2xl z-50 pointer-events-none overflow-hidden hidden lg:block animate-in fade-in zoom-in-95 duration-200"
            >
              <div
                className="w-full h-full bg-no-repeat"
                style={{
                  backgroundImage: `url(${allImages[selectedImage]})`,
                  backgroundSize: '300%', // Zoom level
                  backgroundPosition: `${zoomPos.percentageX}% ${zoomPos.percentageY}%`,
                }}
              />
              <div className="absolute top-4 left-4">
                <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm shadow-sm font-bold uppercase tracking-tight text-[8px]">
                  Micro-Zoom 3.0x
                </Badge>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 overflow-auto pb-2 scrollbar-none">
          {allImages?.map((img: string, i: number) => (
            <button
              key={i}
              className={`relative h-20 w-20 flex-shrink-0 rounded-md border-2 overflow-hidden transition-all ${selectedImage === i ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-muted hover:border-primary/50'
                }`}
              onClick={() => setSelectedImage(i)}
              aria-label={`View product thumbnail image ${i + 1}`}
            >
              <Image src={img} alt="" width={80} height={80} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Product Info Section */}
      <div className="flex flex-col gap-6">
        <div className="space-y-2">

          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{product.name}</h1>
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none transition-colors hover:text-primary">
                  <MoreVertical className="h-6 w-6 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => router.push(`/admin/products/${product.slug}`)} className="cursor-pointer">
                    <Edit className="mr-2 h-4 w-4" /> Edit Product
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowDeleteModal(true)} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
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
            )}
          </div>
          <div className="flex items-center gap-4 py-2">
            <div className="flex items-center gap-1">
              <RatingStars rating={product.ratings || 0} />
              <span className="text-sm font-bold ml-1">{(product.ratings || 0).toFixed(1)}</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{product.numReviews || 0}</span>
              <span>Reviews</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <button
              onClick={() => setIsShareOpen(true)}
              className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              title="Share product"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
            {eligibility?.eligible && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <button
                  onClick={() => {
                    setActiveTab('reviews');
                    setShouldScrollToReviewForm(true);
                  }}
                  className="text-sm font-bold text-primary hover:underline cursor-pointer"
                >
                  Write a review
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-4">
            <span className="text-3xl font-extrabold text-primary">
              {CURRENCY_SYMBOL}{Math.round(displaySalePrice || displayPrice)}
            </span>
            {displaySalePrice && displaySalePrice !== displayPrice && (
              <span className="text-xl text-muted-foreground line-through font-medium">
                {CURRENCY_SYMBOL}{Math.round(displayPrice)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${displayStock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {displayStock > 0 ? `In stock (${displayStock} units)` : 'Out of stock'}
            </span>
            {displaySku && (
              <span className="text-xs text-muted-foreground">| SKU: {displaySku}</span>
            )}
          </div>
        </div>

        <Separator />

        {/* Dynamic Content Spacer */}
        <div className="space-y-6">
          {/* Selection Options */}
          <div className="space-y-6">
            {/* Colors Selection */}
            {uniqueColors.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold uppercase tracking-wider">Color:</span>
                  <span className="text-sm text-primary font-medium">{selectedColor}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {uniqueColors.map((color) => {
                    const isOutOfStock = product.variants
                      ?.filter((v: any) => v.color === color)
                      .every((v: any) => (v.stock || 0) <= 0);

                    // Find variant that matches this color and has an image
                    const variantWithImage = product.variants?.find(
                      (v: any) => v.color === color && (v.image || (v.images && v.images.length > 0))
                    );
                    const imageUrl = variantWithImage?.images?.[0] || variantWithImage?.image;

                    return (
                      <button
                        key={color}
                        disabled={isOutOfStock}
                        onClick={() => setSelectedColor(color)}
                        title={color}
                        className={`relative rounded-lg overflow-hidden transition-all duration-200 border-2 ${
                          selectedColor === color
                            ? 'border-primary ring-2 ring-primary/20 scale-105 shadow-md'
                            : isOutOfStock
                              ? 'border-dashed border-muted bg-muted/20 opacity-40 cursor-not-allowed'
                              : 'border-muted hover:border-primary/50 hover:scale-102'
                        } ${imageUrl ? 'p-0.5 w-14 h-14' : 'px-4 py-2 text-xs font-bold'}`}
                      >
                        {imageUrl ? (
                          <div className="relative w-full h-full rounded-md overflow-hidden bg-white">
                            <Image
                              src={imageUrl}
                              alt={color}
                              fill
                              sizes="56px"
                              className="object-contain p-0.5"
                            />
                            {isOutOfStock && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="text-[8px] font-black uppercase text-white tracking-tighter">Out</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            {color}
                            {isOutOfStock && <span className="block text-[8px] mt-0.5 opacity-50">Sold Out</span>}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sizes Selection */}
            {uniqueSizes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold uppercase tracking-wider">Size:</span>
                  <span className="text-sm text-primary font-medium">{selectedSize || 'Select a size'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {uniqueSizes.map((sizeName, i) => {
                    const isAvailable = availableSizes.includes(sizeName);
                    return (
                      <button
                        key={i}
                        disabled={!isAvailable}
                        onClick={() => setSelectedSize(sizeName)}
                        className={`min-w-[48px] h-12 flex flex-col items-center justify-center rounded-xl border-2 font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed ${selectedSize === sizeName
                          ? 'border-primary bg-primary/5 ring-4 ring-primary/10 text-primary'
                          : isAvailable
                            ? 'border-muted hover:border-primary/30 text-muted-foreground'
                            : 'border-muted/50 border-dashed text-muted-foreground/30'
                          }`}
                      >
                        <span className="text-sm">{sizeName}</span>
                        {!isAvailable && <span className="text-[8px] font-black uppercase text-destructive mt-[-2px]">Out</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Regular Attributes */}
          {product.attributes && product.attributes.length > 0 && (
            <div className="space-y-3 pt-2">
              {product.attributes?.map((attr: any, i: number) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-xs font-bold min-w-[80px] uppercase tracking-wider text-muted-foreground">{attr.key}:</span>
                  <span className="text-xs font-medium">{attr.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 py-8 sm:py-6 border-t">
          {/* Row 1: Quantity and Wishlist */}
          <div className="flex items-center gap-4">
            <div className="flex items-center border rounded-full overflow-hidden h-12 bg-muted/50">
              <Button
                variant="ghost"
                size="icon"
                className="h-full rounded-none px-4 hover:bg-muted"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-bold">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-full rounded-none px-4 hover:bg-muted"
                onClick={() => setQuantity(Math.min(displayStock || 0, quantity + 1))}
                disabled={quantity >= (displayStock || 0)}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-full transition-all hover:scale-110 active:scale-95 flex-shrink-0"
              onClick={handleFavorite}
              aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={`h-5 w-5 transition-colors ${isInWishlist ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
            </Button>
          </div>

          {/* Row 2: Add to Cart and Buy Now */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              size="lg"
              variant="outline"
              className="h-14 rounded-full font-black text-[10px] sm:text-sm uppercase tracking-[0.1em] sm:tracking-[0.2em] border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all hover:scale-[1.02] active:scale-95"
              onClick={handleAddToCart}
              disabled={(displayStock || 0) === 0}
            >
              <ShoppingCart className="mr-2 h-5 w-5 hidden sm:block" /> Add to Cart
            </Button>
            <Button
              size="lg"
              className="h-14 rounded-full font-black text-[10px] sm:text-sm uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/25"
              onClick={handleBuyNow}
              disabled={(displayStock || 0) === 0}
            >
              Buy Now
            </Button>
          </div>

          {/* Row 3: WhatsApp */}
          {whatsappNumber && (
            <Button
              size="lg"
              variant="outline"
              className="w-full h-14 rounded-full font-black text-xs uppercase tracking-[0.2em] border-2 border-[#075E54] text-[#075E54] hover:bg-[#075E54] hover:text-white transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
              onClick={() => {
                const message = encodeURIComponent(`Hi, I'm interested in ${product.name}. Price: ${CURRENCY_SYMBOL}${Math.round(displaySalePrice || displayPrice)}`);

                // Parse whatsappNumber robustly
                let cleanNumber = (whatsappNumber || '').trim();
                let phone = '';

                if (cleanNumber.includes('wa.me/')) {
                  const parts = cleanNumber.split('wa.me/');
                  phone = parts[parts.length - 1];
                } else if (cleanNumber.includes('whatsapp.com/')) {
                  const parts = cleanNumber.split('phone=');
                  if (parts.length > 1) {
                    phone = parts[1];
                  } else {
                    phone = cleanNumber.replace(/[^0-9]/g, '');
                  }
                } else {
                  phone = cleanNumber.replace(/[^0-9]/g, '');
                }

                // Strip any query parameters or non-digit chars
                phone = phone.split('?')[0].replace(/[^0-9]/g, '');

                window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
              }}
            >
              <svg
                className="h-5 w-5 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Order via WhatsApp
            </Button>
          )}
        </div>


      </div>

      {/* Tabs Section for Description & Reviews */}
      <div className="col-span-full mt-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 mb-8 h-auto">
            <TabsTrigger
              value="description"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4 font-bold uppercase tracking-wider text-muted-foreground data-[state=active]:text-foreground"
            >
              Description
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4 font-bold uppercase tracking-wider text-muted-foreground data-[state=active]:text-foreground"
            >
              Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="animate-in fade-in-50 duration-500">
            <div className="ProseMirror max-w-none">
              <div
                className="ProseMirror max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: generateHtml(product.description) }}
              />
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="animate-in fade-in-50 duration-500">
            <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
              <ReviewsSection productId={product._id} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Delete Product</DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete <span className="font-bold text-foreground">"{product.name}"</span>?
              This action cannot be undone and will remove all associated data including variants and reviews.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex-row gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
              className="flex-1 sm:flex-none rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProduct}
              disabled={isDeleting}
              className="flex-1 sm:flex-none rounded-xl font-bold"
            >
              {isDeleting ? "Deleting..." : "Yes, Delete Product"}
            </Button>
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

