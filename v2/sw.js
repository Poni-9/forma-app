/* FORMAI v2 se je preselil na https://formai.si/ — ta service worker se odstrani sam. */
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil((async () => {
  const ks = await caches.keys()
  await Promise.all(ks.filter(k => k.includes('/v2/')).map(k => caches.delete(k)))
  await self.registration.unregister()
  const cs = await self.clients.matchAll({ type: 'window' })
  for (const c of cs) { try { await c.navigate('/') } catch (_) {} }
})()))
