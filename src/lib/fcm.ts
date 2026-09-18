import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app, db, doc, setDoc } from './firebase';

// นำ VAPID Key ที่ได้จากขั้นตอนที่ 1 มาใส่ตรงนี้
const VAPID_KEY = 'BPs-vFUBoL88KhjYoiNOHHY2MyojGj-ocLM-GFm_PQF68W0CdX5ABsq6hGLCfBRg6PmPfU5Vc5-lEixq3ZHodtU';

export const registerPushNotification = async (userId: string, role: 'admin' | 'user') => {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('เบราว์เซอร์นี้ไม่รองรับ FCM Push Notification');
      return null;
    }

    // 1. ขอสิทธิ์เบราว์เซอร์
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    // 2. ดึง Service Worker Registration
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    // 3. ดึง Device Token จาก Google FCM
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      // 4. บันทึก Token ลง Firestore ในคอลเลกชัน edtech_fcm_tokens
      await setDoc(doc(db, 'edtech_fcm_tokens', token), {
        token,
        userId,
        role,
        updatedAt: new Date().toISOString(),
        device: navigator.userAgent,
      }, { merge: true });

      return token;
    }
  } catch (error) {
    console.error('FCM Token Registration Error:', error);
  }
  return null;
};