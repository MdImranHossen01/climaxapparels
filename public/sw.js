const CACHE_NAME = 'Climax Apparels-cache-v1';
const OFFLINE_URL = '/offline';

const ASSETS_TO_CACHE = [
  '/',
  '/favicon.ico',
  '/icon-512x512.png',
  '/manifest.webmanifest',
  OFFLINE_URL,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching critical assets');
      // Use a more resilient approach: cache what we can, don't fail everything if one fails
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url =>
          cache.add(url).catch(err => console.error(`Failed to cache ${url}:`, err))
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip non-http schemes
  if (!['http:', 'https:'].includes(url.protocol)) return;

  // 1. API Requests - Network Only
  if (url.pathname.startsWith('/api/')) {
    return; // Let browser handle it normally
  }

  // 2. Next.js Static Assets (Hashed/Immutable) - Cache First
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/static/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. Navigation Requests (HTML) - Network First
  // This is critical to avoid "stale HTML pointing to old chunks"
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return caches.match(OFFLINE_URL).then((offlineResponse) => {
              if (offlineResponse) return offlineResponse;
              return caches.match('/').then((homeResponse) => {
                if (homeResponse) return homeResponse;
                // Serve a generic fallback instead of letting the browser fail with an unstyled error page
                return new Response(
                  `<!DOCTYPE html>
                  <html lang="en">
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>Connection Offline</title>
                    <style>
                      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; margin: 0; padding: 20px; text-align: center; background: #ffffff; color: #1a1a1a; }
                      .card { max-width: 400px; padding: 30px; border-radius: 12px; }
                      h1 { font-size: 24px; font-weight: 800; margin: 0 0 10px 0; }
                      p { font-size: 15px; color: #666666; margin: 0 0 24px 0; line-height: 1.5; }
                      button { background: #000000; color: #ffffff; border: none; padding: 12px 24px; font-size: 15px; font-weight: 600; border-radius: 8px; cursor: pointer; transition: background 0.2s; }
                      button:hover { background: #333333; }
                    </style>
                  </head>
                  <body>
                    <div class="card">
                      <h1>You're Offline</h1>
                      <p>Please check your internet connection and try reloading the page.</p>
                      <button onclick="window.location.reload()">Reload</button>
                    </div>
                  </body>
                  </html>`,
                  {
                    status: 503,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' }
                  }
                );
              });
            });
          });
        })
    );
    return;
  }

  // 4. Everything else - Stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
        }
        return networkResponse;
      }).catch((error) => {
        if (cachedResponse) return cachedResponse;
        throw error;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
