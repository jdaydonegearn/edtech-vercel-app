import React, { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { registerPushNotification } from '../lib/fcm';
import { useBorrow } from '../context/BorrowContext';

export const NotificationBell: React.FC = () => {
  const { authUser, role, isAdminLoggedIn } = useBorrow();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSubscribed(Notification.permission === 'granted');
    }
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    const currentRole = (isAdminLoggedIn || role === 'admin') ? 'admin' : 'user';
    const userId = authUser?.uid || 'guest';

    const token = await registerPushNotification(userId, currentRole);
    if (token) {
      setIsSubscribed(true);
      alert('เปิดรับการแจ้งเตือนบนอุปกรณ์นี้เรียบร้อยแล้ว แม้ปิดจอก็จะได้รับแจ้งเตือน');
    }
    setLoading(false);
  };

  if (isSubscribed) {
    return (
      <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold">
        <BellRing className="w-3.5 h-3.5 animate-bounce" />
        <span>แจ้งเตือนเปิดอยู่</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSubscribe}
      disabled={loading}
      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
    >
      <Bell className="w-3.5 h-3.5" />
      <span>{loading ? 'กำลังเชื่อมต่อ...' : 'เปิดแจ้งเตือนบนมือถือ'}</span>
    </button>
  );
};