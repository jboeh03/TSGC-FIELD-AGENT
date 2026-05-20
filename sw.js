// Minimal app-shell service worker for offline use in the field.
const CACHE = "tsgc-field-v10";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./icon.svg",
  "./logo-white.svg",
  "./logo-blue.svg",
  "./logo-2color.svg",
  "./js/app.js",
  "./js/state.js",
  "./js/utils.js",
  "./js/data.js",
  "./js/views/jobs.js",
  "./js/views/newJob.js",
  "./js/views/job.js",
  "./js/views/parts.js",
  "./js/views/knowledge.js",
  "./js/views/manuals.js",
  "./js/views/scan.js",
  "./js/views/settings.js",
  "./js/views/share.js",
  "./js/views/customers.js",
  "./js/views/create.js",
  "./js/vision.js",
  "./js/composite.js",
  "./js/crm.js",
  "./js/customerLookup.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Never cache cross-origin (Tailwind CDN, affiliate links, maps, etc.)
  if (url.origin !== location.origin) return;

  // Never cache API calls — they need fresh network every time.
  if (url.pathname.startsWith("/api/")) return;

  // Network-first for HTML so updates roll out quickly.
  if (req.mode === "navigate" || req.destination === "document") {
    e.respondWith(
      fetch(req)
        .then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return r; })
        .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  // Cache-first for everything else in the app shell.
  e.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req).then((r) => {
        if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return r;
      }).catch(() => cached)
    )
  );
});
