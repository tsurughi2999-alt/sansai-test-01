// 山菜採り手帳 - Service Worker v16
const CACHE_NAME = 'sansai-v16
';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-96.png',
  './icon-192.png',
  './icon-180.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './logo-badge.png',
];

// インストール時：古いキャッシュを削除して新しいファイルをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() =>
      caches.open(CACHE_NAME).then(cache =>
        cache.addAll(PRECACHE).catch(() => {})
      )
    ).then(() => self.skipWaiting())
  );
});

// アクティベート時：古いキャッシュを全削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// フェッチ：ネットワーク優先、失敗時はキャッシュ
self.addEventListener('fetch', event => {
  // 天気API・図鑑配信データ(zukan.json)はキャッシュしない（常に最新を直接取得）
  if (event.request.url.includes('open-meteo.com') ||
      event.request.url.includes('api.anthropic.com') ||
      event.request.url.includes('zukan.json')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached =>
          cached || caches.match('./index.html')
        )
      )
  );
});
