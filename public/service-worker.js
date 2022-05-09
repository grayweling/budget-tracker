const APP_PREFIX = "BudgetTracker-";
const VERSION = "version_01";
const CACHE_NAME = APP_PREFIX + VERSION;

// const FILES_TO_CACHE = [
//   "index.html",
//   "css/styles.css",
//   "js/idb.js",
//   "js/index.js",
//   "manifest.json",
// ];

const addResourcesToCache = async (resources) => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(resources);
}

const putInCache = async (request, response) => {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response);
};

const cacheFirst = async ({ request, preloadResponsePromise, fallbackUrl }) => {
    // First try to get the resource from the cache
    const responseFromCache = await caches.match(request);
    if (responseFromCache) {
      return responseFromCache;
    }
  
    // Next try to get the resource from the network
    try {
      const responseFromNetwork = await fetch(request);
      // response may be used only once
      // we need to save clone to put one copy in cache
      // and serve second one
      putInCache(request, responseFromNetwork.clone());
      return responseFromNetwork;
    } catch (error) {
      const fallbackResponse = await caches.match(fallbackUrl);
      if (fallbackResponse) {
        return fallbackResponse;
      }
      // when even the fallback response is not available,
      // there is nothing we can do, but we must always
      // return a Response object
      return new Response('Network error happened', {
        status: 408,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  };

const deleteCache = async key => {
    await caches.delete(key);
}

const deleteOldCaches = async () => {
    const cacheKeepList = [CACHE_NAME];
    const keyList = await caches.keys();
    const cachesToDelete = keyList.filter(key => !cacheKeepList.includes(key));
    await Promise.all(cachesToDelete.map(key => deleteCache(key)));
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    // caches.open(CACHE_NAME).then(function (cache) {
    //   console.log("installing cache : " + CACHE_NAME);
    //   return cache.addAll(FILES_TO_CACHE);
    // })
    addResourcesToCache([
        "./index.html",
        "./css/styles.css",
        "./js/idb.js",
        "./js/index.js",
        "./manifest.json",
    ])
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keyList) {
      let cacheKeeplist = keyList.filter(function (key) {
        return key.indexOf(APP_PREFIX);
      });
      cacheKeeplist.push(CACHE_NAME);

      return Promise.all(
        keyList.map(function (key, i) {
          if (cacheKeeplist.indexOf(key) === -1) {
            console.log("deleting cache: " + keyList[i]);
            return caches.delete(keyList[i]);
          }
        })
      );
    })
  );
});

// self.addEventListener('fetch', function(event) {
//   console.log('fetch request : ' + event.request.url)
//   event.respondWith(
//     caches.match(event.request).then(function(request) {
//       if(request) {
//         console.log('responding with cache: ' + event.request.url)
//         return request
//       } else {
//         console.log('file is not cached, fetching: ' + event.request.url)
//         return fetch(event.request)
//       }
//     })
//   )
// })

self.addEventListener("fetch", (event) => {
    event.respondWith(
        cacheFirst({
            request: event.request,
            fallbackUrl: "index.html",
        })
    );
});