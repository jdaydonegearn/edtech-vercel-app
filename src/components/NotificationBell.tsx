import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Loader2 } from 'lucide-react';
import { registerPushNotification } from '../lib/fcm';
import { useBorrow } from '../context/BorrowContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const NotificationBell: React.FC = () => {
  const { authUser, role, isAdminLoggedIn } = useBorrow();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const currentUserIdentifier = authUser?.email || authUser?.uid;

  // ตรวจสอบว่า "บัญชีปัจจุบันที่กำลังล็อกอินอยู่" มีการลงทะเบียนรับแจ้งเตือนไว้ในระบบหรือยัง
  useEffect(() => {
    let isMounted = true;

    const checkSubscriptionForCurrentUser = async () => {
      if (!currentUserIdentifier) {
        if (isMounted) {
          setIsSubscribed(false);
          setChecking(false);
        }
        return;
      }

      try {
        setChecking(true);
        // ค้นหาว่ามี token ผูกกับ user นี้ในฐานข้อมูลหรือไม่
        const q = query(
          collection(db, 'edtech_fcm_tokens'),
          where('userIdentifier', '==', currentUserIdentifier)
        );
        const snap = await getDocs(q);

        if (isMounted) {
          // ต้องมีสิทธิ์ของเบราว์เซอร์ และ ต้องมีข้อมูลใน Firestore ของบัญชีนี้จริงๆ
          const hasBrowserPermission = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
          setIsSubscribed(!snap.empty && hasBrowserPermission);
        }
      } catch (err) {
        console.error('Error checking user push subscription:', err);
      } finally {
        if (isMounted) setChecking(false);
      }
    };

    checkSubscriptionForCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [currentUserIdentifier]);

  const handleSubscribe = async () => {
    if (!currentUserIdentifier) {
      alert('กรุณาเข้าสู่ระบบก่อนเปิดการแจ้งเตือน');
      return;
    }

    setLoading(true);
    const currentRole = (isAdminLoggedIn || role === 'admin') ? 'admin' : 'user';

    const token = await registerPushNotification(currentUserIdentifier, currentRole);
    if (token) {
      setIsSubscribed(true);
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="flex items-center gap-1.5 text-slate-400 text-xs px-3 py-1.5">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span className="text-[11px]">กำลังตรวจสอบ...</span>
      </div>
    );
  }

  if (isSubscribed) {
    return (
      <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold">
        <BellRing className="w-3.5 h-3.5 animate-bounce text-emerald-600" />
        <span>เปิดรับแจ้งเตือนแล้ว</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSubscribe}
      disabled={loading}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition active:scale-95 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
      <span>{loading ? 'กำลังเชื่อมต่อ...' : 'เปิดแจ้งเตือนบนมือถือ'}</span>
    </button>
  );
};