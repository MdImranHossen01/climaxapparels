'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { hydrateCart, setHydrated } from '@/store/slices/cartSlice';
import { useSession, signOut } from 'next-auth/react';

export function CartHydrator({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { status } = useSession();
  const cart = useAppSelector((state) => state.cart);
  
  const authSyncAttempted = useRef(false);
  const dbSyncReady = useRef(false);
  const isSyncingRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestCartItemsRef = useRef(cart.items);

  // Keep latest items ref in sync
  useEffect(() => {
    latestCartItemsRef.current = cart.items;
  }, [cart.items]);

  // 1. Initial LocalStorage Hydration
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (parsedCart && Array.isArray(parsedCart.items)) {
          dispatch(hydrateCart({
            ...parsedCart,
            isHydrated: true
          }));
        } else {
          dispatch(setHydrated());
        }
      } else {
        dispatch(setHydrated());
      }
    } catch (error) {
      console.error('Failed to hydrate cart:', error);
      dispatch(setHydrated());
    }
  }, [dispatch]);

  // 2. Auth Sync with Database (Merge Local & DB on Login)
  useEffect(() => {
    // Check if we already merged in this browser session to prevent reappearing items on refresh
    const sessionSynced = typeof window !== 'undefined' && sessionStorage.getItem('cartSynced') === 'true';

    if (status === 'authenticated' && cart.isHydrated && !authSyncAttempted.current && !isSyncingRef.current) {
      const syncCart = async () => {
        isSyncingRef.current = true;
        try {
          // Fetch cart from DB
          const res = await fetch('/api/cart', { cache: 'no-store' });
          if (res.ok) {
            const dbCartItems = await res.json();
            const currentLocalItems = latestCartItemsRef.current;
            
            let finalItems = [];

            if (sessionSynced) {
                // If already synced in this session, trust the local state (which was hydrated from localStorage)
                // This prevents deleted items from coming back on refresh
                finalItems = currentLocalItems;
            } else {
                // First time in this session (e.g. just logged in or fresh visit)
                // Merge logic: Combine local items and DB items
                const mergedMap = new Map();
                
                const getVariantKey = (item: any) => {
                    const othersStr = item.others 
                    ? JSON.stringify(Object.keys(item.others).sort().reduce((obj: any, key) => {
                        obj[key] = item.others[key];
                        return obj;
                        }, {}))
                    : '';
                    return `${item.productId}-${item.color || ''}-${item.size || ''}-${othersStr}`;
                };

                // Add DB items
                if (Array.isArray(dbCartItems)) {
                    dbCartItems.forEach((item: any) => {
                        const key = getVariantKey(item);
                        mergedMap.set(key, item);
                    });
                }
                
                // Add Local items (merge quantities if same variant)
                currentLocalItems.forEach((item) => {
                    const key = getVariantKey(item);
                    if (mergedMap.has(key)) {
                        const existing = mergedMap.get(key);
                        mergedMap.set(key, { ...existing, quantity: Math.max(existing.quantity, item.quantity) });
                    } else {
                        mergedMap.set(key, item);
                    }
                });

                finalItems = Array.from(mergedMap.values());
                sessionStorage.setItem('cartSynced', 'true');
            }
            
            // Recalculate totals
            let totalQty = 0;
            let totalAmt = 0;
            finalItems.forEach(item => {
                totalQty += item.quantity;
                totalAmt += item.price * item.quantity;
            });
            totalAmt = Math.round(totalAmt * 100) / 100;

            const finalCartState = {
                items: finalItems,
                totalQuantity: totalQty,
                totalAmount: totalAmt,
            };

            // Sync merged result back to DB
            const syncRes = await fetch('/api/cart/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartItems: finalItems })
            });

            if (syncRes.ok) {
                authSyncAttempted.current = true;
                dispatch(hydrateCart({
                    ...finalCartState,
                    isHydrated: true
                }));
                dbSyncReady.current = true;
            } else {
                console.error('Failed to sync merged cart to database:', syncRes.status);
                authSyncAttempted.current = true;
                dbSyncReady.current = true;
            }
          } else {
              authSyncAttempted.current = true;
              dbSyncReady.current = true;
          }
        } catch (error) {
          console.error('Failed to sync cart with server:', error);
          authSyncAttempted.current = true;
          dbSyncReady.current = true;
        } finally {
            isSyncingRef.current = false;
        }
      };

      syncCart();
    }
  }, [status, cart.isHydrated, dispatch]);

  // 3. Continuous DB Sync (Debounced when cart changes while logged in)
  useEffect(() => {
      if (status === 'authenticated' && dbSyncReady.current && cart.isHydrated) {
          if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
          
          syncTimeoutRef.current = setTimeout(async () => {
              try {
                  const res = await fetch('/api/cart/sync', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ cartItems: cart.items })
                  });
                  if (!res.ok) {
                      console.error('Debounced cart sync failed:', res.status);
                  }
              } catch (e) {
                  console.error('Failed debounced cart sync', e);
              }
          }, 500); // Reduced to 500ms for faster sync
      }
      
      return () => {
          if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      }
  }, [cart.items, status, cart.isHydrated]);

  return <>{children}</>;
}

