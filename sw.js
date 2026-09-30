const CACHE_NAME = 'homework-board-offline-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest?v=4',
  './icon-180-v2.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.addAll(APP_SHELL); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(keys.map(function(key) {
          if(key.indexOf('homework-board-offline-') === 0 && key !== CACHE_NAME) {
            return caches.delete(key);
          }
        }));
      })
      .then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  var request = event.request;
  if(request.method !== 'GET') return;
  var url = new URL(request.url);
  if(url.origin !== self.location.origin) return;

  if(request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(function(response) {
        if(response && response.ok) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put('./index.html', copy); });
        }
        return response;
      }).catch(function() {
        return caches.match('./index.html').then(function(cached) {
          return cached || caches.match('./');
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request, {ignoreSearch:true}).then(function(cached) {
      if(cached) {
        fetch(request).then(function(response) {
          if(response && response.ok) {
            caches.open(CACHE_NAME).then(function(cache) { cache.put(request, response); });
          }
        }).catch(function(){});
        return cached;
      }
      return fetch(request).then(function(response) {
        if(response && response.ok) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(request, copy); });
        }
        return response;
      });
    })
  );
});
