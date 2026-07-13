'use client';

import { useEffect } from 'react';

export function PWARegistry() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV !== 'production') {
        // Unregister existing service workers in development to prevent caching issues
        navigator.serviceWorker.getRegistrations()
          .then((registrations) => {
            return Promise.all(registrations.map(r => r.unregister().catch(err => console.error('Error unregistering service worker:', err))));
          })
          .catch(err => console.error('Error getting service worker registrations:', err));
        return;
      }

      const handleServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered with scope:', registration.scope);
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      };

      handleServiceWorker();
    }
  }, []);

  return null;
}

