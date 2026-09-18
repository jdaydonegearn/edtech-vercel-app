import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app, db, doc, setDoc } from './firebase';

// ⚠️ สำคัญมาก: นำ Key pair จาก Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates มาใส่ตรงนี้
const VAPID_KEY = 'BPs-vFUBoL88KhjYoiNOHHY2MyojGj-ocLM-GFm_PQF68W0CdX5ABsq6hGLCfBRg6PmPfU5Vc5-lEixq3ZHodtU';

export const registerPushNotification = async (userId: string, role: 'admin' | 'user') => {
  try {
    const supported = await isSupported();
    if (!supported) {
      alert('อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับ Push Notification');
      return null;
    }

    // 1. ขอสิทธิ์แจ้งเตือน
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert('คุณไม่ได้กดยินยอม (Allow) ให้ส่งการแจ้งเตือน');
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

    if (!token) {
      alert('ไม่สามารถสร้าง FCM Token ได้ กรุณาตรวจสอบ VAPID Key');
      return null;
    }

    console.log('FCM Token Generated:', token);

    // 4. บันทึก Token ลง Firestore (ใช้ db ที่ชี้ไป Database ID ที่ถูกต้อง)
    await setDoc(doc(db, 'edtech_fcm_tokens', token), {
      token: token,
      userId: userId || 'anonymous',
      role: role || 'user',
      updatedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
    }, { merge: true });

    alert('✅ ลงทะเบียนรับการแจ้งเตือนบนอุปกรณ์นี้สำเร็จ!');
    return token;
  } catch (error: any) {
    console.error('FCM Registration Error:', error);
    alert('เกิดข้อผิดพลาดในการลงทะเบียน: ' + (error?.message || error));
    return null;
  }
};