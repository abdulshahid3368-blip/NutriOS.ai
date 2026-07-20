const CACHE_NAME = 'nutrios-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  '/public/manifest.json',
  '/public/favicon.ico',
  '/public/icons/icon-192x192.png',
  '/public/icons/icon-512x512.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[NutriOS SW] Pre-caching offline shell and assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[NutriOS SW] Clearing outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network-First, fall back to Cache for HTML, Cache-First for static assets
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // We skip non-GET requests and firestore/firebase/auth/api requests
  if (request.method !== 'GET' || request.url.includes('/api/') || request.url.includes('firestore') || request.url.includes('firebase')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cache successful requests
        if (networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        console.log('[NutriOS SW] Network failure, serving from cache:', request.url);
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If HTML request failed, fall back to index.html
          if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/');
          }
        });
      })
  );
});

// Push Notification Listener
self.addEventListener('push', (event) => {
  let data = { title: 'NutriOS AI', body: 'Time for your personalized metabolic check!' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'NutriOS AI', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/public/icons/icon-192x192.png',
    badge: '/public/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      const urlToOpen = event.notification.data.url || '/';
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
