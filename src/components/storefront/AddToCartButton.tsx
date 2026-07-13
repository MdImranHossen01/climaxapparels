'use client';

import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface AddToCartButtonProps {
  product: any;
  className?: string;
}

export function AddToCartButton({ product, className }: AddToCartButtonProps) {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      productId: product._id || product.id,
      name: product.name,
      price: product.salePrice ?? product.price,
      quantity: 1,
      image: product.images?.[0],
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Button 
      onClick={handleAddToCart} 
      className={className}
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      Add to Cart
    </Button>
  );
}

