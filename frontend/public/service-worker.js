/* eslint-disable no-restricted-globals */

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.

// Cache and update strategy for assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('hotel-management-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/static/js/main.chunk.js',
        '/static/js/0.chunk.js',
        '/static/js/bundle.js',
        '/manifest.json',
        '/favicon.ico',
        '/logo192.png',
        '/logo512.png'
      ]);
    })
  );
});

// Serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request).then((response) => {
          // Don't cache API calls
          if (
            !response || 
            response.status !== 200 || 
            response.type !== 'basic' || 
            event.request.url.includes('/api/')
          ) {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open('hotel-management-v1').then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
    );
  }
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = ['hotel-management-v1'];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
