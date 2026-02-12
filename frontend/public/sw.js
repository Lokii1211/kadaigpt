/**
 * KadaiGPT - Service Worker
 * Enables PWA offline-first functionality
 * 
 * Caching strategies:
 * - Cache First: Static assets (JS, CSS, images, fonts)
 * - Network First: API calls (with offline fallback)
 * - Stale While Revalidate: HTML pages
 */

const CACHE_NAME = 'kadaigpt-v2';
const STATIC_CACHE = 'kadaigpt-static-v2';
const API_CACHE = 'kadaigpt-api-v2';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
];

// API routes that should be cached for offline
const CACHEABLE_API_ROUTES = [
    '/api/v1/products/',
    '/api/v1/customers/',
    '/api/v1/dashboard/stats',
    '/api/health',
];

// ── Install Event ──
self.addEventListener('install', (event) => {
    console.log('[SW] Installing KadaiGPT Service Worker...');
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[SW] Pre-caching static assets');
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('[SW] Some assets failed to cache:', err);
            });
        })
    );
    self.skipWaiting();
});

// ── Activate Event ──
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== STATIC_CACHE && name !== API_CACHE && name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim();
});

// ── Fetch Event ──
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip Chrome extensions and non-HTTP
    if (!url.protocol.startsWith('http')) return;

    // API routes - Network First
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // Static assets - Cache First
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirstStrategy(request));
        return;
    }

    // HTML pages - Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request));
});

// ── Caching Strategies ──

async function cacheFirstStrategy(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.warn('[SW] Cache-first fetch failed:', request.url);
        return new Response('Offline', { status: 503 });
    }
}

async function networkFirstStrategy(request) {
    try {
        const response = await fetch(request);

        // Cache successful API responses
        if (response.ok && isCacheableAPI(new URL(request.url).pathname)) {
            const cache = await caches.open(API_CACHE);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        // Offline - try cache
        const cached = await caches.match(request);
        if (cached) {
            console.log('[SW] Serving cached API:', request.url);
            return cached;
        }

        // Return offline JSON response for API calls
        return new Response(
            JSON.stringify({
                error: true,
                offline: true,
                message: 'You are offline. Data shown may be outdated.',
                cached_at: null,
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}

async function staleWhileRevalidate(request) {
    const cached = await caches.match(request);

    const fetchPromise = fetch(request)
        .then((response) => {
            if (response.ok) {
                const cache = caches.open(CACHE_NAME);
                cache.then((c) => c.put(request, response.clone()));
            }
            return response;
        })
        .catch(() => null);

    return cached || (await fetchPromise) || new Response('Offline', { status: 503 });
}

// ── Helpers ──

function isStaticAsset(pathname) {
    return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(pathname);
}

function isCacheableAPI(pathname) {
    return CACHEABLE_API_ROUTES.some((route) => pathname.startsWith(route));
}

// ── Background Sync ──
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-bills') {
        console.log('[SW] Background sync: bills');
        event.waitUntil(syncPendingBills());
    }
});

async function syncPendingBills() {
    // Notify the main app to trigger sync
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
        client.postMessage({ type: 'SYNC_REQUESTED', payload: 'bills' });
    });
}

// ── Push Notifications ──
self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const options = {
            body: data.body || 'New notification from KadaiGPT',
            icon: '/kadaigpt-icon-192.png',
            badge: '/kadaigpt-badge-72.png',
            tag: data.tag || 'kadaigpt-notification',
            data: data.url || '/',
            actions: data.actions || [],
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'KadaiGPT', options)
        );
    } catch (e) {
        console.error('[SW] Push parse error:', e);
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data || '/';
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((clients) => {
            const existing = clients.find((c) => c.url === url);
            if (existing) return existing.focus();
            return self.clients.openWindow(url);
        })
    );
});

console.log('[SW] KadaiGPT Service Worker loaded 🛒');
