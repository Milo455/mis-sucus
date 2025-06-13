const CACHE_NAME = 'mis-sucus-cache-v2';
const URLS_TO_CACHE = [
  '/',
  'index.html',
  'manifest.json',
  'style.css',
  'app.js',
  'firebase-init.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'species.html',
  'plant.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
