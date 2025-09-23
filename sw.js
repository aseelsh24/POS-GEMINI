// sw.js - Service Worker

const STATIC_CACHE_NAME = 'grocery-app-static-v2'; // Incremented version
const DYNAMIC_CACHE_NAME = 'grocery-app-dynamic-v2';

// List of files that make up the application shell.
const APP_SHELL_FILES = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/db.js',
    '/js/auth.js',
    '/js/inventory.js',
    '/js/pos.js',
    '/js/suppliers.js',
    '/js/purchases.js',
    '/js/customers.js',
    '/js/reports.js',
    '/js/backup.js',
    '/manifest.webmanifest',
    '/offline.html' // Add the offline fallback page
];

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Install');
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(APP_SHELL_FILES);
            })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activate');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // For navigation requests, use a network-first strategy with a fallback to the offline page.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match('/offline.html'))
        );
        return;
    }

    // For other requests (CSS, JS, data), use a cache-first strategy.
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                // If we get a response from the network, cache it for future offline use.
                return caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                    cache.put(event.request.url, fetchResponse.clone());
                    return fetchResponse;
                });
            });
        })
    );
});
