import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  EquipmentItem, 
  BorrowRequest, 
  CartItem, 
  Announcement, 
  UserRole, 
  BorrowRequestStatus, 
  EquipmentCategory,
  Member,
  AttendanceRecord,
  AttendanceStatus
} from '../types';
import { 
  db, 
  auth, 
  googleProvider, 
  EQUIPMENT_COLLECTION, 
  REQUESTS_COLLECTION, 
  ARCHIVED_REQUESTS_COLLECTION,
  MEMBERS_COLLECTION,
  ATTENDANCE_COLLECTION,
  IS_FIREBASE_CONNECTED,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  addDoc,
  query,
  orderBy
} from '../lib/firebase';
import { where } from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore) as unknown as T;
  }
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        clean[key] = sanitizeForFirestore(value);
      }
    }
    return clean as T;
  }
  return obj;
}

export interface UserProfile {
  username: string;
  studentId: string;
  phone: string;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

interface BorrowContextType {
  equipment: EquipmentItem[];
  borrowRequests: BorrowRequest[];
  archivedRequests: BorrowRequest[];
  myBorrowRequests: BorrowRequest[];
  members: Member[];
  attendanceRecords: AttendanceRecord[];
  cart: CartItem[];
  announcements: Announcement[];
  role: UserRole;
  activeTab: string;
  isCartOpen: boolean;
  selectedDate: string;
  periodFilter: { startDate: string; endDate: string };
  searchQuery: string;
  selectedCategory: EquipmentCategory | 'ทั้งหมด';

  isFirebaseConnected: boolean;
  authUser: User | AppUser | null;
  authLoading: boolean;
  domainErrorMsg: string | null;
  setDomainErrorMsg: (msg: string | null) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithSchoolEmail: (email: string, name?: string) => { success: boolean; message: string };
  logout: () => Promise<void>;

  currentUser: UserProfile | null;
  setCurrentUser: (profile: UserProfile) => void;
  isAdminLoggedIn: boolean;
  adminLogin: (usernameOrPassword: string, password?: string) => { success: boolean; message: string };
  adminLogout: () => void;
  showUserRegisterModal: boolean;
  setShowUserRegisterModal: (show: boolean) => void;
  showAdminLoginModal: boolean;
  setShowAdminLoginModal: (show: boolean) => void;
  showRestoreHistoryModal: boolean;
  setShowRestoreHistoryModal: (show: boolean) => void;

  setRole: (role: UserRole) => void;
  toggleRole: () => void;
  setActiveTab: (tab: string) => void;
  setIsCartOpen: (isOpen: boolean) => void;
  setSelectedDate: (date: string) => void;
  setPeriodFilter: (filter: { startDate: string; endDate: string }) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (cat: EquipmentCategory | 'ทั้งหมด') => void;

  addToCart: (equipmentId: string, quantity?: number) => void;
  removeFromCart: (equipmentId: string) => void;
  updateCartQuantity: (equipmentId: string, quantity: number) => void;
  clearCart: () => void;

  submitBorrowRequest: (data: {
    studentName: string;
    studentId: string;
    phone: string;
    purpose: string;
    startDate: string;
    endDate: string;
    pickupTime: string;
  }) => { success: boolean; message: string; tagCode?: string };

  cancelBorrowRequest: (requestId: string) => void;
  deleteBorrowRequest: (requestId: string) => Promise<void>;
  updateRequestStatus: (
    requestId: string, 
    newStatus: BorrowRequestStatus, 
    adminNote?: string, 
    rejectionReason?: string
  ) => void;

  addMember: (member: Omit<Member, 'id' | 'addedAt'>) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  reportAttendance: (status: 'present' | 'absent', note?: string) => Promise<void>;
  getMemberByStudentId: (studentId: string) => Member | undefined;
  getAttendanceForDate: (date: string) => AttendanceRecord[];

  addEquipmentItem: (item: Omit<EquipmentItem, 'id'>) => void;
  updateEquipmentItem: (item: EquipmentItem) => void;
  deleteEquipmentItem: (id: string) => Promise<void>;
  clearAllEquipment: () => void;
  
  realtimeNotice: string | null;
  refreshData: () => Promise<{ success: boolean; count: number; reqCount: number; error?: string }>;
  resetToDefaults: () => void;
  clearAllBorrowHistory: (targetScope?: 'all' | 'mine') => Promise<void>;
  restoreBorrowHistory: (fromDate?: string, selectedIds?: string[]) => Promise<{ success: boolean; count: number; message: string }>;
  loginAsDemoStudent: (name?: string, studentId?: string) => void;
  loginAsDemoAdmin: () => void;
}

const BorrowContext = createContext<BorrowContextType | undefined>(undefined);

const STORAGE_KEYS = {
  EQUIPMENT: 'dcd_equipment_v1',
  REQUESTS: 'dcd_requests_v1',
  ARCHIVED_REQUESTS: 'dcd_archived_requests_v1',
  CART: 'dcd_cart_v1',
  ANNOUNCEMENTS: 'dcd_announcements_v1',
  ROLE: 'dcd_role_v1',
  USER_PROFILE: 'dcd_user_profile_v1',
  ADMIN_LOGGED_IN: 'dcd_admin_logged_in_v1',
};

const SYNC_CHANNEL_NAME = 'edtech_borrow_realtime_sync_v2';

export const ADMIN_EMAILS: string[] = [
  '43524@visut.ac.th',
  'kachanon@visut.ac.th',
  'gudonegearn@gmail.com',
];

export const isAuthorizedAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
};

export const isAllowedSchoolEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  return lower.endsWith('@visut.ac.th') || lower === 'gudonegearn@gmail.com';
};

const CATEGORY_ORDER: Record<string, number> = {
  'กล้อง': 1,
  'เลนส์': 2,
  'อุปกรณ์เสริมกล้อง': 3,
  'กิมบอล': 4,
  'โดรน': 5,
  'เสียง': 6,
  'ไฟ': 7,
  'อุปกรณ์เสริมไฟ': 8,
  'ขาตั้ง': 9,
  'อื่นๆ': 10,
};

const calculateSynchronizedEquipment = (
  rawEquipment: EquipmentItem[],
  activeRequests: BorrowRequest[]
): EquipmentItem[] => {
  const activeStatuses: BorrowRequestStatus[] = ['pending', 'approved', 'ready', 'borrowed'];
  const reservedCounts: Record<string, number> = {};

  activeRequests.forEach((req) => {
    if (!req.isArchived && activeStatuses.includes(req.status)) {
      req.items.forEach((item) => {
        reservedCounts[item.equipmentId] = (reservedCounts[item.equipmentId] || 0) + (item.quantity || 1);
      });
    }
  });

  const synced = rawEquipment.map((eq) => {
    if (eq.status === 'broken' || eq.status === 'maintenance') {
      return { ...eq, availableQuantity: 0 };
    }
    const reserved = reservedCounts[eq.id] || 0;
    const computedAvailable = Math.max(0, eq.totalQuantity - reserved);
    return {
      ...eq,
      availableQuantity: computedAvailable,
      status: eq.status,
    };
  });

  synced.sort((a, b) => {
    const catA = CATEGORY_ORDER[a.category] || 99;
    const catB = CATEGORY_ORDER[b.category] || 99;
    if (catA !== catB) return catA - catB;
    return (a.name || '').localeCompare(b.name || '', 'th');
  });

  return synced;
};

const broadcastSync = (eq?: EquipmentItem[], reqs?: BorrowRequest[]) => {
  try {
    const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
    bc.postMessage({
      equipment: eq,
      borrowRequests: reqs,
      timestamp: Date.now(),
    });
    bc.close();
  } catch (err) {
    console.error('BroadcastChannel sync error:', err);
  }

  try {
    window.dispatchEvent(
      new CustomEvent('app-realtime-sync', {
        detail: { equipment: eq, borrowRequests: reqs },
      })
    );
  } catch (err) {
    console.error('CustomEvent dispatch error:', err);
  }
};

export const BorrowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    try {
      const savedEq = localStorage.getItem(STORAGE_KEYS.EQUIPMENT);
      if (savedEq && savedEq.includes('eq-nikon-01')) {
        localStorage.removeItem(STORAGE_KEYS.EQUIPMENT);
      }
      const savedReq = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      if (savedReq && savedReq.includes('DCD-U-3FII')) {
        localStorage.removeItem(STORAGE_KEYS.REQUESTS);
      }
      const savedArch = localStorage.getItem(STORAGE_KEYS.ARCHIVED_REQUESTS);
      if (savedArch && savedArch.includes('req-old-01')) {
        localStorage.removeItem(STORAGE_KEYS.ARCHIVED_REQUESTS);
      }
    } catch {}
  }, []);

  const [equipment, setEquipment] = useState<EquipmentItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EQUIPMENT);
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && !saved.includes('eq-nikon-01')) {
          return parsed;
        }
      } catch (err) {
        console.error('LocalStorage parse error:', err);
      }
    }
    return [];
  });

  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && !saved.includes('DCD-U-3FII')) {
          return parsed;
        }
      } catch (err) {
        console.error('LocalStorage parse error:', err);
      }
    }
    return [];
  });

  const [archivedRequests, setArchivedRequests] = useState<BorrowRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ARCHIVED_REQUESTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && !saved.includes('req-old-01')) return parsed;
      } catch (err) {
        console.error('LocalStorage parse error:', err);
      }
    }
    return [];
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CART);
    return saved ? JSON.parse(saved) : [];
  });

  const [announcements] = useState<Announcement[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE);
    return (saved as UserRole) || 'user';
  });

  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return saved ? JSON.parse(saved) : null;
  });

  const [showUserRegisterModal, setShowUserRegisterModal] = useState<boolean>(false);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_LOGGED_IN) === 'true';
  });

  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);
  const [showRestoreHistoryModal, setShowRestoreHistoryModal] = useState<boolean>(false);

  const [authUser, setAuthUser] = useState<User | AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [domainErrorMsg, setDomainErrorMsg] = useState<string | null>(null);

  const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);

  const triggerRealtimeNotice = (msg: string) => {
    setRealtimeNotice(msg);
    setTimeout(() => {
      setRealtimeNotice(null);
    }, 4000);
  };

  useEffect(() => {
    if (!IS_FIREBASE_CONNECTED || !auth) {
      const savedRole = localStorage.getItem(STORAGE_KEYS.ROLE);
      const savedAdmin = localStorage.getItem(STORAGE_KEYS.ADMIN_LOGGED_IN) === 'true';
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (savedUser) {
        try {
          const u = JSON.parse(savedUser);
          const email = u.studentId ? `${u.studentId}@visut.ac.th` : 'user@visut.ac.th';
          setAuthUser({
            uid: 'local-' + (u.studentId || 'user'),
            displayName: u.username || 'ผู้ใช้งาน',
            email: email,
            photoURL: null,
          });
        } catch {}
      }
      setIsAdminLoggedIn(savedAdmin);
      setRoleState(savedRole === 'admin' ? 'admin' : 'user');
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = (firebaseUser.email || '').toLowerCase();
        
        if (!isAllowedSchoolEmail(email)) {
          setDomainErrorMsg('ระบบนี้อนุญาตเฉพาะอีเมลโรงเรียน (@visut.ac.th) หรืออีเมลผู้ดูแลระบบ');
          triggerRealtimeNotice('⚠️ ระบบนี้อนุญาตเฉพาะอีเมลโรงเรียน (@visut.ac.th)');
          if (auth) await signOut(auth);
          setAuthUser(null);
          setIsAdminLoggedIn(false);
          setRoleState('user');
          localStorage.setItem(STORAGE_KEYS.ADMIN_LOGGED_IN, 'false');
          localStorage.setItem(STORAGE_KEYS.ROLE, 'user');
        } else {
          setAuthUser(firebaseUser);
          setDomainErrorMsg(null);

          if (isAuthorizedAdminEmail(email)) {
            setIsAdminLoggedIn(true);
            setRoleState('admin');
            localStorage.setItem(STORAGE_KEYS.ADMIN_LOGGED_IN, 'true');
            localStorage.setItem(STORAGE_KEYS.ROLE, 'admin');
          } else {
            setIsAdminLoggedIn(false);
            setRoleState('user');
            localStorage.setItem(STORAGE_KEYS.ADMIN_LOGGED_IN, 'false');
            localStorage.setItem(STORAGE_KEYS.ROLE, 'user');
          }

          const localPart = email.split('@')[0];
          setCurrentUserState((prev) => {
            const updatedProfile = {
              username: firebaseUser.displayName || localPart,
              studentId: prev?.studentId || localPart,
              phone: prev?.phone || '',
            };
            localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
            return updatedProfile;
          });
        }
      } else {
        setAuthUser(null);
        setIsAdminLoggedIn(false);
        setRoleState('user');
        localStorage.setItem(STORAGE_KEYS.ADMIN_LOGGED_IN, 'false');
        localStorage.setItem(STORAGE_KEYS.ROLE, 'user');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithSchoolEmail = (emailInput: string, nameInput?: string) => {
    const email = emailInput.trim().toLowerCase();
    if (!email) {
      return { success: false, message: 'กรุณากรอกอีเมลโรงเรียน (@visut.ac.th)' };
    }
    if (!isAllowedSchoolEmail(email)) {
      setDomainErrorMsg('ระบบนี้อนุญาตเฉพาะอีเมลโรงเรียน (@visut.ac.th) หรืออีเมลผู้ดูแลระบบ');
      return { success: false, message: 'เฉพาะอีเมล @visut.ac.th เท่านั้น' };
    }

    const localPart = email.split('@')[0];
    const displayName = nameInput?.trim() || localPart;
    const localUser: AppUser = {
      uid: `local-${localPart}`,
      email: email,
      displayName: displayName,
      photoURL: null,
    };

    setAuthUser(localUser);
    setDomainErrorMsg(null);

    const isAdmin = isAuthorizedAdminEmail(email);
    setIsAdminLoggedIn(isAdmin);
    setRoleState(isAdmin ? 'admin' : 'user');
    localStorage.setItem(STORAGE_KEYS.ADMIN_LOGGED_IN, isAdmin ? 'true' : 'false');
    localStorage.setItem(STORAGE_KEYS.ROLE, isAdmin ? 'admin' : 'user');

    const updatedProfile: UserProfile = {
      username: displayName,
      studentId: localPart,
      phone: currentUser?.phone || '',
    };
    setCurrentUserState(updatedProfile);
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));

    triggerRealtimeNotice(`✅ เข้าสู่ระบบสำเร็จ (${displayName})`);
    return { success: true, message: 'เข้าสู่ระบบสำเร็จ' };
  };

  const loginAsDemoStudent = (name = 'นักเรียน (ทั่วไป)', studentId = '45102') => {
    const email = `${studentId}@visut.ac.th`;
    const localUser: AppUser = {
      uid: `local-${studentId}`,
      email: email,
      displayName: name,
      photoURL: null,
    };
    setAuthUser(localUser);
    const profile: UserProfile = {
      username: name,
      studentId: studentId,
      phone: '089-876-5432',
    };
    setCurrentUserState(profile);
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    setRoleState('user');
    setIsAdminLoggedIn(false);
    localStorage.setItem(STORAGE_KEYS.ADMIN_LOGGED_IN, 'false');
    localStorage.setItem(STORAGE_KEYS.ROLE, 'user');
    setDomainErrorMsg(null);
    triggerRealtimeNotice(`✅ เข้าใช้งานในฐานะนักเรียน (${name})`);
  };

  const loginAsDemoAdmin = () => {
    const localUser: AppUser = {
      uid: 'local-43524',
      email: '43524@visut.ac.th',
      displayName: 'ครูนนท์ (Krunon)',
      photoURL: null,
    };
    setAuthUser(localUser);
    const profile: UserProfile = {
      username: 'ครูนนท์ (Krunon)',
      studentId: '43524',
      phone: '081-234-5678',
    };
    setCurrentUserState(profile);
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    setIsAdminLoggedIn(true);
    setRoleState('admin');
    localStorage.setItem(STORAGE_KEYS.ADMIN_LOGGED_IN, 'true');
    localStorage.setItem(STORAGE_KEYS.ROLE, 'admin');
    setDomainErrorMsg(null);
    triggerRealtimeNotice('✅ เข้าสู่ระบบแอดมิน (Krunon) เรียบร้อยแล้ว');
  };

  const loginWithGoogle = async () => {
    if (!IS_FIREBASE_CONNECTED || !auth) {
      triggerRealtimeNotice('ℹ️ ระบบอยู่ในโหมด Local (ตัดการเชื่อมต่อ Firebase แล้ว)');
      return;
    }
    try {
      setAuthLoading(true);
      setDomainErrorMsg(null);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const email = (user.email || '').toLowerCase();

      if (!isAllowedSchoolEmail(email)) {
        setDomainErrorMsg('ระบบนี้อนุญาตเฉพาะอีเมลโรงเรียน (@visut.ac.th) หรืออีเมลผู้ดูแลระบบ');
        triggerRealtimeNotice('⚠️ ระบบนี้อนุญาตเฉพาะอีเมลโรงเรียน (@visut.ac.th)');
        await signOut(auth);
        setAuthUser(null);
        setIsAdminLoggedIn(false);
        setRoleState('user');
        return;
      }

      setAuthUser(user);
      if (isAuthorizedAdminEmail(email)) {
        setIsAdminLoggedIn(true);
        setRoleState('admin');
        triggerRealtimeNotice(`✅ เข้าสู่ระบบแอดมิน (${email}) เรียบร้อยแล้ว`);
      } else {
        setIsAdminLoggedIn(false);
        setRoleState('user');
        triggerRealtimeNotice(`✅ เข้าสู่ระบบสำเร็จ (${user.displayName || email})`);
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        triggerRealtimeNotice(`❌ ไม่สามารถเข้าสู่ระบบได้: ${err.message || 'เกิดข้อผิดพลาด'}`);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (IS_FIREBASE_CONNECTED && auth) {
        await signOut(auth);
      }
      setAuthUser(null);
      setIsAdminLoggedIn(false);
      setRoleState('user');
      localStorage.setItem(STORAGE_KEYS.ADMIN_LOGGED_IN, 'false');
      localStorage.setItem(STORAGE_KEYS.ROLE, 'user');
      setActiveTab('catalog');
      triggerRealtimeNotice('👋 ออกจากระบบเรียบร้อยแล้ว');
    } catch (err) {
      console.error('Logout Error:', err);
    }
  };

  useEffect(() => {
    let isInitialSync = true;
    let latestRawEquipment: EquipmentItem[] = [];
    let latestRequests: BorrowRequest[] = [];

    const syncAndPublish = (
      rawEq: EquipmentItem[],
      reqs: BorrowRequest[],
      source: 'equipment' | 'requests'
    ) => {
      const baseRawEq = rawEq || [];
      const baseReqs = (reqs || []).filter((r) => !r.isArchived);

      const synchronizedEquipment = calculateSynchronizedEquipment(baseRawEq, baseReqs);
      setEquipment(synchronizedEquipment);
      setBorrowRequests(baseReqs);

      localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(synchronizedEquipment));
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(baseReqs));
      broadcastSync(synchronizedEquipment, baseReqs);

      if (!isInitialSync) {
        if (source === 'requests') {
          triggerRealtimeNotice('⚡ อัปเดตคำขอยืมและจำนวนคงเหลือแบบเรียลไทม์แล้ว');
        } else {
          triggerRealtimeNotice('⚡ ซิงค์ข้อมูลคลังอุปกรณ์จากฐานข้อมูลเรียลไทม์แล้ว');
        }
      }
    };

    let unsubEquipment = () => {};
    let unsubRequests = () => {};
    let unsubArchived = () => {};

    if (IS_FIREBASE_CONNECTED && db) {
      unsubEquipment = onSnapshot(
        collection(db, EQUIPMENT_COLLECTION),
        (snapshot) => {
          const firestoreItems: EquipmentItem[] = [];
          snapshot.forEach((docSnap) => {
            const item = { id: docSnap.id, ...docSnap.data() } as EquipmentItem;
            firestoreItems.push(item);
          });

          latestRawEquipment = firestoreItems;
          syncAndPublish(firestoreItems, latestRequests, 'equipment');
          isInitialSync = false;
        },
        (err) => {
          console.warn('Firestore Equipment Sync Notice:', err?.message || err);
        }
      );

      unsubRequests = onSnapshot(
        collection(db, REQUESTS_COLLECTION),
        (snapshot) => {
          const firestoreReqs: BorrowRequest[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as BorrowRequest;
            if (!data.isArchived) {
              firestoreReqs.push({ id: docSnap.id, ...data });
            }
          });

          firestoreReqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          latestRequests = firestoreReqs;
          syncAndPublish(latestRawEquipment, firestoreReqs, 'requests');
          isInitialSync = false;
        },
        (err) => {
          console.warn('Firestore Requests Sync Notice:', err?.message || err);
        }
      );

      unsubArchived = onSnapshot(
        collection(db, ARCHIVED_REQUESTS_COLLECTION),
        (snapshot) => {
          const archivedList: BorrowRequest[] = [];
          snapshot.forEach((docSnap) => {
            archivedList.push({ id: docSnap.id, ...docSnap.data() } as BorrowRequest);
          });
          archivedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setArchivedRequests(archivedList);
          localStorage.setItem(STORAGE_KEYS.ARCHIVED_REQUESTS, JSON.stringify(archivedList));
        },
        (err) => {
          console.warn('Firestore Archived Sync Notice:', err?.message || err);
        }
      );
    }

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
      bc.onmessage = (event) => {
        if (event.data) {
          if (event.data.equipment) setEquipment(event.data.equipment);
          if (event.data.borrowRequests) setBorrowRequests(event.data.borrowRequests);
          if (event.data.archivedRequests) setArchivedRequests(event.data.archivedRequests);
        }
      };
    } catch (err) {
      console.error(err);
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.EQUIPMENT && e.newValue) {
        try { setEquipment(JSON.parse(e.newValue)); } catch (err) { console.error(err); }
      }
      if (e.key === STORAGE_KEYS.REQUESTS && e.newValue) {
        try { setBorrowRequests(JSON.parse(e.newValue)); } catch (err) { console.error(err); }
      }
      if (e.key === STORAGE_KEYS.ARCHIVED_REQUESTS && e.newValue) {
        try { setArchivedRequests(JSON.parse(e.newValue)); } catch (err) { console.error(err); }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubEquipment();
      unsubRequests();
      unsubArchived();
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [authUser?.uid]);

  useEffect(() => {
    if (!IS_FIREBASE_CONNECTED || !db) return;

    const unsubMembers = onSnapshot(collection(db, MEMBERS_COLLECTION), (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      setMembers(membersData);
    });

    const unsubAttendance = onSnapshot(collection(db, ATTENDANCE_COLLECTION), (snapshot) => {
      const attendanceData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      setAttendanceRecords(attendanceData);
    });

    return () => {
      unsubMembers();
      unsubAttendance();
    };
  }, []);

  useEffect(() => {
    setCart((prevCart) => {
      let changed = false;
      const updatedCart = prevCart
        .map((item) => {
          const currentEq = equipment.find((eq) => eq.id === item.equipmentId);
          if (!currentEq) {
            changed = true;
            return null;
          }
          const validQty = Math.min(item.quantity, currentEq.availableQuantity);
          if (validQty <= 0) {
            changed = true;
            return null;
          }
          if (currentEq !== item.equipment || validQty !== item.quantity) {
            changed = true;
            return {
              ...item,
              equipment: currentEq,
              quantity: validQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];

      return changed ? updatedCart : prevCart;
    });
  }, [equipment]);

  const setCurrentUser = (profile: UserProfile) => {
    setCurrentUserState(profile);
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    setShowUserRegisterModal(false);
  };

  const adminLogin = (usernameOrPassword: string, passwordInput?: string) => {
    let u = '';
    let p = '';
    if (passwordInput !== undefined) {
      u = usernameOrPassword;
      p = passwordInput;
    } else {
      u = 'Krunon';
      p = usernameOrPassword;
    }

    const normUser = u.trim().toLowerCase();
    const normPass = p.trim();

    if (
      (normUser === 'krunon' && normPass === '08082496') ||
      normPass === '08082496' ||
      normPass === 'admin123'
    ) {
      setIsAdminLoggedIn(true);
      localStorage.setItem(STORAGE_KEYS.ADMIN_LOGGED_IN, 'true');
      setRoleState('admin');
      setShowAdminLoginModal(false);
      return { success: true, message: 'เข้าสู่ระบบ Admin (Krunon) สำเร็จเรียบร้อย' };
    } else {
      return { 
        success: false, 
        message: 'ชื่อผู้ใช้หรือรหัสผ่าน Admin ไม่ถูกต้อง (User: Krunon, Password: 08082496)' 
      };
    }
  };

  const adminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_LOGGED_IN);
    setRoleState('user');
    if (activeTab === 'admin') {
      setActiveTab('calendar');
    }
  };

  const [activeTab, setActiveTab] = useState<string>('home');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-09');
  const [periodFilter, setPeriodFilter] = useState<{ startDate: string; endDate: string }>({
    startDate: '2026-08-09',
    endDate: '2026-08-09',
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | 'ทั้งหมด'>('ทั้งหมด');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(equipment));
  }, [equipment]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(borrowRequests));
  }, [borrowRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROLE, JSON.stringify(role));
  }, [role]);

  const setRole = (newRole: UserRole) => {
    if (newRole === 'admin' && !isAdminLoggedIn) {
      setShowAdminLoginModal(true);
      return;
    }
    setRoleState(newRole);
  };

  const toggleRole = () => {
    if (role === 'user') {
      if (!isAdminLoggedIn) {
        setShowAdminLoginModal(true);
      } else {
        setRoleState('admin');
      }
    } else {
      setRoleState('user');
    }
  };

  const handleSetActiveTab = (tab: string) => {
    if (tab === 'admin') {
      if (!isAdminLoggedIn) {
        setShowAdminLoginModal(true);
        return;
      } else {
        setRoleState('admin');
      }
    }
    setActiveTab(tab);
  };

  const addToCart = (equipmentId: string, quantity = 1) => {
    const targetEq = equipment.find((e) => e.id === equipmentId);
    if (!targetEq || targetEq.availableQuantity < 1 || targetEq.status !== 'available') {
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.equipmentId === equipmentId);
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, targetEq.availableQuantity);
        return prev.map((item) =>
          item.equipmentId === equipmentId ? { ...item, quantity: nextQty } : item
        );
      } else {
        return [...prev, { equipmentId, equipment: targetEq, quantity: Math.min(quantity, targetEq.availableQuantity) }];
      }
    });
  };

  const removeFromCart = (equipmentId: string) => {
    setCart((prev) => prev.filter((item) => item.equipmentId !== equipmentId));
  };

  const updateCartQuantity = (equipmentId: string, quantity: number) => {
    const targetEq = equipment.find((e) => e.id === equipmentId);
    if (!targetEq) return;

    if (quantity <= 0) {
      removeFromCart(equipmentId);
      return;
    }

    const maxQty = targetEq.availableQuantity;
    const finalQty = Math.min(quantity, maxQty);

    setCart((prev) =>
      prev.map((item) => (item.equipmentId === equipmentId ? { ...item, quantity: finalQty } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const generateTagCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'ED-TECH-U-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const submitBorrowRequest = (data: {
    studentName: string;
    studentId: string;
    phone: string;
    purpose: string;
    startDate: string;
    endDate: string;
    pickupTime: string;
  }) => {
    if (cart.length === 0) {
      return { success: false, message: 'กระเป๋าอุปกรณ์ว่างเปล่า กรุณาเลือกอุปกรณ์ก่อน' };
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays > 3) {
      return { success: false, message: 'ระยะเวลาการยืมสูงสุดไม่เกิน 3 วัน' };
    }

    const tagCode = generateTagCode();
    const newRequest: BorrowRequest = {
      id: `req-${Date.now()}`,
      tagCode,
      studentName: data.studentName,
      studentId: data.studentId,
      phone: data.phone,
      purpose: data.purpose,
      userEmail: authUser?.email || '',
      userId: authUser?.uid || '',
      items: cart.map((c) => ({
        equipmentId: c.equipmentId,
        equipmentName: c.equipment.name,
        category: c.equipment.category,
        quantity: c.quantity,
      })),
      startDate: data.startDate,
      endDate: data.endDate,
      pickupTime: data.pickupTime,
      createdAt: new Date().toISOString(),
      status: 'pending',
      isArchived: false,
    };

    const updatedEquipment = equipment.map((eq) => {
      const cartItem = cart.find((c) => c.equipmentId === eq.id);
      if (cartItem) {
        const nextAvailable = Math.max(0, eq.availableQuantity - cartItem.quantity);
        return {
          ...eq,
          availableQuantity: nextAvailable,
          status: eq.status,
        };
      }
      return eq;
    });

    const updatedRequests = [newRequest, ...borrowRequests];

    setEquipment(updatedEquipment);
    setBorrowRequests(updatedRequests);

    localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(updatedEquipment));
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(updatedRequests));

    broadcastSync(updatedEquipment, updatedRequests);

    if (IS_FIREBASE_CONNECTED && db) {
      (async () => {
        try {
          await setDoc(doc(db, REQUESTS_COLLECTION, newRequest.id), sanitizeForFirestore(newRequest));
          for (const eq of updatedEquipment) {
            const cartItem = cart.find((c) => c.equipmentId === eq.id);
            if (cartItem) {
              await setDoc(doc(db, EQUIPMENT_COLLECTION, eq.id), sanitizeForFirestore(eq), { merge: true });
            }
          }
        } catch (err) {
          console.error('Firestore submitBorrowRequest error:', err);
        }
      })();
    }

    clearCart();
    setIsCartOpen(false);
    setActiveTab('dashboard');

    return { success: true, message: 'ส่งคำขอยืมอุปกรณ์เรียบร้อยแล้ว รอการอนุมัติจากแอดมิน', tagCode };
  };

  const addMember = async (memberData: Omit<Member, 'id' | 'addedAt'>) => {
    if (!IS_FIREBASE_CONNECTED || !db) return;
    const newMember = {
      ...memberData,
      addedAt: new Date().toISOString()
    };
    await addDoc(collection(db, MEMBERS_COLLECTION), sanitizeForFirestore(newMember));
  };

  const removeMember = async (memberId: string) => {
    if (!IS_FIREBASE_CONNECTED || !db) return;
    await deleteDoc(doc(db, MEMBERS_COLLECTION, memberId));
  };

  const reportAttendance = async (status: 'present' | 'absent', note?: string) => {
    if (!IS_FIREBASE_CONNECTED || !db || !currentUser || !authUser) return;
    
    const member = members.find(m => m.studentId === currentUser.studentId);
    if (!member) return;

    const today = new Date().toISOString().split('T')[0];
    const attendanceId = `${member.id}_${today}`;
    
    const record: AttendanceRecord = {
      id: attendanceId,
      memberId: member.id,
      studentId: member.studentId,
      studentName: member.name,
      date: today,
      status: status,
      reportedAt: new Date().toISOString(),
      note: note
    };

    await setDoc(doc(db, ATTENDANCE_COLLECTION, attendanceId), sanitizeForFirestore(record));
    triggerRealtimeNotice(`บันทึกการเช็คชื่อเรียบร้อยแล้ว: ${status === 'present' ? 'มา' : 'ไม่มา'}`);
  };

  const getMemberByStudentId = (studentId: string) => {
    return members.find(m => m.studentId === studentId);
  };

  const getAttendanceForDate = (date: string) => {
    return attendanceRecords.filter(r => r.date === date);
  };

  const cancelBorrowRequest = (requestId: string) => {
    updateRequestStatus(requestId, 'cancelled');
  };

  const updateRequestStatus = async (
    requestId: string,
    newStatus: BorrowRequestStatus,
    adminNote?: string,
    rejectionReason?: string
  ) => {
    let targetUpdatedReq: BorrowRequest | null = null;
    let nextEquipmentList: EquipmentItem[] = [];

    setBorrowRequests((prevRequests) => {
      const targetReq = prevRequests.find((r) => r.id === requestId);
      if (!targetReq) return prevRequests;

      const oldStatus = targetReq.status;
      const activeStatuses: BorrowRequestStatus[] = ['pending', 'approved', 'ready', 'borrowed'];
      const restoringStatuses: BorrowRequestStatus[] = ['returned', 'rejected', 'cancelled'];

      const isRestoring = activeStatuses.includes(oldStatus) && restoringStatuses.includes(newStatus);
      const isReactivating = restoringStatuses.includes(oldStatus) && activeStatuses.includes(newStatus);

      setEquipment((prevEquipment) => {
        let updatedEq = prevEquipment;
        if (isRestoring) {
          updatedEq = prevEquipment.map((eq) => {
            const itemInReq = targetReq.items.find((i) => i.equipmentId === eq.id);
            if (itemInReq) {
              const restoredQty = Math.min(eq.totalQuantity, eq.availableQuantity + itemInReq.quantity);
              return {
                ...eq,
                availableQuantity: restoredQty,
                status: eq.status,
              };
            }
            return eq;
          });
        } else if (isReactivating) {
          updatedEq = prevEquipment.map((eq) => {
            const itemInReq = targetReq.items.find((i) => i.equipmentId === eq.id);
            if (itemInReq) {
              const nextAvailable = Math.max(0, eq.availableQuantity - itemInReq.quantity);
              return {
                ...eq,
                availableQuantity: nextAvailable,
                status: eq.status,
              };
            }
            return eq;
          });
        }
        nextEquipmentList = updatedEq;
        localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(updatedEq));
        return updatedEq;
      });

      const updatedReqs = prevRequests.map((req) => {
        if (req.id !== requestId) return req;

        const updated: BorrowRequest = {
          ...req,
          status: newStatus,
          adminNote: adminNote !== undefined ? adminNote : (req.adminNote || ''),
          rejectionReason: rejectionReason !== undefined ? rejectionReason : (req.rejectionReason || ''),
        };

        if (newStatus === 'returned') {
          updated.returnedAt = new Date().toISOString();
        } else if (newStatus === 'borrowed') {
          updated.checkedOutAt = new Date().toISOString();
        }

        targetUpdatedReq = updated;
        return updated;
      });

      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(updatedReqs));
      broadcastSync(nextEquipmentList, updatedReqs);
      return updatedReqs;
    });

    if (IS_FIREBASE_CONNECTED && db && targetUpdatedReq) {
      const cleanReq = sanitizeForFirestore(targetUpdatedReq);
      try {
        await setDoc(doc(db, REQUESTS_COLLECTION, requestId), cleanReq, { merge: true });
        for (const eq of nextEquipmentList) {
          const cleanEq = sanitizeForFirestore(eq);
          await setDoc(doc(db, EQUIPMENT_COLLECTION, eq.id), cleanEq, { merge: true });
        }
      } catch (err) {
        console.warn('Firestore updateRequestStatus sync warning:', err);
      }
    }
  };

  const addEquipmentItem = async (itemData: Omit<EquipmentItem, 'id'>) => {
    const newId = `eq-${Date.now()}`;
    const newItem: EquipmentItem = {
      ...itemData,
      id: newId,
    };

    let updatedList: EquipmentItem[] = [];
    setEquipment((prev) => {
      updatedList = [newItem, ...prev];
      localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(updatedList));
      broadcastSync(updatedList, borrowRequests);
      return updatedList;
    });

    if (IS_FIREBASE_CONNECTED && db) {
      try {
        await setDoc(doc(db, EQUIPMENT_COLLECTION, newId), sanitizeForFirestore(newItem));
      } catch (err) {
        console.warn('Firestore addEquipmentItem error:', err);
      }
    }
  };

  const updateEquipmentItem = async (updatedItem: EquipmentItem) => {
    let updatedList: EquipmentItem[] = [];
    setEquipment((prev) => {
      updatedList = prev.map((item) => (item.id === updatedItem.id ? updatedItem : item));
      localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(updatedList));
      broadcastSync(updatedList, borrowRequests);
      return updatedList;
    });

    if (IS_FIREBASE_CONNECTED && db) {
      try {
        await setDoc(doc(db, EQUIPMENT_COLLECTION, updatedItem.id), sanitizeForFirestore(updatedItem), { merge: true });
      } catch (err) {
        console.warn('Firestore updateEquipmentItem error:', err);
      }
    }
  };

  const deleteEquipmentItem = async (id: string) => {
    let updatedList: EquipmentItem[] = [];
    setEquipment((prev) => {
      updatedList = prev.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(updatedList));
      broadcastSync(updatedList, borrowRequests);
      return updatedList;
    });

    if (IS_FIREBASE_CONNECTED && db) {
      try {
        await deleteDoc(doc(db, EQUIPMENT_COLLECTION, id));
      } catch (err) {
        console.warn('Firestore deleteEquipmentItem error:', err);
      }
    }
  };

  const deleteBorrowRequest = async (requestId: string) => {
    let updatedReqs: BorrowRequest[] = [];
    setBorrowRequests((prev) => {
      updatedReqs = prev.filter((req) => req.id !== requestId);
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(updatedReqs));
      broadcastSync(equipment, updatedReqs);
      return updatedReqs;
    });

    if (IS_FIREBASE_CONNECTED && db) {
      try {
        await deleteDoc(doc(db, REQUESTS_COLLECTION, requestId));
        await deleteDoc(doc(db, ARCHIVED_REQUESTS_COLLECTION, requestId));
      } catch (err) {
        console.warn('Firestore deleteBorrowRequest error:', err);
      }
    }
  };

  const clearAllEquipment = async () => {
    setEquipment([]);
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify([]));
    broadcastSync([], borrowRequests);

    if (IS_FIREBASE_CONNECTED && db) {
      try {
        const snapshot = await getDocs(collection(db, EQUIPMENT_COLLECTION));
        for (const docSnap of snapshot.docs) {
          await deleteDoc(docSnap.ref);
        }
      } catch (err) {
        console.warn('Firestore clearAllEquipment error:', err);
      }
    }
  };

  const refreshData = async (): Promise<{ success: boolean; count: number; reqCount: number; error?: string }> => {
    if (IS_FIREBASE_CONNECTED && db) {
      try {
        const eqSnap = await getDocs(collection(db, EQUIPMENT_COLLECTION));
        const firestoreItems: EquipmentItem[] = [];
        eqSnap.forEach((docSnap) => {
          firestoreItems.push({ id: docSnap.id, ...docSnap.data() } as EquipmentItem);
        });

        const reqSnap = await getDocs(collection(db, REQUESTS_COLLECTION));
        const firestoreReqs: BorrowRequest[] = [];
        reqSnap.forEach((docSnap) => {
          const req = { id: docSnap.id, ...docSnap.data() } as BorrowRequest;
          if (!req.isArchived) {
            firestoreReqs.push(req);
          }
        });
        firestoreReqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const synced = calculateSynchronizedEquipment(firestoreItems, firestoreReqs);
        setEquipment(synced);
        setBorrowRequests(firestoreReqs);
        localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(synced));
        localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(firestoreReqs));
        broadcastSync(synced, firestoreReqs);

        triggerRealtimeNotice(`⚡ ดึงข้อมูลจาก Cloud Firestore สำเร็จ: อุปกรณ์ ${firestoreItems.length} รายการ, คำขอยืม ${firestoreReqs.length} รายการ`);
        return { success: true, count: firestoreItems.length, reqCount: firestoreReqs.length };
      } catch (fsErr: any) {
        console.warn('Firestore refresh error:', fsErr);
        const errMsg = fsErr?.message || 'ไม่สามารถเชื่อมต่อ Cloud Firestore ได้';
        triggerRealtimeNotice(`⚠️ Cloud Firestore แจ้งเตือน: ${errMsg}`);
        return { success: false, count: 0, reqCount: 0, error: errMsg };
      }
    }

    try {
      const savedEq = localStorage.getItem(STORAGE_KEYS.EQUIPMENT);
      const loadedEq: EquipmentItem[] = savedEq ? JSON.parse(savedEq) : [];
      const savedReq = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      const loadedReq: BorrowRequest[] = savedReq ? JSON.parse(savedReq) : [];
      const synced = calculateSynchronizedEquipment(loadedEq, loadedReq);
      setEquipment(synced);
      setBorrowRequests(loadedReq);
      broadcastSync(synced, loadedReq);
      triggerRealtimeNotice('⚡ รีเฟรชข้อมูลเรียบร้อยแล้ว (โหมด Local Storage)');
      return { success: true, count: synced.length, reqCount: loadedReq.length };
    } catch (err) {
      console.error('refreshData local error:', err);
      return { success: false, count: 0, reqCount: 0, error: 'เกิดข้อผิดพลาดในการโหลดข้อมูล' };
    }
  };

  const myBorrowRequests = borrowRequests.filter((r) => {
    const userEmail = (authUser?.email || '').toLowerCase().trim();
    const reqEmail = (r.userEmail || '').toLowerCase().trim();
    const currentStudentId = (currentUser?.studentId || '').trim();
    const currentUsername = (currentUser?.username || '').trim();
    const reqStudentId = (r.studentId || '').trim();
    const reqStudentName = (r.studentName || '').trim();

    if (userEmail && reqEmail && userEmail === reqEmail) return true;
    if (currentStudentId && reqStudentId && currentStudentId === reqStudentId) return true;
    if (currentUsername && reqStudentName && currentUsername === reqStudentName) return true;
    return false;
  });

  const clearAllBorrowHistory = async (targetScope: 'all' | 'mine' = 'all') => {
    const nowIso = new Date().toISOString();
    const requestsToArchive = targetScope === 'mine' ? myBorrowRequests : borrowRequests;
    if (requestsToArchive.length === 0) return;

    const remainingRequests = targetScope === 'mine' 
      ? borrowRequests.filter((r) => !requestsToArchive.some((m) => m.id === r.id))
      : [];

    const newlyArchived: BorrowRequest[] = requestsToArchive.map((r) => ({
      ...r,
      isArchived: true,
      archivedAt: nowIso,
    }));

    const combinedArchived = [...newlyArchived, ...archivedRequests];

    setBorrowRequests(remainingRequests);
    setArchivedRequests(combinedArchived);
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(remainingRequests));
    localStorage.setItem(STORAGE_KEYS.ARCHIVED_REQUESTS, JSON.stringify(combinedArchived));
    broadcastSync(equipment, remainingRequests);

    if (IS_FIREBASE_CONNECTED && db) {
      try {
        for (const req of newlyArchived) {
          await setDoc(doc(db, ARCHIVED_REQUESTS_COLLECTION, req.id), sanitizeForFirestore(req));
          await deleteDoc(doc(db, REQUESTS_COLLECTION, req.id));
        }
      } catch (err) {
        console.warn('Firestore clearAllBorrowHistory error:', err);
      }
    }
    triggerRealtimeNotice(`🗑️ ล้างประวัติการยืม ${newlyArchived.length} รายการ (จัดเก็บในคลังข้อมูลเก่าเรียบร้อย สามารถรื้อฟื้นได้)`);
  };

  const restoreBorrowHistory = async (fromDate?: string, selectedIds?: string[]) => {
    let itemsToRestore = [...archivedRequests];

    if (selectedIds && selectedIds.length > 0) {
      const idSet = new Set(selectedIds);
      itemsToRestore = itemsToRestore.filter((r) => idSet.has(r.id));
    } else if (fromDate) {
      const fromDateObj = new Date(fromDate);
      fromDateObj.setHours(0, 0, 0, 0);
      itemsToRestore = itemsToRestore.filter((r) => {
        const itemDate = new Date(r.startDate || r.createdAt);
        return itemDate >= fromDateObj;
      });
    }

    if (itemsToRestore.length === 0) {
      return { success: false, count: 0, message: 'ไม่พบรายการที่ตรงกับเงื่อนไขการรื้อฟื้น' };
    }

    const restoredIds = new Set(itemsToRestore.map((r) => r.id));
    const unarchivedList: BorrowRequest[] = itemsToRestore.map((r) => ({
      ...r,
      isArchived: false,
    }));

    const nextActiveRequests = [...unarchivedList, ...borrowRequests].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const nextArchived = archivedRequests.filter((r) => !restoredIds.has(r.id));

    setBorrowRequests(nextActiveRequests);
    setArchivedRequests(nextArchived);
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(nextActiveRequests));
    localStorage.setItem(STORAGE_KEYS.ARCHIVED_REQUESTS, JSON.stringify(nextArchived));
    broadcastSync(equipment, nextActiveRequests);

    if (IS_FIREBASE_CONNECTED && db) {
      try {
        for (const req of unarchivedList) {
          await setDoc(doc(db, REQUESTS_COLLECTION, req.id), sanitizeForFirestore(req));
          await deleteDoc(doc(db, ARCHIVED_REQUESTS_COLLECTION, req.id));
        }
      } catch (err: any) {
        console.error('restoreBorrowHistory error:', err);
        return { success: false, count: 0, message: err.message || 'เกิดข้อผิดพลาดในการรื้อฟื้น' };
      }
    }

    triggerRealtimeNotice(`♻️ รื้อฟื้นข้อมูลประวัติการยืม ${unarchivedList.length} รายการสำเร็จ`);
    return { 
      success: true, 
      count: unarchivedList.length, 
      message: `รื้อฟื้นประวัติการยืมสำเร็จ ${unarchivedList.length} รายการ` 
    };
  };

  const resetToDefaults = () => {
    setEquipment([]);
    setBorrowRequests([]);
    setArchivedRequests([]);
    setCart([]);
    setRoleState('user');
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ARCHIVED_REQUESTS, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.CART);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
    broadcastSync([], []);
    triggerRealtimeNotice('รีเซ็ตข้อมูลทั้งหมดเรียบร้อยแล้ว');
  };

  return (
    <BorrowContext.Provider
      value={{
        equipment,
        borrowRequests,
        archivedRequests,
        myBorrowRequests,
        cart,
        announcements,
        role,
        activeTab,
        isCartOpen,
        selectedDate,
        periodFilter,
        searchQuery,
        selectedCategory,
        isFirebaseConnected: IS_FIREBASE_CONNECTED,
        authUser,
        authLoading,
        domainErrorMsg,
        setDomainErrorMsg,
        loginWithGoogle,
        loginWithSchoolEmail,
        loginAsDemoStudent,
        loginAsDemoAdmin,
        logout,
        currentUser,
        setCurrentUser,
        isAdminLoggedIn,
        adminLogin,
        adminLogout,
        showUserRegisterModal,
        setShowUserRegisterModal,
        showAdminLoginModal,
        setShowAdminLoginModal,
        showRestoreHistoryModal,
        setShowRestoreHistoryModal,
        setRole,
        toggleRole,
        setActiveTab: handleSetActiveTab,
        setIsCartOpen,
        setSelectedDate,
        setPeriodFilter,
        setSearchQuery,
        setSelectedCategory,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        submitBorrowRequest,
        cancelBorrowRequest,
        deleteBorrowRequest,
        updateRequestStatus,
        addEquipmentItem,
        updateEquipmentItem,
        deleteEquipmentItem,
        clearAllEquipment,
        realtimeNotice,
        refreshData,
        resetToDefaults,
        clearAllBorrowHistory,
        restoreBorrowHistory,
        members,
        attendanceRecords,
        addMember,
        removeMember,
        reportAttendance,
        getMemberByStudentId,
        getAttendanceForDate,
      }}
    >
      {children}
    </BorrowContext.Provider>
  );
};

export const useBorrow = () => {
  const context = useContext(BorrowContext);
  if (!context) {
    throw new Error('useBorrow must be used within a BorrowProvider');
  }
  return context;
};