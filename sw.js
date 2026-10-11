// 山菜採り手帳 Service Worker
// 常にネットワークの最新版を先に取りに行き、通信できないときだけ保存済みのものを使う。
// （以前のように、更新のたびにキャッシュ名の数字を上げる必要はありません）
const CACHE = "sansai-techo-runtime";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 外部サイト（Wikipediaなど）はそのまま通す

  event.respondWith(
    fetch(req, { cache: "no-cache" })
      .then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => {
          if (hit) return hit;
          if (req.mode === "navigate") return caches.match("./index.html").then((r) => r || caches.match("./"));
          return undefined;
        })
      )
  );
});
