'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setWishlist, setWishlistHydrated } from '@/store/slices/wishlistSlice';
import { useSession } from 'next-auth/react';

export function WishlistHydrator({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { status } = useSession();
  const fetchAttempted = useRef(false);

  useEffect(() => {
    if (status === 'authenticated' && !fetchAttempted.current) {
      const fetchWishlist = async () => {
        fetchAttempted.current = true;
        try {
          const res = await fetch('/api/wishlist');
          if (res.ok) {
            const serverWishlist = await res.json();
            const finalIds = serverWishlist
                .map((item: any) => typeof item === 'string' ? item : (item._id || item.id))
                .filter((id: any): id is string => typeof id === 'string' && id.length > 0);
            
            dispatch(setWishlist(finalIds));
            dispatch(setWishlistHydrated());
          } else {
            console.warn('Could not fetch wishlist from API');
            dispatch(setWishlistHydrated());
          }
        } catch (error) {
          console.warn('Failed to fetch wishlist from server:', error);
          dispatch(setWishlistHydrated());
        }
      };

      fetchWishlist();
    } else if (status === 'unauthenticated') {
      // Clear wishlist when not logged in
      dispatch(setWishlist([]));
      dispatch(setWishlistHydrated());
      fetchAttempted.current = false; // Reset so it fetches again on login
    } else if (status === 'loading') {
      // Do nothing, wait for auth resolution
    }
  }, [status, dispatch]);

  return <>{children}</>;
}

