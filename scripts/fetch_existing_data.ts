import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getDatabase, ref, get } from 'firebase/database';

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

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const rtdb = getDatabase(app);

  console.log('--- Checking Firestore ---');
  try {
    const eqDocs = await getDocs(collection(db, 'equipment'));
    console.log(`Firestore equipment count: ${eqDocs.size}`);
    eqDocs.forEach(d => console.log('FS Eq:', d.id, d.data().name));

    const reqDocs = await getDocs(collection(db, 'borrow_requests'));
    console.log(`Firestore requests count: ${reqDocs.size}`);
    reqDocs.forEach(d => console.log('FS Req:', d.id, d.data().studentName, d.data().status));

    const archDocs = await getDocs(collection(db, 'archived_borrow_requests'));
    console.log(`Firestore archived requests count: ${archDocs.size}`);
    archDocs.forEach(d => console.log('FS Arch:', d.id, d.data().studentName));
  } catch (err: any) {
    console.error('Firestore check error:', err?.message || err);
  }

  console.log('--- Checking Realtime Database ---');
  try {
    const rtdbSnap = await get(ref(rtdb, '/'));
    if (rtdbSnap.exists()) {
      const val = rtdbSnap.val();
      console.log('RTDB Root keys:', Object.keys(val));
      if (val.equipment) console.log('RTDB Equipment count:', Object.keys(val.equipment).length);
      if (val.items) console.log('RTDB Items count:', Object.keys(val.items).length);
      if (val.borrow_requests) console.log('RTDB borrow_requests count:', Object.keys(val.borrow_requests).length);
      if (val.requests) console.log('RTDB requests count:', Object.keys(val.requests).length);
      if (val.archived_borrow_requests) console.log('RTDB archived_borrow_requests count:', Object.keys(val.archived_borrow_requests).length);
    } else {
      console.log('RTDB snapshot does not exist');
    }
  } catch (err: any) {
    console.error('RTDB check error:', err?.message || err);
  }

  process.exit(0);
}

main();
