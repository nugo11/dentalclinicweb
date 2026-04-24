const CACHE_NAME = 'dentalhub-v2';
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // Skip dev server HMR / Vite internal requests
  if (url.pathname.startsWith('/@') || url.pathname.startsWith('/node_modules') || url.pathname.includes('__vite')) return;

  // Skip module script requests (src/ files) — let the browser/Vite handle these
  if (url.pathname.startsWith('/src/') || url.pathname.endsWith('.jsx') || url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts')) return;

  // For navigation requests (HTML pages), use network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For static assets, use network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        // Only cache valid responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
