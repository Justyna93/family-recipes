// Family Recipes service worker — shell/asset caching.
// Bump CACHE_VERSION when you need to invalidate all caches.
const CACHE_VERSION = "v1";
const STATIC_CACHE = `fr-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `fr-images-${CACHE_VERSION}`;
const STATIC_EXT = /\.(?:js|css|woff2?|ttf|otf|ico)$/i;
const IMAGE_EXT = /\.(?:png|jpe?g|webp|svg|gif|avif)$/i;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== IMAGE_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

async function staleWhileRevalidate(cacheName, request) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || networkPromise;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Next.js hashed static assets — safe to cache aggressively.
  if (sameOrigin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(staleWhileRevalidate(STATIC_CACHE, req));
    return;
  }

  // Other same-origin static files (fonts, icons, etc.).
  if (sameOrigin && STATIC_EXT.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(STATIC_CACHE, req));
    return;
  }

  // Same-origin images — useful for offline recipe browsing.
  if (sameOrigin && IMAGE_EXT.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(IMAGE_CACHE, req));
    return;
  }

  // Remote recipe images (Supabase storage, Unsplash, etc.).
  if (!sameOrigin && IMAGE_EXT.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(IMAGE_CACHE, req));
    return;
  }
});
