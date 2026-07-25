/* PEAKFORM service worker — network-first za HTML (vedno sveža verzija), cache fallback za offline */
const C='peakform-v1';
const CORE=['./forma-trener.html','./kalorije.html','./index.html','./zasebnost.html','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET' || u.origin!==location.origin) return;
  e.respondWith(
    fetch(e.request).then(r=>{ const cp=r.clone(); caches.open(C).then(c=>c.put(e.request,cp)); return r; })
      .catch(()=>caches.match(e.request).then(r=>r||caches.match('./forma-trener.html')))
  );
});
