const CACHE_NAME = 'albatre-cache-v4';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './images/hero-etretat.jpg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // coupes.json et les données distantes des fiches ne doivent jamais être
  // servis depuis un cache obsolète : toujours réseau, jamais d'interception.
  if (request.url.includes('coupes.json') || request.url.includes('coupe.json')) {
    return;
  }

  // Network-first pour les fichiers de l'app (HTML/JS/CSS)
  if (request.mode === 'navigate' || PRECACHE_ASSETS.includes(new URL(request.url).pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first pour le reste (icônes, polices, assets vendorisés)
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
