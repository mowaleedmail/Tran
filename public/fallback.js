self.addEventListener('install', function(event) {
  const offlinePage = new Request('/offline.html');
  event.waitUntil(
    fetch(offlinePage).then(function(response) {
      return caches.open('offline').then(function(cache) {
        return cache.put(offlinePage, response);
      });
    })
  );
});

self.addEventListener('fetch', function(event) {
  // Only handle HTML requests
  if (event.request.headers.get('Accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match('/offline.html');
      })
    );
  }
}); 