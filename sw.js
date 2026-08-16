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
var CACHE_VERSION = 'v5';
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

/**
 * Precache the shell, bypassing the HTTP cache.
 *
 * cache.addAll() fetches through the normal HTTP cache. GitHub Pages serves
 * everything with `Cache-Control: max-age=600`, so a visitor who returns
 * within ten minutes of a deploy would have the *old* files copied into the
 * *new* cache — and because we serve cache-first, that stale copy would then
 * be pinned until the next version bump. Tested and confirmed: bumping the
 * version alone did not deliver the update.
 *
 * `cache: 'reload'` forces each request to the network. The puts are also
 * all-or-nothing: if any file fails, install rejects and the old worker
 * stays in charge, so we never activate a half-updated, mixed-version shell.
 * Mixed versions are the dangerous case, because stale app.js against fresh
 * data.js is exactly how a migration corrupts saved progress.
 */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        return Promise.all(SHELL.map(function (url) {
          return fetch(new Request(url, { cache: 'reload' })).then(function (response) {
            if (!response || !response.ok) {
              throw new Error('precache failed for ' + url + ' (' + (response && response.status) + ')');
            }
            return cache.put(url, response);
          });
        }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

/**
 * Drop caches from previous versions.
 *
 * This only touches the Cache Storage API, which holds HTTP responses.
 * localStorage lives in a separate store and is untouched by caches.delete(),
 * so user progress survives every update. Verified by loading saved progress,
 * shipping a new version, and confirming the ticks and level came through the
 * cache swap intact. Do not add storage clearing here.
 */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) {
          if (key.indexOf('e33-guide-') === 0 && key !== CACHE_NAME) {
            return caches.delete(key);
          }
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
