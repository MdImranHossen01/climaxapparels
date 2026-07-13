import { Middleware } from '@reduxjs/toolkit';

export const cartMiddleware: Middleware = (store) => (next) => (action: any) => {
  const result = next(action);

  // Define cart-related action types
  const cartActions = [
    'cart/addToCart',
    'cart/removeFromCart',
    'cart/clearCart'
  ];

  if (cartActions.includes(action.type)) {
    const cartState = (store.getState() as any).cart;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('cart', JSON.stringify({
          items: cartState.items,
          totalQuantity: cartState.totalQuantity,
          totalAmount: cartState.totalAmount
        }));
      } catch (e) {
        console.error('Failed to save cart to localStorage:', e);
      }
    }
  }

  return result;
};

