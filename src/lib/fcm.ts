import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app, db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

// Web Push VAPID Key ที่ระบุ
const VAPID_KEY = 'BPs-vFUBoL88KhjYoiNOHHY2MyojGj-ocLM-GFm_PQF68W0CdX5ABsq6hGLCfBRg6PmPfU5Vc5-lEixq3ZHodtU';

export const registerPushNotification = async (userIdentifier: string, role: 'admin' | 'user') => {
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

    // 3. ขอรับ FCM Device Token
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      alert('ไม่สามารถสร้าง FCM Token ได้ กรุณาตรวจสอบการตั้งค่าเครือข่าย');
      return null;
    }

    // 4. สร้าง Document ID ที่ระบุตัวตนแยกตามบัญชีผู้ใช้และอุปกรณ์
    const cleanDocId = `${encodeURIComponent(userIdentifier)}_${token.slice(-15)}`;

    // 5. บันทึกลง Firestore คอลเลกชัน edtech_fcm_tokens
    await setDoc(doc(db, 'edtech_fcm_tokens', cleanDocId), {
      token: token,
      userIdentifier: userIdentifier,
      userId: userIdentifier,
      role: role,
      updatedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
    }, { merge: true });

    alert('✅ ลงทะเบียนรับการแจ้งเตือนสำหรับบัญชีนี้สำเร็จ!');
    return token;
  } catch (error: any) {
    console.error('FCM Registration Error:', error);
    alert('เกิดข้อผิดพลาดในการลงทะเบียน: ' + (error?.message || error));
    return null;
  }
};