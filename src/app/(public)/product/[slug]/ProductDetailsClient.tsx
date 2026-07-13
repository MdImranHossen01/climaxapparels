/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
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
  PlusCircle
} from 'lucide-react';
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
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Derive available options from variants
  const uniqueColors = useMemo(() =>
    Array.from(new Set((product.variants || []).map((v: any) => v.color))).filter(Boolean) as string[],
    [product.variants]
  );

  const uniqueSizes = useMemo(() =>
    Array.from(new Set((product.variants || []).map((v: any) => v.size))).filter(Boolean) as string[],
    [product.variants]
  );

  // Hierarchical filtering
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
  }, [product?._id, uniqueColors, product.variants]);

  // Adjust selection if dependencies change and current choice is unavailable
  useEffect(() => {
    if (selectedSize == null || !availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes[0] || null);
    }

    // Update main image if variant has one
    if (activeVariant?.image) {
      const variantImgIndex = (product.images || []).findIndex((img: string) => img === activeVariant.image);
      if (variantImgIndex !== -1) {
        setSelectedImage(variantImgIndex);
      }
    }
  }, [selectedColor, selectedSize, availableSizes, activeVariant, product.images]);

  const displayPrice = activeVariant?.price || product.price;
  const displaySalePrice = activeVariant?.salePrice || product.salePrice;
  const displayStock = activeVariant?.stock ?? product.stock;
  const displaySku = activeVariant?.sku || product.sku;
  const handleAddToCart = () => {
    if (uniqueColors.length > 0 && !selectedColor) {
      toast.error('Please select a color');
      return;
    }
    if (uniqueSizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }

    const stock = displayStock || 0;
    const finalQuantity = Math.min(quantity, stock);

    if (finalQuantity <= 0) {
      toast.error('This item is currently out of stock');
      return;
    }


    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      price: displaySalePrice || displayPrice,
      basePrice: displayPrice,
      quantity: finalQuantity,
      image: activeVariant?.image || product.images?.[0],
      color: selectedColor || undefined,
      size: selectedSize || undefined
    }));
    toast.success(`Added ${finalQuantity} ${product.name} to cart`);
  };

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

  const discount = (product.price > 0 && product.salePrice && product.salePrice < product.price)
    ? Math.max(0, Math.round(((product.price - product.salePrice) / product.price) * 100))
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
            {product.images && product.images.length > 0 && selectedImage < product.images.length ? (
              <>
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
                  width={400}
                  height={400}
                  priority
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
          {showZoom && product.images && product.images.length > 0 && product.images[selectedImage] && (
            <div
              className="absolute left-full ml-10 top-0 w-[120%] h-full border-2 border-primary/20 rounded-2xl bg-white shadow-2xl z-50 pointer-events-none overflow-hidden hidden lg:block animate-in fade-in zoom-in-95 duration-200"
            >
              <div
                className="w-full h-full bg-no-repeat"
                style={{
                  backgroundImage: `url(${product.images[selectedImage]})`,
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
          {product.images?.map((img: string, i: number) => (
            <button
              key={i}
              className={`relative h-20 w-20 flex-shrink-0 rounded-md border-2 overflow-hidden transition-all ${selectedImage === i ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-muted hover:border-primary/50'
                }`}
              onClick={() => setSelectedImage(i)}
            >
              <Image
                src={img}
                alt=""
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
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
          {product.rating > 0 && (
            <div className="flex items-center gap-4 py-2">
              <div className="flex gap-0.5 text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-muted'}`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">({product.rating.toFixed(1)} / 5.0)</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-4">
            <span className="text-3xl font-extrabold text-primary">
              ৳{Math.round(displaySalePrice || displayPrice)}
            </span>
            {displaySalePrice && displaySalePrice !== displayPrice && (
              <span className="text-xl text-muted-foreground line-through font-medium">
                ৳{Math.round(displayPrice)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className={`text-xs font-bold ${displayStock > 0 ? 'text-green-600' : 'text-destructive'}`}>
              {displayStock > 0 ? `In stock (${displayStock} units)` : 'Out of stock'}
            </p>
            {displaySku && (
              <span className="text-xs text-muted-foreground">| SKU: {displaySku}</span>
            )}
          </div>
        </div>

        <Separator />

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
                {uniqueColors.map((colorName, i) => {
                  // Find first variant for this color to get thumbnail
                  const colorVariant = product.variants?.find((v: any) => v.color === colorName);
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedColor(colorName)}
                      className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${selectedColor === colorName
                        ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                        : 'border-muted hover:border-primary/30'
                        }`}
                    >
                      {colorVariant?.image && (
                        <div className="h-8 w-8 rounded-full overflow-hidden border bg-background">
                          <Image src={colorVariant.image} alt="" width={32} height={32} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <span className="text-xs font-bold">{colorName}</span>
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
                      className={`min-w-[48px] h-12 flex items-center justify-center rounded-xl border-2 font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale disabled:scale-100 ${selectedSize === sizeName
                        ? 'border-primary bg-primary/5 ring-4 ring-primary/10 text-primary'
                        : 'border-muted hover:border-primary/30 text-muted-foreground'
                        }`}
                    >
                      {sizeName}
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

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          <div className="flex items-center border rounded-full overflow-hidden h-12 bg-muted/50">
            <Button
              variant="ghost"
              size="icon"
              className="h-full rounded-none px-4 hover:bg-muted"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
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
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            size="lg"
            className="flex-1 h-12 rounded-full font-bold uppercase tracking-wider transition-all hover:scale-[1.02] shadow-xl shadow-primary/20"
            onClick={handleAddToCart}
            disabled={(displayStock || 0) === 0}
          >
            <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full transition-all hover:scale-110 active:scale-95"
            onClick={handleFavorite}
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`h-5 w-5 transition-colors ${isInWishlist ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
          </Button>
        </div>


      </div>

      {/* Tabs Section for Description & Reviews */}
      <div className="col-span-full mt-16">
        <Tabs defaultValue="description" className="w-full">
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
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
              <div className="whitespace-pre-line text-muted-foreground leading-relaxed text-base">
                {product.description}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="animate-in fade-in-50 duration-500">
            <ReviewsSection productId={product._id} />
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
    </div>
  );
}

