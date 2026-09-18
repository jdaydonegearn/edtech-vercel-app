import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  writeBatch,
  query, 
  orderBy,
  Firestore
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Connection toggle: Enabled with the edtechstock project
export const IS_FIREBASE_CONNECTED = true;

export const firebaseConfig = {
  apiKey: "AIzaSyBjYdCrPxxSmXe8RLs5e9NE2YXAJ0HYnpA",
  authDomain: "edtechstock.firebaseapp.com",
  projectId: "edtechstock",
  storageBucket: "edtechstock.firebasestorage.app",
  messagingSenderId: "46135125038",
  appId: "1:46135125038:web:8566f2905533c556b32bbf",
  measurementId: "G-1Z26QS7KS3"
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (IS_FIREBASE_CONNECTED) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    
    // Cloud Firestore instance (Connected to specific Firestore database)
    const databaseId = firebaseConfigJson.firestoreDatabaseId || 'ai-studio-edtechequipmentb-88754315-f822-4cec-aa75-4edd33935c93';
    db = getFirestore(app, databaseId);

    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (err) {
    console.warn('Firebase initialization error:', err);
  }
}

export { 
  app, 
  db, 
  auth, 
  googleProvider,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  query,
  orderBy
};

export const EQUIPMENT_COLLECTION = 'equipment';
export const REQUESTS_COLLECTION = 'borrow_requests';
export const ARCHIVED_REQUESTS_COLLECTION = 'archived_borrow_requests';
export const MEMBERS_COLLECTION = 'organization_members';
export const ATTENDANCE_COLLECTION = 'attendance_records';


