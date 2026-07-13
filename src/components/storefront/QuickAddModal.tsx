'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { addToCart } from '@/store/slices/cartSlice';
import { toast } from 'sonner';
import Image from 'next/image';
import { fbEvent } from '@/lib/fpixel';
import { ttEvent } from '@/lib/tiktok';

interface QuickAddModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAddModal({ product, isOpen, onClose }: QuickAddModalProps) {
  const dispatch = useAppDispatch();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Derive available options from variants
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

  useEffect(() => {
    if (isOpen) {
      const initialColor = uniqueColors[0] || null;
      setSelectedColor(initialColor);

      const initialSizes = (product.variants || [])
        .filter((v: any) => !initialColor || v.color === initialColor)
        .map((v: any) => v.size)
        .filter(Boolean);
      const initialSize = initialSizes[0] || null;
      setSelectedSize(initialSize);

      // Track ViewContent for Quick View
      const viewContentPayload = {
        content_name: product.name,
        content_category: product.categories?.[0]?.name || 'Uncategorized',
        content_ids: [product._id],
        content_type: 'product',
        value: product.salePrice || product.price,
        currency: 'BDT'
      };
      fbEvent('ViewContent', viewContentPayload);
      ttEvent('ViewContent', viewContentPayload);
    }
  }, [isOpen, uniqueColors, product.variants]);

  useEffect(() => {
    if (selectedSize == null || !availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes[0] || null);
    }
  }, [selectedColor, selectedSize, availableSizes]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (uniqueColors.length > 0 && !selectedColor) {
      toast.error('Please select a color');
      return;
    }
    if (uniqueSizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }

    const displayPrice = activeVariant?.price || product.price;
    const displaySalePrice = activeVariant?.salePrice || product.salePrice;

    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      price: (displaySalePrice !== undefined && displaySalePrice !== null) ? displaySalePrice : displayPrice,
      basePrice: displayPrice,
      quantity: 1,
      image: activeVariant?.images?.[0] || activeVariant?.image || product.images?.[0],
      color: selectedColor || undefined,
      size: selectedSize || undefined
    }));

    // Track AddToCart
    const addToCartPayload = {
      content_name: product.name,
      content_category: product.categories?.[0]?.name || 'Uncategorized',
      content_ids: [product._id],
      content_type: 'product',
      value: displaySalePrice || displayPrice,
      currency: 'BDT',
      quantity: 1
    };
    fbEvent('AddToCart', addToCartPayload);
    ttEvent('AddToCart', addToCartPayload);

    toast.success(`${product.name} added to cart`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="text-xl">Select Options</DialogTitle>
          <DialogDescription>
            Choose your preferred options before adding to cart.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-4 py-4 border-b">
          <div className="h-16 w-16 overflow-hidden rounded-md border flex-shrink-0">
            <Image 
              src={activeVariant?.images?.[0] || activeVariant?.image || product.images?.[0] || '/placeholder.jpg'} 
              alt={product.name} 
              width={64}
              height={64}
              className="h-full w-full object-cover" 
            />
          </div>
          <div className="flex flex-col justify-center">
            <h4 className="font-semibold line-clamp-1">{product.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-bold text-primary">
                ৳{Math.round(activeVariant?.salePrice ?? activeVariant?.price ?? product.salePrice ?? product.price)}
              </span>
              {(activeVariant?.salePrice ?? product.salePrice) != null && (
                <span className="text-xs line-through text-muted-foreground">
                  ৳{Math.round(activeVariant?.price ?? product.price)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 py-4">
          {/* Colors Selection */}
          {uniqueColors.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Color: <span className="text-foreground">{selectedColor}</span></span>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map((colorName, i) => {
                  const isOutOfStock = product.variants
                    ?.filter((v: any) => v.color === colorName)
                    .every((v: any) => (v.stock || 0) <= 0);

                  const variantWithImage = product.variants?.find(
                    (v: any) => v.color === colorName && (v.image || (v.images && v.images.length > 0))
                  );
                  const imageUrl = variantWithImage?.images?.[0] || variantWithImage?.image;

                  return (
                    <button
                      key={i}
                      disabled={isOutOfStock}
                      onClick={(e) => { e.preventDefault(); setSelectedColor(colorName); }}
                      title={colorName}
                      className={`relative rounded-lg overflow-hidden transition-all duration-200 border-2 ${
                        selectedColor === colorName
                          ? 'border-primary ring-2 ring-primary/20 scale-105 shadow-md'
                          : isOutOfStock
                            ? 'border-dashed border-muted bg-muted/20 opacity-40 cursor-not-allowed'
                            : 'border-muted hover:border-primary/50 hover:scale-102'
                      } ${imageUrl ? 'p-0.5 w-12 h-12' : 'px-3 py-1.5 text-sm'}`}
                    >
                      {imageUrl ? (
                        <div className="relative w-full h-full rounded-md overflow-hidden bg-white">
                          <Image
                            src={imageUrl}
                            alt={colorName}
                            fill
                            sizes="48px"
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
                          {colorName}
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
            <div className="space-y-2">
              <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Size: <span className="text-foreground">{selectedSize || 'Select...'}</span></span>
              <div className="flex flex-wrap gap-2">
                {uniqueSizes.map((sizeName, i) => {
                  const isAvailable = availableSizes.includes(sizeName);
                  return (
                    <button
                      key={i}
                      disabled={!isAvailable}
                      onClick={(e) => { e.preventDefault(); setSelectedSize(sizeName); }}
                      className={`min-w-[40px] px-2 py-1.5 text-sm rounded-md border transition-all ${
                        selectedSize === sizeName
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : !isAvailable 
                            ? 'opacity-40 grayscale cursor-not-allowed bg-muted'
                            : 'hover:border-primary/50'
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
        
        <div className="pt-2">
          <Button 
            className="w-full font-bold uppercase tracking-wider" 
            onClick={handleAddToCart}
            disabled={(activeVariant?.stock ?? product.stock) === 0}
          >
            <ShoppingCart className="mr-2 h-4 w-4" /> 
            {(activeVariant?.stock ?? product.stock) === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

