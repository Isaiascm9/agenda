const CACHE_NAME = 'miagenda-cache-v1';
const APP_SHELL = ['./', './index.html'];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(APP_SHELL).catch(function () {});
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (k) { return k !== CACHE_NAME; })
                    .map(function (k) { return caches.delete(k); })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function (event) {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return; // no interceptar peticiones a otros dominios (Google Sheets, etc.)
    event.respondWith(
        caches.match(event.request).then(function (cached) {
            const networkFetch = fetch(event.request)
                .then(function (response) {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(function (cache) {
                            cache.put(event.request, copy);
                        });
                    }
                    return response;
                })
                .catch(function () { return cached; });
            return cached || networkFetch;
        })
    );
});
