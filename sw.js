/* FORMAI service worker
   HTML: vedno s strežnika, mimo HTTP predpomnilnika brskalnika (cache:'reload').
         Predpomnilnik je samo rezerva, ko ni omrežja.
   Ostalo (ikone, slike): najprej predpomnilnik, v ozadju osveži.
   Ob vsaki objavi povečaj V — stari predpomnilniki se ob aktivaciji pobrišejo. */
const V = '2026-07-30';
const C = 'formai-' + V;
const CORE = ['./forma-trener.html','./kalorije.html','./index.html',
              './zasebnost.html','./pogoji.html','./icon-192.png','./icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(C)
      .then(c => Promise.all(CORE.map(u =>
        fetch(new Request(u, {cache:'reload'})).then(r => r.ok && c.put(u, r)).catch(()=>{})
      )))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;

  const jeHtml = e.request.mode === 'navigate' || u.pathname.endsWith('.html') ||
                 u.pathname.endsWith('/') || u.pathname.endsWith('.json');

  if (jeHtml) {
    // vedno sveže: obidi HTTP predpomnilnik, sicer GitHub Pages max-age vrne staro
    e.respondWith(
      fetch(new Request(e.request, {cache:'reload'}))
        .then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; })
        .catch(() => caches.match(e.request).then(r => r || caches.match('./forma-trener.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request)
        .then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; })
        .catch(() => hit);
      return hit || net;
    })
  );
});

// omogoči strani, da takoj prevzame novo različico
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
