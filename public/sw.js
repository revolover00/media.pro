const CACHE_NAME = 'promedia-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn-icons-png.flaticon.com/512/3342/3342137.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Only cache GET requests
  if (e.request.method !== 'GET') return;
  
  // Avoid caching chrome-extension or external analytics if any
  const url = new URL(e.request.url);
  if (!url.protocol.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return from cache, but fetch fresh in background (stale-while-revalidate)
        fetch(e.request).then((freshResponse) => {
          if (freshResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, freshResponse);
            });
          }
        }).catch(() => {/* Ignore network failures when offline */});
        return cachedResponse;
      }

      return fetch(e.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
        
        return response;
      }).catch(() => {
        // Fallback for offline mode if resources are index files
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
