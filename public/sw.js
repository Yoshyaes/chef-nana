// Lead Studio admin service worker.
// Phase 0 scope: installability (home-screen icon, standalone launch) and the
// push/notification-click plumbing that Phase 3 (Web Push) will start sending
// real payloads to. No offline caching — the admin app is a live dashboard,
// not content that should ever be served stale.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', event => {
  if (!event.data) return
  let payload = {}
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Lead Studio', body: event.data.text() }
  }
  const { title = 'Lead Studio', body = '', url = '/admin/today' } = payload
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/admin-icons/icon-192.png',
      badge: '/admin-icons/icon-192.png',
      data: { url },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/admin/today'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
