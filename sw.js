// Service worker: deixa o app disponível offline.
// Ao publicar uma versão nova, aumente o número em CACHE.
const CACHE = 'coffee-lab-v5';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './js/core.js',
  './js/brew.js',
  './js/screens.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-180.png',
  './fonts/dm-serif-display.woff2',
  './fonts/inter.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Responde do cache na hora e atualiza o cache em segundo plano.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req)
      .then((res) => {
        if (res.ok) cache.put(req, res.clone());
        return res;
      })
      .catch(() => cached);
    if (cached) {
      e.waitUntil(net);
      return cached;
    }
    return net;
  })());
});
