export type EquipmentCategory = 
  | 'กล้อง' 
  | 'เลนส์' 
  | 'อุปกรณ์เสริมกล้อง' 
  | 'กิมบอล' 
  | 'โดรน' 
  | 'เสียง' 
  | 'ไฟ' 
  | 'อุปกรณ์เสริมไฟ' 
  | 'ขาตั้ง' 
  | 'อื่นๆ';

export type EquipmentStatus = 'available' | 'maintenance' | 'broken';

export interface EquipmentItem {
  id: string;
  name: string;
  category: EquipmentCategory;
  categoryEnglish?: string;
  description: string;
  totalQuantity: number;
  availableQuantity: number;
  status: EquipmentStatus;
  statusMessage?: string; // e.g. 'ชำรุด / Broken', 'งดให้บริการ'
  imageUrl?: string;
}

export type BorrowRequestStatus = 
  | 'pending'    // รออนุมัติ
  | 'approved'   // อนุมัติแล้ว
  | 'ready'      // รอรับของ
  | 'borrowed'   // กำลังยืมอยู่
  | 'returned'   // คืนแล้ว
  | 'rejected'   // ปฏิเสธ
  | 'cancelled';  // ยกเลิกแล้ว

export interface CartItem {
  equipmentId: string;
  equipment: EquipmentItem;
  quantity: number;
}

export interface BorrowedItemSummary {
  equipmentId: string;
  equipmentName: string;
  category: EquipmentCategory;
  quantity: number;
}

export interface BorrowRequest {
  id: string;
  tagCode: string; // e.g. 'DCD-U-3FII', 'DCD-P-NPY7'
  studentName: string;
  studentId: string;
  phone: string;
  purpose: string; // e.g. 'งานส่วนตัว', 'งานของโรงเรียน', 'งานรายวิชา', 'งานของ ED-TECH'
  items: BorrowedItemSummary[];
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  pickupTime: string; // e.g. '15:00', '09:30'
  createdAt: string; // ISO string
  status: BorrowRequestStatus;
  adminNote?: string;
  rejectionReason?: string;
  returnedAt?: string;
  checkedOutAt?: string;
  userEmail?: string;
  userId?: string;
  archivedAt?: string;
  isArchived?: boolean;
}

export const BORROW_PURPOSES = [
  'งานส่วนตัว',
  'งานของโรงเรียน',
  'งานรายวิชา',
  'งานของ ED-TECH',
] as const;

export type BorrowPurpose = (typeof BORROW_PURPOSES)[number];

export type UserRole = 'user' | 'admin';

export interface Member {
  id: string;
  name: string;
  studentId: string;
  phone?: string;
  role?: 'member' | 'leader' | 'admin';
  addedAt: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'missing'; // present = มา, absent = ไม่มา, missing = ขาดการติดต่อ

export interface AttendanceRecord {
  id: string;
  memberId: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  reportedAt: string; // ISO string
  note?: string;
  eventId?: string;
  eventTitle?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  isImportant?: boolean;
}
export type EventStatus = 'upcoming' | 'ongoing' | 'completed';

export interface ClubEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  status: EventStatus; // 'upcoming' = กำลังจะเกิดขึ้น, 'ongoing' = กำลังดำเนินการ, 'completed' = จบไปแล้ว
  createdAt: string;
}
