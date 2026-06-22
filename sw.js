// Orbit Bill Scanner — Service Worker v1.0
const CACHE = 'orbit-bill-v1';

// Files to cache for offline use
const PRECACHE = [
  './',
  './index.html',
  './manifest.json'
];

// External CDN resources
const CDN_CACHE = 'orbit-cdn-v1';
const CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
  'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Noto+Sans:wght@300;400;500&display=swap'
];

// ── Install ──────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE).then(cache => cache.addAll(PRECACHE)),
      caches.open(CDN_CACHE).then(cache =>
        Promise.allSettled(CDN_URLS.map(url => cache.add(url).catch(() => {})))
      )
    ]).then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE && k !== CDN_CACHE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // For app shell — cache first
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
      )
    );
    return;
  }

  // For CDN assets — cache first, network fallback
  if (CDN_URLS.some(u => event.request.url.startsWith(u.split('/').slice(0,3).join('/')))) {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CDN_CACHE).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => new Response('', { status: 503 }))
      )
    );
  }
});
