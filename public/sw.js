const CACHE_NAME = 'm1g-cache-v1';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/m1g-logo.png',
  '/offline.html',
  '/portal/medikal',
  '/portal/checkin',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Sadece GET isteklerini cache'le (API veya POST/PUT cache'e alınmaz)
  if (event.request.method !== 'GET') return;

  // Next.js API rotalarını ve Next.js iç statik/HMR dosyalarını PWA Service Worker ile işlemeye sokma (doğrudan networke yönlendir)
  if (event.request.url.includes('/api/') || event.request.url.includes('/_next/') || event.request.url.includes('hot-update')) return;

  const isNextStatic = false;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Başarılıysa ve Next.js statik chunk'ı değilse cache'i güncelle
        if (networkResponse.ok && event.request.url.startsWith('http') && !isNextStatic) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Ağ hatası (Offline), cache'te varsa dön
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Cache'te de yoksa, HTML isteği ise offline sayfasını dön
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match(OFFLINE_URL);
          }
          // Aksi takdirde boş response
          return new Response('', { status: 408, statusText: 'Request timeout.' });
        });
      })
  );
});
