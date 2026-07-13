'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Provider as ReduxProvider } from 'react-redux';
import { SessionProvider } from 'next-auth/react';
import { store } from '@/store/store';

import { AnimationProvider } from './animation-provider';
import { CartHydrator } from './CartHydrator';
import { WishlistHydrator } from './WishlistHydrator';

import { SettingsProvider } from './SettingsProvider';
import { TooltipProvider } from '@/components/ui/tooltip';

export function Providers({ 
  children,
  settings 
}: { 
  children: React.ReactNode;
  settings?: any;
}) {
  return (
    <SessionProvider>
      <ReduxProvider store={store}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SettingsProvider settings={settings}>
            <TooltipProvider>
              <AnimationProvider>
                <CartHydrator>
                  <WishlistHydrator>
                    {children}
                  </WishlistHydrator>
                </CartHydrator>
              </AnimationProvider>
            </TooltipProvider>
          </SettingsProvider>
        </NextThemesProvider>
      </ReduxProvider>
    </SessionProvider>
  );
}

