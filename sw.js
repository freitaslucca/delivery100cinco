/* Service Worker — 100 Cinco
   - Push notifications de novos pedidos
   - Cache mínimo do app shell pra abrir offline */

const CACHE_NAME = '100cinco-v1';
const APP_SHELL = ['/pedidos.html', '/src/pedidos.js', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    // Nunca cacheia API ou push
    if (url.pathname.startsWith('/api/')) return;
    // Network-first com fallback no cache
    event.respondWith(
        fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
            return res;
        }).catch(() => caches.match(req))
    );
});

self.addEventListener('push', (event) => {
    let payload = { title: '🛒 Novo pedido — 100 Cinco', body: 'Você tem um pedido novo!' };
    try {
        if (event.data) payload = { ...payload, ...event.data.json() };
    } catch (e) { /* texto puro */ }

    const options = {
        body: payload.body,
        icon: '/assets/favicon.png',
        badge: '/assets/favicon.png',
        tag: payload.tag || 'order',
        renotify: true,
        requireInteraction: payload.requireInteraction !== false,
        vibrate: [200, 100, 200, 100, 200],
        data: { url: payload.url || '/pedidos.html', ...(payload.data || {}) },
        actions: [
            { action: 'open', title: 'Abrir painel' },
            { action: 'dismiss', title: 'Depois' },
        ],
    };

    event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'dismiss') return;

    const url = event.notification.data?.url || '/pedidos.html';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
            // Se já tiver uma janela aberta, focar nela
            for (const w of wins) {
                if (w.url.includes('/pedidos.html')) {
                    return w.focus().then(() => w.navigate ? w.navigate(url) : null);
                }
            }
            return clients.openWindow(url);
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
