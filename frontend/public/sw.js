const filesMustCache = /(googleapis|gstatic)|\.(JS|CSS|SVG|PNG|JPG|jPEG|WEBP|BMP|GIF|ICO|WEBM|MPG|MP2|MP4|MPEG|MPE|MPV|OGG|M4P|M4V|AVI|WMV|MOV|QT|FLV|SWF|AVCHD|JSON)$/gim;
const staticFileCacheName = "static-files-v1";
const staticFileCachePaths = [
  "/",
  "/offline.html",
  "/style/index.css",
  "/script/utility.js",
  "/manifest.json",
];

self.addEventListener("install", (evt) => {
  evt.waitUntil(caches.open(staticFileCacheName).then((cache) => cache.addAll(staticFileCachePaths)));
  self.skipWaiting();
});

self.addEventListener("activate", async (evt) => {
  evt.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => key !== staticFileCacheName && caches.delete(key))))
  );
});

self.addEventListener("fetch", (evt) => {
  if (evt.request.url.indexOf("http") < 0) evt.respondWith(fetch(evt.request));
  else if (filesMustCache.test(evt.request.url)) {
    evt.respondWith(
      caches
        .match(evt.request)
        .then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(evt.request).then((response) => {
            return caches.open(staticFileCacheName).then((cache) => {
              cache.put(evt.request, response.clone());
              return response;
            });
          });
        })
        .catch((error) => caches.match(staticFileCachePaths[1])) // offline fallback page
    );
  } else {
    evt.respondWith(
      fetch(evt.request)
        .then((response) => {
          return caches.open(staticFileCacheName).then((cache) => {
            cache.delete("/");
            cache.add("/");
            cache.put(evt.request, response.clone());
            return response;
          });
        })
        .catch((error) => {
          console.log("SW", error);
          caches.match(evt.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return caches.match(staticFileCachePaths[1]);
          });
        }) // offline fallback page
    );
  }
});

// self.addEventListener("fetch", (evt) => {
//   if (/auth/.test(evt.request.url)) {
//     evt.respondWith(
//       caches.open(staticFileCacheName).then((cache) => {
//         cache.delete("/");
//         return fetch(evt.request).then((response) => {
//           cache.add("/");
//           return response;
//         });
//       })
//     );
//   } else {
//     evt.respondWith(
//       caches
//         .match(evt.request)
//         .then((cachedResponse) => {
//           if (cachedResponse) return cachedResponse;
//           else if (evt.request.url.indexOf("http") < 0) return fetch(evt.request);
//           return fetch(evt.request).then((response) => {
//             if (!filesMustCache.test(evt.request.url)) return response;
//             return caches.open(staticFileCacheName).then((cache) => {
//               cache.put(evt.request, response.clone());
//               return response;
//             });
//           });
//         })
//         .catch((error) => caches.match(staticFileCachePaths[1])) // offline fallback page
//     );
//   }
// });
