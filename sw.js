const CACHE_NAME = 'proxify-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/logo.png',
  '/copy-icon.png',
  '/download-icon.png',
  '/connect-icon.png',
  '/copied-icon.png',
  '/error-icon.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request)
      .then(response => response || fetch(e.request))
  );
});