
// A simple service worker for basic PWA functionality (caching and push notifications)

const CACHE_NAME = 'football-eswatini-cache-v3';
const urlsToCache = [
  '/',
  '/index.html',
];

// Install event: cache core assets
self.addEventListener('install', event => {
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Installing new cache version:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event: clear all old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
    })
  );
});

// Fetch event: serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Push event: handle incoming push notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  console.log('Push received:', data);

  const title = data.title || 'Football Eswatini News';
  const options = {
    body: data.body || 'Something new happened!',
    icon: 'assets/icon-192.png',
    badge: 'assets/icon-192.png',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
