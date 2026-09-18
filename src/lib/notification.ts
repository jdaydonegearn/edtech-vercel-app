// เล่นเสียงแจ้งเตือน
export const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (err) {
    console.warn('Audio notification error:', err);
  }
};

// ลงทะเบียน Service Worker และขอสิทธิ์รับการแจ้งเตือน
export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined') return;

  // 1. ลงทะเบียน Service Worker ในเบราว์เซอร์
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (err) {
      console.warn('ServiceWorker registration failed:', err);
    }
  }

  // 2. ขอสิทธิ์แสดง Notification
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }
};

// แสดงแจ้งเตือนบนมือถือและคอมพิวเตอร์
export const showSystemNotification = async (title: string, body: string) => {
  playNotificationSound();

  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const options: NotificationOptions = {
    body,
    icon: '/logo.png', // เปลี่ยนเป็นรูปโลโก้ของคุณ
    badge: '/logo.png',
    vibrate: [200, 100, 200], // สั่งให้มือถือสั่นเตือน
    tag: 'edtech-alert',
  } as any;

  try {
    // ส่งผ่าน Service Worker (บังคับสำหรับ Android และ iOS PWA)
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, options);
      return;
    }
  } catch (swErr) {
    console.warn('ServiceWorker showNotification failed, falling back:', swErr);
  }

  // Fallback สำหรับคอมพิวเตอร์ทั่วไป
  try {
    new Notification(title, options);
  } catch (err) {
    console.warn('Notification constructor error:', err);
  }
};