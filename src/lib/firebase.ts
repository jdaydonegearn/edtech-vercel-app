import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch, 
  addDoc, 
  query, 
  orderBy,
  where 
} from 'firebase/firestore';

// กำหนดค่า Firebase Config ของ edtechstock
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

// ตรวจสอบการ Initialize เพื่อป้องกันการสร้างซ้ำ
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, 'ai-studio-edtechequipmentb-88754315-f822-4cec-aa75-4edd33935c93');
export const googleProvider = new GoogleAuthProvider();

// กำหนดชื่อ Collections ใน Firestore
// เปลี่ยนชื่อ Collections ให้ตรงกับฐานข้อมูลจริงในรูปภาพ
// กำหนดชื่อ Collections ให้ตรงกับ Firestore 100%
export const EQUIPMENT_COLLECTION = 'equipment';
export const REQUESTS_COLLECTION = 'borrow_requests';
export const ARCHIVED_REQUESTS_COLLECTION = 'archived_borrow_requests';
export const MEMBERS_COLLECTION = 'organization_members';
export const ATTENDANCE_COLLECTION = 'attendance_records';
export const EVENTS_COLLECTION = 'edtech_events';

export const IS_FIREBASE_CONNECTED = true;

// ส่งออกฟังก์ชัน Firestore ให้หน้าอื่นดึงไปใช้งานได้ทันที
export {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  addDoc,
  query,
  orderBy,
  where
};