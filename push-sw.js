/* (2. 11. 2026) FORMAI — opomnik za trening: obvestilo s strežnika (Web Push) in odprtje aplikacije ob tapu. */
self.addEventListener('push', function (e) {
  var d = {}
  try { d = e.data ? e.data.json() : {} } catch (_) { d = { title: 'FORMAI', body: e.data ? e.data.text() : '' } }
  var title = d.title || 'FORMAI'
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || '', tag: d.tag || 'trening', renotify: false,
    icon: 'icons/icon-192-v2.png', badge: 'icons/icon-192-v2.png', data: { url: d.url || '#/danes' },
  }))
})
self.addEventListener('notificationclick', function (e) {
  e.notification.close()
  var url = new URL((e.notification.data && e.notification.data.url) || '#/danes', self.registration.scope).href
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) { var c = list[i]; if ('focus' in c) { c.navigate && c.navigate(url).catch(function () {}); return c.focus() } }
    return self.clients.openWindow ? self.clients.openWindow(url) : null
  }))
})
