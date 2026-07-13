import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WishlistState {
  items: string[]; // Array of product IDs
  isHydrated: boolean;
}

const initialState: WishlistState = {
  items: [],
  isHydrated: false,
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlist(state, action: PayloadAction<string>) {
      const id = action.payload;
      const index = state.items.indexOf(id);
      if (index === -1) {
        state.items.push(id);
      } else {
        state.items.splice(index, 1);
      }
    },
    setWishlist(state, action: PayloadAction<string[]>) {
      state.items = action.payload;
    },
    hydrateWishlist(state, action: PayloadAction<string[]>) {
      state.items = action.payload;
      state.isHydrated = true;
    },
    setWishlistHydrated(state) {
      state.isHydrated = true;
    }
  },
});

export const { toggleWishlist, setWishlist, hydrateWishlist, setWishlistHydrated } = wishlistSlice.actions;
export default wishlistSlice.reducer;

