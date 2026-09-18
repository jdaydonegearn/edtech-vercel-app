 publicsw.js - จัดการการแจ้งเตือนบนมือถือ
self.addEventListener('install', (event) = {
  self.skipWaiting();
});

self.addEventListener('activate', (event) = {
  event.waitUntil(clients.claim());
});

 เมื่อผู้ใช้แตะที่แถบแจ้งเตือนบนมือถือ ให้เปิดหรือสลับมาที่หน้าเว็บทันที
self.addEventListener('notificationclick', (event) = {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type 'window', includeUncontrolled true }).then((clientList) = {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('');
    })
  );
});