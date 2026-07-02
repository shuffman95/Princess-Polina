// Princess Polina — service worker: cache-first offline support.
const CACHE = 'polina-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  './js/main.js',
  './js/const.js',
  './js/util.js',
  './js/engine.js',
  './js/input.js',
  './js/audio.js',
  './js/music.js',
  './js/sfx.js',
  './js/i18n.js',
  './js/save.js',
  './js/font.js',
  './js/sprites.js',
  './js/tiles.js',
  './js/backgrounds.js',
  './js/particles.js',
  './js/camera.js',
  './js/player.js',
  './js/entities.js',
  './js/enemies.js',
  './js/bosses.js',
  './js/levels.js',
  './js/leveldata.js',
  './js/game.js',
  './js/worldmap.js',
  './js/ui.js',
  './js/menus.js',
  './js/cheats.js',
  './js/story.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
