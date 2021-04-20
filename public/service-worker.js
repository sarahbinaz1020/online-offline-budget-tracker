const FILES_TO_CACHE = [  
  '/index.html',
  '/styles.css',
  '/db.js',
  '/index.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.webmanifest',
  ];
  
  
  const CACHE_NAME = "static-cache-v3";
  const DATA_CACHE_NAME = "data-cache-v1";
  
  self.addEventListener("install", function (evt) {
    evt.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        console.log("Your files were pre-cached successfully!");
        return cache.addAll(FILES_TO_CACHE);
      })
    );
    self.skipWaiting();
  });
  self.addEventListener("activate", function (evt) {
    evt.waitUntil(
      caches.keys().then((keyList) => {
        return Promise.all(
          keyList.map((key) => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log("Removing old cache data", key);
              return caches.delete(key);
            }
          })
        );
      })
    );
    self.clients.claim();
  });
  // fetch
  self.addEventListener("fetch", evt => {
    // non GET requests are not cached and requests to other origins are not cached
    if (
      evt.request.method !== "GET" ||
      !evt.request.url.startsWith(self.location.origin)
    ) {
      evt.respondWith(fetch(evt.request));
      return;
    }
  
  // handle runtime GET requests for data from /api routes
  
  if (evt.request.url.includes("/api/transaction")) {
    // make network request and fallback to cache if network request fails (offline)
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(evt.request)
          .then(response => {
            cache.put(evt.request, response.clone());
            return response;
          })
          .catch(() => caches.match(evt.request));
      })
    );
    return;
  }

  // use cache first for all other requests for performance
  evt.respondWith(
    caches.match(evt.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // request is not in cache. make network request and cache the response
      return caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(evt.request).then(response => {
          return cache.put(evt.request, response.clone()).then(() => {
            return response;
          });
        });
      });
    })
  );
});