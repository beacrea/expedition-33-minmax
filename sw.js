/**
 * Expedition 33 — Build Reference : service worker
 *
 * Strategy: cache-first for the app shell. The content is a static
 * reference guide, so a fast offline-capable load matters more than
 * instant freshness. Updates ship by bumping CACHE_VERSION below.
 *
 * IMPORTANT: bump CACHE_VERSION whenever you edit js/data.js, css/styles.css,
 * or index.html — otherwise returning visitors keep the cached copy.
 */
var CACHE_VERSION = 'v2';
var CACHE_NAME = 'e33-guide-' + CACHE_VERSION;

var SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/data.js',
  './js/app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) {
          if (key !== CACHE_NAME) return caches.delete(key);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;

  // Only handle same-origin GETs; leave everything else to the network.
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) return cached;

      return fetch(request)
        .then(function (response) {
          // Only cache real, complete same-origin responses.
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, copy);
          });
          return response;
        })
        .catch(function () {
          // Offline and uncached: fall back to the shell for navigations.
          if (request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return Response.error();
        });
    })
  );
});
