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

  // ดึงเฉพาะ Token ของบัญชีที่ถือสิทธิ์ admin
  const tokenDocs = await db.collection('edtech_fcm_tokens').where('role', '==', 'admin').get();
  const rawTokens = tokenDocs.docs
    .map(doc => doc.data().token)
    .filter(token => typeof token === 'string' && token.length > 0);

  // ตัด Token ซ้ำ
  const tokens = [...new Set(rawTokens)];
  if (tokens.length === 0) {
    console.log('No admin tokens registered.');
    return null;
  }

  const payload = {
    tokens: tokens,
    notification: {
      title: '🔔 มีคำขอยืมอุปกรณ์ใหม่!',
      body: `คุณ ${data.studentName || 'นักเรียน'} ยื่นคำขอ: ${data.tagCode || ''}`,
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        priority: 'max',
        channelId: 'default',
        visibility: 'public',
      },
    },
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
    webpush: {
      headers: {
        Urgency: 'high',
      },
    },
  };

  try {
    const res = await getMessaging().sendEachForMulticast(payload);
    console.log(`Successfully sent new request notification to ${res.successCount} admin devices.`);
    return res;
  } catch (err) {
    console.error('Admin Push error:', err);
    return null;
  }
});

// 2. แจ้งเตือนนักเรียนเมื่อสถานะคำขอเปลี่ยน (แยกตามบัญชีรายคน)
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

  // ตรวจสอบว่ามีการเปลี่ยน status หรือไม่
  if (!before || !after || before.status === after.status) return null;

  // ดึงค่าระบุตัวตนของผู้ใช้ (รองรับทั้ง userId, userIdentifier, studentEmail)
  const targetUser = after.userIdentifier || after.userId || after.studentEmail;
  if (!targetUser) {
    console.log(`No user target identifier found for request: ${event.params.requestId}`);
    return null;
  }

  // ค้นหา Token ที่ผูกกับบัญชีเป้าหมายนี้โดยเฉพาะ
  let tokenDocs = await db.collection('edtech_fcm_tokens')
    .where('userIdentifier', '==', targetUser)
    .get();

  // กรณีค้นหาด้วย userIdentifier ไม่พบ ให้ลองค้นหาด้วย userId
  if (tokenDocs.empty) {
    tokenDocs = await db.collection('edtech_fcm_tokens')
      .where('userId', '==', targetUser)
      .get();
  }

  const rawTokens = tokenDocs.docs
    .map(doc => doc.data().token)
    .filter(token => typeof token === 'string' && token.length > 0);

  // ตัด Token ซ้ำ
  const tokens = [...new Set(rawTokens)];
  if (tokens.length === 0) {
    console.log(`No tokens found for target user: ${targetUser}`);
    return null;
  }

  // กำหนดข้อความแจ้งเตือนตามสถานะ
  let title = '🔔 อัปเดตสถานะคำขอยืมอุปกรณ์';
  let body = `คำขอรหัส ${after.tagCode || ''} มีการเปลี่ยนสถานะเป็น: ${after.status}`;

  if (after.status === 'approved') {
    title = '✅ คำขอยืมได้รับการอนุมัติแล้ว!';
    body = `คำขอรหัส ${after.tagCode || ''} อนุมัติแล้ว ติดต่อรับอุปกรณ์ได้ที่ห้องโสตฯ`;
  } else if (after.status === 'rejected') {
    title = '❌ คำขอยืมไม่ผ่านการอนุมัติ';
    body = `คำขอรหัส ${after.tagCode || ''} ถูกปฏิเสธ: ${after.rejectReason || 'กรุณาติดต่อเจ้าหน้าที่'}`;
  } else if (after.status === 'returned') {
    title = '📦 คืนอุปกรณ์เรียบร้อยแล้ว';
    body = `คำขอรหัส ${after.tagCode || ''} ได้รับการตรวจสอบและคืนเข้าคลังแล้ว`;
  } else if (after.status === 'overdue') {
    title = '⚠️ แจ้งเตือน: อุปกรณ์เลยกำหนดส่งคืน!';
    body = `คำขอรหัส ${after.tagCode || ''} เลยกำหนดคืนแล้ว กรุณานำมาส่งคืนโดยเร็ว`;
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
    const res = await getMessaging().sendEachForMulticast(payload);
    console.log(`Successfully sent status update to ${res.successCount} devices for user ${targetUser}.`);
    return res;
  } catch (err) {
    console.error('User Push error:', err);
    return null;
  }
});