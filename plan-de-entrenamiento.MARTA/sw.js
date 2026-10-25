// Plan de Marta · funcionamiento sin conexión
// La página se pide primero a internet (para recibir siempre la última versión) y, si no hay conexión,
// se sirve la copia guardada. Iconos y tipografías se sirven desde la copia guardada.
const CACHE = 'plan-marta-v3';
const BASE = ['./', 'manifest.webmanifest?v=2', 'icon-192.png?v=2', 'icon-512.png?v=2', 'apple-touch-icon.png?v=2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // los envíos de avances no pasan por aquí
  const url = new URL(req.url);
  if (req.mode === 'navigate') {                           // la página: red primero
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put('./', copy)); return res;
    }).catch(() => caches.match('./')));
    return;
  }
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
