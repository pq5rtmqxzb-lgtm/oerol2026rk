/* OERALL service worker — offline app shell.
   Bump CACHE when you change files so clients refresh. */
var CACHE = "oerall-v1";
var ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/data.js",
  "./js/app.js",
  "./js/map.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon.svg",
  "./vendor/leaflet/leaflet.css",
  "./vendor/leaflet/leaflet.js",
  "./vendor/leaflet/images/marker-icon.png",
  "./vendor/leaflet/images/marker-icon-2x.png",
  "./vendor/leaflet/images/marker-shadow.png",
  "./vendor/leaflet/images/layers.png",
  "./vendor/leaflet/images/layers-2x.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // best-effort: don't fail install if one asset 404s
      return Promise.allSettled(ASSETS.map(function (u) { return c.add(u); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  // Map tiles & fonts: network-first, fall back to cache if available.
  var isTile = /tile\.openstreetmap\.org/.test(url.host) || /fonts\.(googleapis|gstatic)\.com/.test(url.host);
  if (isTile) {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () { return caches.match(req); })
    );
    return;
  }

  // App shell: cache-first.
  e.respondWith(
    caches.match(req).then(function (cached) {
      return cached || fetch(req).then(function (res) {
        if (url.origin === location.origin) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        if (req.mode === "navigate") return caches.match("./index.html");
      });
    })
  );
});
