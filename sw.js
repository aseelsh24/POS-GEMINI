// sw.js - Service Worker

const CACHE_NAME = 'grocery-app-static-v1';

// List of files that make up the application shell.
const APP_SHELL_FILES = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/db.js',
    '/js/pos.js',
    '/js/inventory.js',
    '/js/reports.js',
    '/manifest.webmanifest'
];

// Install event: cache the application shell.
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Install event');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(APP_SHELL_FILES);
            })
            .catch(error => {
                console.error('Failed to cache app shell:', error);
            })
    );
});

// Activate event: clean up old caches.
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activate event');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Take control of all pages under its scope immediately.
            return self.clients.claim();
        })
    );
});

// Fetch event: serve from cache first, then network.
self.addEventListener('fetch', (event) => {
    // We only want to handle GET requests.
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // If the request is in the cache, return the cached response.
                if (response) {
                    // console.log(`[Service Worker] Returning from cache: ${event.request.url}`);
                    return response;
                }

                // If the request is not in the cache, fetch it from the network.
                // console.log(`[Service Worker] Fetching from network: ${event.request.url}`);
                return fetch(event.request);
            })
    );
});
