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
  purpose: string; // e.g. 'ใช้ในงานส่วนตัว (Personal Use)', 'ทำโปรเจกต์วิชา DCD201'
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

export type UserRole = 'user' | 'admin';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  isImportant?: boolean;
}
