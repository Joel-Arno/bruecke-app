// Offline-Unterstützung: erst aus dem Cache antworten, im Hintergrund aktualisieren.
const CACHE = 'steg-und-stein-v1';
const FILES = [
  './', 'index.html', 'style.css', 'manifest.webmanifest', 'fonts/fredoka-latin.woff2',
  'js/main.js', 'js/scene.js', 'js/levelview.js', 'js/island.js', 'js/puzzle.js', 'js/levels.js',
  'js/models.js', 'js/voxel.js', 'js/audio.js', 'js/storage.js', 'vendor/three.module.min.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const fresh = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    }),
  );
});
