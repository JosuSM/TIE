// TIE — Professional-grade Service Worker for Retro Gaming (v0.2)
const CACHE_NAME = 'tie-assets-v2';
const CORES_CACHE = 'tie-cores-v1';

const PRECACHE_ASSETS = [
  '/TIE/',
  '/TIE/index.html',
  '/TIE/tie.svg',
];

// 1. Install: Precache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// 2. Activate: Clean up old versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key !== CORES_CACHE).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 3. Fetch Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // STRATEGY A: Emulator Cores (CDN wasm/js) -> Cache First
  // Nostalgist usually loads from unpkg.com
  if (url.hostname.includes('unpkg.com') || url.pathname.endsWith('.wasm')) {
    event.respondWith(
      caches.open(CORES_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) return response;
          return fetch(request).then((networkResponse) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // STRATEGY B: Standard Assets -> Stale-While-Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
           if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
           }
           return networkResponse;
        });
        return cachedResponse || fetchPromise;
      });
    })
  );
});
