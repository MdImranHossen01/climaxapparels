'use client';

import { Provider } from 'react-redux';
import { store } from './store';
import React from 'react';
import { CartHydrator } from '@/components/CartHydrator';
import { WishlistHydrator } from '@/components/WishlistHydrator';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <CartHydrator>
        <WishlistHydrator>
          {children}
        </WishlistHydrator>
      </CartHydrator>
    </Provider>
  );
}

