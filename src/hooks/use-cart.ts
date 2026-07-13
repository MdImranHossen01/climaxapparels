import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart, removeFromCart, clearCart } from '@/store/slices/cartSlice';

export const useCart = () => {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);
  const itemsCount = useAppSelector((state) => state.cart.totalQuantity);
  const totalAmount = useAppSelector((state) => state.cart.totalAmount);

  const addItem = (item: any) => {
    dispatch(addToCart(item));
  };

  const removeItem = (productId: string, color?: string, size?: string) => {
    dispatch(removeFromCart({ productId, color, size }));
  };

  const clear = () => {
    dispatch(clearCart());
  };

  return {
    items,
    itemsCount,
    totalAmount,
    addItem,
    removeItem,
    clear,
  };
};

