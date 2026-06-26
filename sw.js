const CACHE_NAME = 'tap-card-optimizer-v5';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
];

// On install, pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Clean up old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Serve from cache first, fall back to network (cache-first = instant load)
// Network requests (like the Overpass API location lookup) always go live.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache the third-party location/place lookup — that must always be live
  if (url.hostname.includes('overpass-api.de')) {
    return; // let it hit the network normally
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // cache new same-origin requests for next time
        if (url.origin === location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    }).catch(() => caches.match('./index.html'))
  );
});
