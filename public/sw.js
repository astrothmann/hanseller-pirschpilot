/* Hanseller Pirschpilot · Service Worker v2
   Network-first for HTML pages, cache-first for assets. */
const VERSION = "pirschpilot-v1";
const CACHE = VERSION;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // API: always hit the network (never serve stale map data).
  if (url.pathname.startsWith("/api/")) return;

  // HTML pages: network-first (always get latest)
  const isPage = req.headers.get("accept")?.includes("text/html") ||
    url.pathname.endsWith("/") ||
    url.pathname.endsWith(".html");

  // Uploaded photos: network-first so deleted photos disappear promptly.
  const isUpload = url.pathname.startsWith("/jagdmap/uploads/");

  if (isPage || isUpload) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // Assets: cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, clone));
        }
        return res;
      });
    })
  );
});
