/* Phonics Game Service Worker — offline support */
const VERSION = '1.1.0';
const PRECACHE = 'phonics-precache-' + VERSION;
const RUNTIME  = 'phonics-runtime-' + VERSION;
const AUDIO    = 'phonics-audio-' + VERSION;
const AUDIO_CACHE_MAX = 80;

const PRECACHE_URLS = [
  'index.html',
  'final.html',
  'phonics.html',
  'wheel.html',
  'bottle.html',
  'audio.html',
  'styles.css',
  'script.js',
  'data.js',
  'version-display.js',
  'manifest.json',
  'static/imgs/icon.svg',
  'static/imgs/icon-maskable.svg',
  'games/index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) =>
      Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== PRECACHE && k !== RUNTIME && k !== AUDIO)
            .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function trimCache(cache, max) {
  cache.keys().then((keys) => {
    for (let i = 0; keys.length - i > max; i++) {
      cache.delete(keys[i]);
    }
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // HTML navigations: network-first, fall back to cache, then the app shell.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match('index.html'))
        )
    );
    return;
  }

  // External audio (R2 CDN etc.): cache-first so played tracks work offline.
  if (req.destination === 'audio' || /\.(?:mp3|wav|ogg|m4a|aac)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(AUDIO).then((cache) =>
        cache.match(req).then((cached) => {
          const network = fetch(req)
            .then((res) => {
              if (res && (res.status === 200 || res.type === 'opaque')) {
                cache.put(req, res.clone())
                  .then(() => trimCache(cache, AUDIO_CACHE_MAX))
                  .catch(() => {});
              }
              return res;
            })
            .catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  // Same-origin assets (CSS/JS/images/fonts): stale-while-revalidate.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(RUNTIME).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Other cross-origin (e.g. remote images): stale-while-revalidate, allow opaque.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && (res.status === 200 || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(RUNTIME).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
