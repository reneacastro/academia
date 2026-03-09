const CACHE = 'academia-v1';
const FILES = [
  '/academia/',
  '/academia/index.html',
  '/academia/app.js',
  '/academia/data.js',
  '/academia/styles.css',
  '/academia/manifest.json',
  '/academia/icons/icon-192.png',
  '/academia/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
