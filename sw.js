// 山菜採り手帳 - Service Worker
const CACHE_NAME = 'sansai-v1';

// キャッシュするリソース
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js',
  'https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Shippori+Mincho:wght@400;600&display=swap',
];

// インストール時にキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // 重要なファイルのみ必須キャッシュ、外部CDNは任意
      return cache.addAll(['./index.html', './manifest.json']).then(() => {
        return cache.addAll(PRECACHE).catch(() => {});
      });
    }).then(() => self.skipWaiting())
  );
});

// 古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ネットワーク優先、失敗時はキャッシュから提供（オフライン対応）
self.addEventListener('fetch', event => {
  // 天気APIはネットワーク専用（キャッシュしない）
  if (event.request.url.includes('open-meteo.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 成功したらキャッシュを更新
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // オフライン時はキャッシュから返す
        return caches.match(event.request).then(cached => {
          return cached || caches.match('./index.html');
        });
      })
  );
});
