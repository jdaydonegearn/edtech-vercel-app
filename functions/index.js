const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

const DATABASE_ID = 'ai-studio-edtechequipmentb-88754315-f822-4cec-aa75-4edd33935c93';
const db = getFirestore(DATABASE_ID);

// 1. ดักจับเมื่อมีคำขอยืมใหม่ -> ส่งแจ้งเตือนหา Admin ทุกเครื่อง
exports.sendNewRequestNotification = onDocumentCreated({
  document: 'edtech_requests/{requestId}',
  database: DATABASE_ID,
}, async (event) => {
  const snap = event.data;
  if (!snap) return null;
  const data = snap.data();

  const tokenDocs = await db
    .collection('edtech_fcm_tokens')
    .where('role', '==', 'admin')
    .get();

  const tokens = tokenDocs.docs
    .map(doc => doc.data().token)
    .filter(token => typeof token === 'string' && token.length > 0);

  if (tokens.length === 0) {
    console.log('No admin tokens registered');
    return null;
  }

  const payload = {
    tokens: tokens,
    notification: {
      title: '🔔 มีคำขอยืมอุปกรณ์ใหม่!',
      body: `คุณ ${data.studentName || 'นักเรียน'} ส่งคำขอยืมรหัส: ${data.tagCode || ''}`,
    }
  };

  try {
    const response = await getMessaging().sendEachForMulticast(payload);
    console.log(`Admin notification sent: ${response.successCount} successes`);
    return response;
  } catch (err) {
    console.error('Error sending multicast to admins:', err);
    return null;
  }
});

// 2. ดักจับเมื่อสถานะคำขอเปลี่ยน -> ส่งแจ้งเตือนหานักเรียนเจ้าของคำขอ
exports.sendStatusUpdateNotification = onDocumentUpdated({
  document: 'edtech_requests/{requestId}',
  database: DATABASE_ID,
}, async (event) => {
  const change = event.data;
  if (!change) return null;

  const before = change.before.data();
  const after = change.after.data();

  if (!before || !after || before.status === after.status) return null;

  const targetUserId = after.userId;
  if (!targetUserId) return null;

  const tokenDocs = await db
    .collection('edtech_fcm_tokens')
    .where('userId', '==', targetUserId)
    .get();

  const tokens = tokenDocs.docs
    .map(doc => doc.data().token)
    .filter(token => typeof token === 'string' && token.length > 0);

  if (tokens.length === 0) {
    console.log(`No device token found for user: ${targetUserId}`);
    return null;
  }

  let title = 'อัปเดตสถานะคำขอยืมอุปกรณ์';
  let body = `คำขอรหัส ${after.tagCode} เปลี่ยนเป็น ${after.status}`;

  if (after.status === 'approved') {
    title = '✅ คำขอยืมได้รับการอนุมัติแล้ว!';
    body = `รหัส ${after.tagCode} สามารถติดต่อรับอุปกรณ์ตามกำหนดการได้`;
  } else if (after.status === 'rejected') {
    title = '❌ คำขอยืมไม่ผ่านการอนุมัติ';
    body = `รหัส ${after.tagCode} เหตุผล: ${after.rejectionReason || 'อุปกรณ์ไม่พร้อมใช้งาน'}`;
  } else if (after.status === 'ready') {
    title = '📦 อุปกรณ์พร้อมรับแล้ว';
    body = `รหัส ${after.tagCode} ติดต่อรับอุปกรณ์ได้ที่ห้องปฏิบัติการ ED-TECH`;
  }

  const payload = {
    tokens: tokens,
    notification: { title, body }
  };

  try {
    const response = await getMessaging().sendEachForMulticast(payload);
    console.log(`User notification sent: ${response.successCount} successes`);
    return response;
  } catch (err) {
    console.error('Error sending status update notification:', err);
    return null;
  }
});