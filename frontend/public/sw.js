const filesMustCache = /(googleapis|gstatic)|\.(JS|CSS|SVG|PNG|JPG|jPEG|WEBP|BMP|GIF|ICO|WEBM|MPG|MP2|MP4|MPEG|MPE|MPV|OGG|M4P|M4V|AVI|WMV|MOV|QT|FLV|SWF|AVCHD|JSON)$/gim;
const staticFileCacheName = "static-files-v6";
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
  else if (/auth/.test(evt.request.url)) evt.respondWith(handleAuthRequest(evt.request));
  else if (/api/.test(evt.request.url)) evt.respondWith(fetch(evt.request));
  else if (filesMustCache.test(evt.request.url)) evt.respondWith(handleCachedFileRequest(evt.request));
  else evt.respondWith(handleOtherRequest(evt.request));
});

async function handleAuthRequest(request) {
  try {
    const cache = await caches.open(staticFileCacheName);
    cache.delete("/");
    const response = await fetch(request);
    cache.add("/");
    return response;
  } catch (error) {
    return handleCachedFileRequest(request);
  }
}
async function handleOtherRequest(request) {
  try {
    const response = await fetch(request);
    if (request.method != "POST") {
      await caches.open(staticFileCacheName).then((cache) => cache.put(request, response.clone()));
    }
    return response;
  } catch (error) {
    return handleCachedFileRequest(request);
  }
}
async function handleCachedFileRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    const response = await fetch(request);
    const cache = await caches.open(staticFileCacheName);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return getDefaultResponse(request);
  }
}
function getDefaultResponse(request) {
  return caches.match(request).then((cachedResponse) => {
    if (cachedResponse) return cachedResponse;
    return caches.match(staticFileCachePaths[1]);
  });
}
