'use client';

import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetTrigger,
    SheetFooter,
    SheetClose
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash, Plus, Minus, ArrowRight, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { removeFromCart, addToCart, clearCart } from '@/store/slices/cartSlice';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { toast } from 'sonner';
import Image from 'next/image';

export function CartDrawer({ children }: { children: React.ReactElement }) {
  const dispatch = useAppDispatch();
  const { items, totalAmount, totalQuantity } = useAppSelector((state) => state.cart);

  const handleUpdateQuantity = (item: any, delta: number) => {
      if (item.quantity + delta === 0) {
          dispatch(removeFromCart({ productId: item.productId, color: item.color, size: item.size }));
          toast.info(`${item.name} removed from cart`);
      } else {
          dispatch(addToCart({ ...item, quantity: delta }));
      }
  };



  return (
    <Sheet>
      <SheetTrigger nativeButton={false} render={children} />
      <SheetContent className="flex flex-col w-full sm:max-w-md bg-background border-l shadow-2xl pb-24 md:pb-6">
        <SheetHeader className="pb-6 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-primary" />
                Your Cart 
                <span className="text-sm font-normal text-muted-foreground ml-2">({totalQuantity} items)</span>
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-muted p-6 rounded-full inline-block">
                <ShoppingCart className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold">Your cart is empty</h3>
              <p className="text-muted-foreground text-sm max-w-[200px]">Looks like you haven&apos;t added anything to your cart yet.</p>
              <SheetClose
                nativeButton={false}
                render={<Link href="/shop" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">Start Shopping</Link>}
              />
            </div>
          ) : (
            items.map((item, index) => (
              <div key={`${item.productId}-${item.color || ''}-${item.size || ''}-${index}`} className="flex gap-4 group">
                <div className="h-20 w-20 rounded-md overflow-hidden bg-muted group-hover:scale-105 transition-transform">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} width={80} height={80} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col flex-1">
                      <h4 className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">{item.name}</h4>
                      {(item.color || item.size) && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {item.color && (
                            <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium uppercase tracking-tighter">
                              Color: {item.color}
                            </span>
                          )}
                          {item.size && (
                            <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium uppercase tracking-tighter">
                              Size: {item.size}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                            dispatch(removeFromCart({ productId: item.productId, color: item.color, size: item.size }));
                            toast.info(`${item.name} removed from cart`);
                        }}
                        aria-label={`Remove ${[item.name, item.color, item.size].filter(Boolean).join(' - ')} from cart`}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border rounded-full overflow-hidden bg-muted/50 border-none scale-90 -ml-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 hover:bg-muted"
                        onClick={() => handleUpdateQuantity(item, -1)}
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 hover:bg-muted"
                        onClick={() => handleUpdateQuantity(item, 1)}
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm font-bold text-primary">৳{Math.round(item.price * item.quantity)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter className="mt-auto pt-6 border-t flex-col gap-4">
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center justify-between text-lg font-extrabold tracking-tight">
                <span>Total Amount</span>
                <span className="text-primary">৳{Math.round(totalAmount)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full">
                <SheetClose nativeButton={false} render={
                  <Button 
                      className="w-full h-12 rounded-full font-bold uppercase tracking-widest text-xs group"
                      nativeButton={false}
                      render={<Link href="/checkout">Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>}
                  />
                } />
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => {
                        dispatch(clearCart());
                        toast.info('Cart cleared');
                    }}
                >
                    Clear All Items
                </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

