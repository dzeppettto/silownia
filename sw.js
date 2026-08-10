const CACHE = 'betternm-v26';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './logo.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      const stale = keys.filter((k) => k !== CACHE);
      return Promise.all(stale.map((k) => caches.delete(k))).then(() => stale.length > 0);
    }).then((updated) => {
      self.clients.claim();
      if (updated) {
        return self.clients.matchAll({ type: 'window' }).then((list) => {
          list.forEach((c) => c.navigate(c.url));
        });
      }
    })
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, copy));
          return resp;
        })
        .catch(() => caches.match(e.request).then((cached) => cached || caches.match('./')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, copy));
          return resp;
        })
        .catch(() => cached);
    })
  );
});
