
// A simple service worker for basic PWA functionality (caching and push notifications)

const CACHE_NAME = 'football-eswatini-cache-v5';
const urlsToCache = [
  '/',
  '/index.html',
];

// Install event: cache core assets
self.addEventListener('install', event => {
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
        return self.clients.claim();
    })
  );
});

/**
 * STRATEGY CHANGE: Network-First (v5)
 * We always try the network first. This ensures that as long as the user has internet,
 * they get the latest code you pushed to GitHub. The cache is ONLY a fallback for offline use.
 */
self.addEventListener('fetch', event => {
  // Never cache Firestore
  if (event.request.url.indexOf('firestore.googleapis.com') > -1) {
    return fetch(event.request);
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If network works, update the cache and return response
        if (response && response.status === 200) {
           const responseToCache = response.clone();
           caches.open(CACHE_NAME).then(cache => {
             cache.put(event.request, responseToCache);
           });
        }
        return response;
      })
      .catch(() => {
        // Only if network fails (offline), try the cache
        return caches.match(event.request);
      })
  );
});

// Push event: handle incoming push notifications
self.addEventListener('push', event => {
  try {
    const data = event.data.json();
    const title = data.title || 'Football Eswatini News';
    const options = {
      body: data.body || 'Something new happened!',
      icon: 'assets/icon-192.png',
      badge: 'assets/icon-192.png',
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error('Push error', e);
  }
});
