import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  basePrice?: number;
  quantity: number;
  image?: string;
  color?: string;
  size?: string;
}

interface CartState {
  items: CartItem[];
  totalQuantity: number;
  totalAmount: number;
  isHydrated: boolean;
}

const initialState: CartState = {
  items: [],
  totalQuantity: 0,
  totalAmount: 0,
  isHydrated: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      const newItem = action.payload;
      const existingItem = state.items.find(
        (item) => 
          item.productId === newItem.productId && 
          item.color === newItem.color && 
          item.size === newItem.size
      );

      if (!existingItem) {
        state.totalQuantity += newItem.quantity;
        state.totalAmount = Math.round((state.totalAmount + newItem.price * newItem.quantity) * 100) / 100;
        state.items.push(newItem);
      } else {
        state.totalQuantity += newItem.quantity;
        state.totalAmount = Math.round((state.totalAmount + existingItem.price * newItem.quantity) * 100) / 100;
        existingItem.quantity += newItem.quantity;
      }
    },
    removeFromCart(state, action: PayloadAction<{ productId: string; color?: string; size?: string } | string>) {
      const payload = action.payload;
      const payloadWasString = typeof payload === 'string';
      
      const { productId, color, size } = payloadWasString
        ? { productId: payload, color: undefined, size: undefined }
        : payload;

      const matchingItems = state.items.filter((item) => {
        if (payloadWasString) {
          return item.productId === productId;
        }
        return (
          item.productId === productId &&
          item.color === color &&
          item.size === size
        );
      });

      if (matchingItems.length > 0) {
        const removedQuantity = matchingItems.reduce((sum, item) => sum + item.quantity, 0);
        const removedAmount = matchingItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        state.totalQuantity -= removedQuantity;
        state.totalAmount = Math.round((state.totalAmount - removedAmount) * 100) / 100;
        state.items = state.items.filter((item) => {
          if (payloadWasString) {
            return item.productId !== productId;
          }
          return !(
            item.productId === productId &&
            item.color === color &&
            item.size === size
          );
        });
      }
    },
    clearCart(state) {
      state.items = [];
      state.totalQuantity = 0;
      state.totalAmount = 0;
    },
    hydrateCart(state, action: PayloadAction<CartState>) {
      const items = (action.payload.items || []).map(item => ({
        ...item,
        basePrice: item.basePrice ?? item.price
      }));
      return {
        ...action.payload,
        items,
        isHydrated: true
      };
    },
    syncItems(state, action: PayloadAction<{ productId: string; color?: string; size?: string }[]>) {
      const validKeys = action.payload.map(i => `${i.productId}-${i.color || ''}-${i.size || ''}`);
      
      const filteredItems = state.items.filter(item => {
        const key = `${item.productId}-${item.color || ''}-${item.size || ''}`;
        return validKeys.includes(key);
      });

      if (filteredItems.length !== state.items.length) {
        state.items = filteredItems;
        state.totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);
        state.totalAmount = Math.round(state.items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
      }
    },
    setHydrated(state) {
      state.isHydrated = true;
    }
  },
});

export const { addToCart, removeFromCart, clearCart, hydrateCart, syncItems, setHydrated } = cartSlice.actions;
export default cartSlice.reducer;

