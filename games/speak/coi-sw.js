if (typeof window === 'undefined') {
    const VERSION = '1.3.0';
    const CACHE = `speak-shell-${VERSION}`;
    const BASE = new URL('./', self.location.href).href;
    const SHELL = [
        'index.html',
        'style.v2.css',
        'script.v2.js',
        'style.css',
        'script.js',
        'coi-sw.js',
        '../../data/level_words.js',
        '../../data/word_icons.js',
        'vendor/Vosklet.js',
        'vendor/Vosklet.wasm'
    ].map((path) => new URL(path, BASE).href);
    const INDEX_URL = new URL('index.html', BASE).href;

    async function precache() {
        const cache = await caches.open(CACHE);
        await Promise.allSettled(SHELL.map(async (url) => {
            const response = await fetch(url, { cache: 'reload' });
            if (response && response.ok) await cache.put(url, response);
        }));
    }

    self.addEventListener('install', (event) => {
        event.waitUntil(precache().then(() => self.skipWaiting()));
    });

    self.addEventListener('activate', (event) => {
        event.waitUntil((async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys
                    .filter((key) => key.startsWith('speak-shell-') && key !== CACHE)
                    .map((key) => caches.delete(key))
            );
            await self.clients.claim();
            const clients = await self.clients.matchAll({ type: 'window' });
            clients.forEach((client) => {
                try {
                    const result = client.navigate(client.url);
                    if (result && typeof result.catch === 'function') result.catch(() => {});
                } catch (error) {}
            });
        })());
    });

    function withIsolation(response) {
        if (!response || response.status === 0 || response.type === 'opaque') return response;

        const headers = new Headers(response.headers);
        headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
        headers.set('Cross-Origin-Opener-Policy', 'same-origin');
        headers.set('Cross-Origin-Resource-Policy', 'same-origin');

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers
        });
    }

    async function handleNavigation(request) {
        try {
            const response = await fetch(request, { cache: 'reload' });
            if (response && response.ok) {
                const copy = response.clone();
                caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
            }
            return withIsolation(response);
        } catch (error) {
            const cached = await caches.match(request, { ignoreSearch: true });
            const fallback = cached || await caches.match(INDEX_URL);
            if (fallback) return withIsolation(fallback);
            return new Response('Offline', {
                status: 503,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
        }
    }

    async function handleAsset(request) {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(request, { ignoreSearch: true });
        if (cached) return cached;

        try {
            const response = await fetch(request);
            if (response && response.ok) {
                cache.put(request, response.clone()).catch(() => {});
            }
            return response;
        } catch (error) {
            return new Response('Offline asset unavailable', {
                status: 503,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
        }
    }

    self.addEventListener('fetch', (event) => {
        const request = event.request;
        if (request.method !== 'GET') return;

        const url = new URL(request.url);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

        if (request.mode === 'navigate') {
            event.respondWith(handleNavigation(request));
            return;
        }

        if (url.pathname.toLowerCase().includes('/models/')) {
            event.respondWith(
                fetch(request)
                    .catch(() => new Response('Speech model unavailable offline', {
                        status: 503,
                        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                    }))
            );
            return;
        }

        if (url.origin === self.location.origin) {
            event.respondWith(handleAsset(request));
            return;
        }

        event.respondWith(
            fetch(request)
                .catch(() => caches.match(request))
        );
    });
} else {
    const scriptUrl = document.currentScript
        ? document.currentScript.src
        : new URL('coi-sw.js', window.location.href).href;

    if ('serviceWorker' in navigator) {
        let reloading = false;

        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (reloading) return;
            reloading = true;
            window.location.reload();
        });

        if (!window.crossOriginIsolated) {
            navigator.serviceWorker.register(scriptUrl)
                .then((registration) => {
                    if (registration.active && !navigator.serviceWorker.controller) {
                        window.location.reload();
                    }
                })
                .catch((error) => {
                    console.error('Could not enable cross-origin isolation for speech recognition:', error);
                });
        } else {
            navigator.serviceWorker.getRegistration()
                .then((registration) => registration && registration.update())
                .catch(() => {});
        }
    }
}
