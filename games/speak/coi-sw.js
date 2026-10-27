if (typeof window === 'undefined') {
    const VERSION = '1.0.4';
    const CACHE = `speak-shell-${VERSION}`;
    const BASE = new URL('./', self.location.href).href;
    const SHELL = [
        'index.html',
        'style.css',
        'script.js',
        'coi-sw.js',
        'vendor/Vosklet.js',
        'vendor/Vosklet.wasm'
    ].map((path) => new URL(path, BASE).href);
    const INDEX_URL = new URL('index.html', BASE).href;

    self.addEventListener('install', (event) => {
        event.waitUntil(
            caches.open(CACHE)
                .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
                .then(() => self.skipWaiting())
        );
    });

    self.addEventListener('activate', (event) => {
        event.waitUntil(
            caches.keys()
                .then((keys) => Promise.all(
                    keys
                        .filter((key) => key.startsWith('speak-shell-') && key !== CACHE)
                        .map((key) => caches.delete(key))
                ))
                .then(() => self.clients.claim())
        );
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
            const response = await fetch(request);
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
        if (!window.crossOriginIsolated) {
            let reloading = false;

            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (reloading) return;
                reloading = true;
                window.location.reload();
            });

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
