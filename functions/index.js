const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

const DATABASE_ID = 'ai-studio-edtechequipmentb-88754315-f822-4cec-aa75-4edd33935c93';
const db = getFirestore(DATABASE_ID);

// 1. แจ้งเตือนแอดมินเมื่อมีคำขอใหม่
exports.sendNewRequestNotification = onDocumentCreated({
  document: 'borrow_requests/{requestId}',
  database: DATABASE_ID,
  region: 'asia-southeast1',
  timeoutSeconds: 60,
}, async (event) => {
  const snap = event.data;
  if (!snap) return null;
  const data = snap.data();

  const tokenDocs = await db.collection('edtech_fcm_tokens').where('role', '==', 'admin').get();
  const rawTokens = tokenDocs.docs
    .map(doc => doc.data().token)
    .filter(token => typeof token === 'string' && token.length > 0);

  // ตัด Token ที่ซ้ำกันทิ้ง ให้เหลือค่าเดียว
  const tokens = [...new Set(rawTokens)];
  if (tokens.length === 0) return null;

  const payload = {
    tokens: tokens,
    notification: {
      title: '🔔 มีคำขอยืมอุปกรณ์ใหม่!',
      body: `คุณ ${data.studentName || 'นักเรียน'} ยื่นคำขอ: ${data.tagCode || ''}`,
    },
    // บังคับให้ Android ปลุกเครื่องทันที ไม่ต้องรอรอบประหยัดพลังงาน
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        priority: 'max',
        channelId: 'default',
        visibility: 'public',
      },
    },
    // บังคับให้ iOS (Web App) เด้งแทรกคิวทันที (Priority 10)
    apns: {
      headers: {
        'apns-priority': '10',
        'apns-push-type': 'alert',
      },
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
    // กำหนดให้ Web Push แสดงผลทันที
    webpush: {
      headers: {
        Urgency: 'high',
      },
    },
  };

  try {
    return await getMessaging().sendEachForMulticast(payload);
  } catch (err) {
    console.error('Push error:', err);
    return null;
  }
});

// 2. แจ้งเตือนนักเรียนเมื่อสถานะคำขอเปลี่ยน
exports.sendStatusUpdateNotification = onDocumentUpdated({
  document: 'borrow_requests/{requestId}',
  database: DATABASE_ID,
  region: 'asia-southeast1',
  timeoutSeconds: 60,
}, async (event) => {
  const change = event.data;
  if (!change) return null;
  const before = change.before.data();
  const after = change.after.data();

  if (!before || !after || before.status === after.status) return null;
  if (!after.userId) return null;

  const tokenDocs = await db.collection('edtech_fcm_tokens').where('userId', '==', after.userId).get();
  const rawTokens = tokenDocs.docs
    .map(doc => doc.data().token)
    .filter(token => typeof token === 'string' && token.length > 0);

  // ตัด Token ที่ซ้ำกันทิ้ง ให้เหลือค่าเดียว
  const tokens = [...new Set(rawTokens)];
  if (tokens.length === 0) return null;

  let title = 'อัปเดตสถานะคำขอยืม';
  let body = `คำขอรหัส ${after.tagCode} มีการเปลี่ยนแปลง`;
  if (after.status === 'approved') {
    title = '✅ อนุมัติคำขอยืมแล้ว!';
    body = `คำขอรหัส ${after.tagCode} ได้รับการอนุมัติแล้ว`;
  } else if (after.status === 'rejected') {
    title = '❌ ไม่อนุมัติคำขอยืม';
    body = `คำขอรหัส ${after.tagCode} ไม่ผ่านการอนุมัติ`;
  }

  const payload = {
    tokens: tokens,
    notification: { title, body },
    android: {
      priority: 'high',
      notification: { sound: 'default', priority: 'max' },
    },
    apns: {
      headers: { 'apns-priority': '10' },
      payload: { aps: { sound: 'default' } },
    },
    webpush: {
      headers: { Urgency: 'high' },
    },
  };

  try {
    return await getMessaging().sendEachForMulticast(payload);
  } catch (err) {
    console.error('Push error:', err);
    return null;
  }
});