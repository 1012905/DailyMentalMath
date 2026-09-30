/* 口算天天练 (DailyMentalMath) — service worker.
 *
 * Served from the site root (public/sw.js -> dist/sw.js -> /<repo>/sw.js), so its
 * default scope is the whole project site. Every URL below is relative, which is
 * what makes this work on https://<user>.github.io/<repo>/ as well as on a local
 * preview server — there is no absolute "/sw.js"-style assumption anywhere.
 *
 * Strategies
 *   navigation  network-first, falling back to the cached app shell  (fresh app,
 *               still opens with the network off)
 *   static      stale-while-revalidate                                (instant
 *               repeat loads; the next visit picks up new bytes)
 *   other       straight to the network, no caching
 *
 * Release note: bump VERSION when the app changes. Navigations are network-first
 * so an online visit always picks up the new build and refreshes the cached
 * shell by itself — VERSION is what forces every client to drop the old caches
 * immediately, which matters for offline launches.
 */

const VERSION = "v1";
const SHELL_CACHE = `dmm-shell-${VERSION}`;
const ASSET_CACHE = `dmm-assets-${VERSION}`;
const KEEP = new Set([SHELL_CACHE, ASSET_CACHE]);

// The app shell. `vite-plugin-singlefile` inlines all JS/CSS into index.html, so
// "./" plus the icons, manifest and fonts is genuinely the whole application.
const SHELL_URLS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./favicon-32.png",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./fonts/fonts.css",
  "./fonts/inter-var-subset.woff2",
  "./fonts/noto-sans-sc-subset.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Individually, so one missing file cannot abort the whole install.
      const results = await Promise.allSettled(
        SHELL_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch((err) => {
            console.warn("[sw] precache skipped:", url, err);
            throw err;
          })
        )
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      console.log(`[sw] precached ${results.length - failed}/${results.length} shell URLs`);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.map((name) => (KEEP.has(name) ? null : caches.delete(name))));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

const isCacheableAsset = (url) =>
  /\.(?:css|js|mjs|woff2?|ttf|otf|png|jpe?g|svg|webp|avif|ico|webmanifest)$/i.test(url.pathname) ||
  url.pathname.endsWith("/manifest.webmanifest");

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = (await cache.match(request)) || (fallbackUrl && (await cache.match(fallbackUrl)));
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  if (cached) return cached;
  const response = await network;
  if (response) return response;
  throw new Error(`[sw] offline and not cached: ${request.url}`);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Only same-origin: never shadow a CDN, extension or devtools request.
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, SHELL_CACHE, "./index.html"));
    return;
  }

  if (isCacheableAsset(url)) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
  }
});
