importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBjYdCrPxxSmXe8RLs5e9NE2YXAJ0HYnpA",
  authDomain: "edtechstock.firebaseapp.com",
  databaseURL: "https://edtechstock-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "edtechstock",
  storageBucket: "edtechstock.firebasestorage.app",
  messagingSenderId: "46135125038",
  appId: "1:46135125038:web:8566f2905533c556b32bbf",
  measurementId: "G-1Z26QS7KS3"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// จัดการข้อความ Push Notification ที่ยิงมาตอนปิดแอปหรือล็อกหน้าจอ
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'ED-TECH แจ้งเตือน';
  const options = {
    body: payload.notification?.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    data: payload.data || {},
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});