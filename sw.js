const CACHE_NAME = 'suzener-market-v11';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

// Yükleme Aşaması
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Eski Önbellekleri Temizleme
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// İstekleri Yönetme (Fetch)
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // 1. Supabase ve dış CDN isteklerini Service Worker'a hiç bulaştırma (Doğrudan ağa bırak)
  if (url.hostname.includes('supabase.co') || url.hostname.includes('jsdelivr.net') || url.hostname.includes('unpkg.com')) {
    return; 
  }

  // 2. Kendi dosyalarımız için Önce Ağ, İnternet yoksa Önbellek (Network-First)
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        if (response && response.status === 200 && e.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});