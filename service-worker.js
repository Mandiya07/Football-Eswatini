
// A simple service worker for basic PWA functionality (caching and push notifications)

const CACHE_NAME = 'football-eswatini-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  // In a real app, you would list all your critical assets (JS, CSS, images, fonts)
];

// Install event: cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
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
