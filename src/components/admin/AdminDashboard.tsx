import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  PackageCheck, 
  RotateCcw, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  FileSpreadsheet, 
  AlertTriangle, 
  RefreshCw,
  Box,
  BarChart3,
  Calendar,
  Layers,
  MessageSquare,
  Check,
  X,
  Save
} from 'lucide-react';
import { useBorrow } from '../../context/BorrowContext';
import { BorrowRequest, BorrowRequestStatus, EquipmentCategory, EquipmentItem } from '../../types';
import  AdminAttendanceView  from './AdminAttendanceView';

export const AdminDashboard: React.FC = () => {
  const { 
    borrowRequests, 
    archivedRequests,
    updateRequestStatus, 
    equipment, 
    addEquipmentItem, 
    updateEquipmentItem, 
    deleteEquipmentItem,
    deleteBorrowRequest,
    clearAllEquipment,
    refreshData,
    resetToDefaults,
    clearAllBorrowHistory,
    isAdminLoggedIn,
    setShowAdminLoginModal,
    setShowRestoreHistoryModal,
    isFirebaseConnected
  } = useBorrow();

  const [adminTab, setAdminTab] = useState<'requests' | 'inventory' | 'attendance' | 'reports'>('requests');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showClearModal, setShowClearModal] = useState(false);

  // Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Delete Confirm Item State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<EquipmentItem | null>(null);
  const [isDeletingEquipment, setIsDeletingEquipment] = useState(false);
  const [deleteConfirmRequest, setDeleteConfirmRequest] = useState<BorrowRequest | null>(null);
  const [isDeletingRequest, setIsDeletingRequest] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3200);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await refreshData();
      if (res?.success) {
        showToast(`✅ ดึงข้อมูลจาก Firebase สำเร็จ: อุปกรณ์ ${res.count} รายการ, คำขอยืม ${res.reqCount} รายการ`);
      } else if (res?.error) {
        showToast(res.error);
      } else {
        showToast('รีเฟรชข้อมูลเรียบร้อยแล้ว');
      }
    } catch (e: any) {
      showToast('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + (e?.message || ''));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Action Modals State
  const [actionModal, setActionModal] = useState<{
    type: 'approve' | 'reject' | 'checkout' | 'return' | 'note' | null;
    request: BorrowRequest | null;
  }>({ type: null, request: null });

  const [modalNote, setModalNote] = useState('');
  const [modalReason, setModalReason] = useState('');

  // Equipment Modal State
  const [equipmentModal, setEquipmentModal] = useState<{
    isOpen: boolean;
    item: EquipmentItem | null;
  }>({ isOpen: false, item: null });

  const [eqForm, setEqForm] = useState({
    name: '',
    category: 'กล้อง' as EquipmentCategory,
    categoryEnglish: 'CAMERA',
    description: '',
    totalQuantity: 1,
    availableQuantity: 1,
    status: 'available' as 'available' | 'maintenance' | 'broken',
  });

  // Calculate pending badge count
  const pendingCount = borrowRequests.filter((r) => r.status === 'pending').length;

  // Filter requests
  const filteredRequests = borrowRequests.filter((req) => {
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery = 
      req.tagCode.toLowerCase().includes(q) ||
      req.studentName.toLowerCase().includes(q) ||
      req.studentId.toLowerCase().includes(q) ||
      req.purpose.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const getItemStatusBadge = (status: BorrowRequestStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'รออนุมัติ', cls: 'bg-amber-50 text-amber-800 border-amber-200', icon: '⏳' };
      case 'approved':
        return { label: 'อนุมัติแล้ว', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: '✅' };
      case 'ready':
        return { label: 'พร้อมรับของ', cls: 'bg-purple-50 text-purple-800 border-purple-200', icon: '📦' };
      case 'borrowed':
        return { label: 'กำลังยืมอยู่', cls: 'bg-blue-50 text-blue-800 border-blue-200', icon: '🎒' };
      case 'returned':
        return { label: 'คืนแล้ว', cls: 'bg-slate-100 text-slate-700 border-slate-200', icon: '🔄' };
      case 'rejected':
        return { label: 'ปฏิเสธ', cls: 'bg-red-50 text-red-800 border-red-200', icon: '❌' };
      case 'cancelled':
        return { label: 'ยกเลิกแล้ว', cls: 'bg-slate-100 text-slate-500 border-slate-200', icon: '🚫' };
      default:
        return { label: status, cls: 'bg-slate-100 text-slate-700 border-slate-200', icon: '📌' };
    }
  };

  // Open Approval Modal
  const openActionModal = (type: 'approve' | 'reject' | 'checkout' | 'return' | 'note', req: BorrowRequest) => {
    setActionModal({ type, request: req });
    setModalNote(req.adminNote || '');
    setModalReason(req.rejectionReason || '');
  };

  const handleDirectApprove = (req: BorrowRequest) => {
    updateRequestStatus(req.id, 'approved', req.adminNote || 'อนุมัติคำขอยืมเรียบร้อย');
    showToast(`✅ อนุมัติคำขอยืมเลข Tag: ${req.tagCode} เรียบร้อยแล้ว (ย้ายไปแท็บ 'อนุมัติแล้ว')`);
  };

  const handleConfirmAction = () => {
    if (!actionModal.request || !actionModal.type) return;
    const req = actionModal.request;

    if (actionModal.type === 'approve') {
      updateRequestStatus(req.id, 'approved', modalNote || 'อนุมัติคำขอยืมเรียบร้อย');
      showToast(`✅ อนุมัติคำขอยืมเลข Tag: ${req.tagCode} เรียบร้อยแล้ว`);
    } else if (actionModal.type === 'reject') {
      updateRequestStatus(req.id, 'rejected', modalNote, modalReason || 'อุปกรณ์ไม่เพียงพอ หรือติดภารกิจ');
      showToast(`❌ ปฏิเสธคำขอยืมเลข Tag: ${req.tagCode} แล้ว`);
    } else if (actionModal.type === 'checkout') {
      updateRequestStatus(req.id, 'borrowed', modalNote || 'ผู้ยืมรับอุปกรณ์เรียบร้อยแล้ว');
      showToast(`📦 บันทึกการส่งมอบอุปกรณ์ Tag: ${req.tagCode} แล้ว`);
    } else if (actionModal.type === 'return') {
      updateRequestStatus(req.id, 'returned', modalNote || 'ส่งคืนอุปกรณ์ครบถ้วนเรียบร้อย');
      showToast(`🔄 บันทึกการรับคืนอุปกรณ์ Tag: ${req.tagCode} เรียบร้อยแล้ว`);
    } else if (actionModal.type === 'note') {
      updateRequestStatus(req.id, req.status, modalNote);
      showToast('📝 บันทึกหมายเหตุเพิ่มเติมเรียบร้อยแล้ว');
    }

    setActionModal({ type: null, request: null });
    setModalNote('');
    setModalReason('');
  };

  // Open Equipment Modal
  const openEquipmentModal = (item?: EquipmentItem) => {
    if (item) {
      setEquipmentModal({ isOpen: true, item });
      setEqForm({
        name: item.name,
        category: item.category,
        categoryEnglish: item.categoryEnglish || item.category,
        description: item.description,
        totalQuantity: item.totalQuantity,
        availableQuantity: item.availableQuantity,
        status: item.status,
      });
    } else {
      setEquipmentModal({ isOpen: true, item: null });
      setEqForm({
        name: '',
        category: 'กล้อง',
        categoryEnglish: 'CAMERA',
        description: '',
        totalQuantity: 1,
        availableQuantity: 1,
        status: 'available',
      });
    }
  };

  const handleSaveEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eqForm.name.trim()) return;

    if (equipmentModal.item) {
      updateEquipmentItem({
        ...equipmentModal.item,
        name: eqForm.name,
        category: eqForm.category,
        categoryEnglish: eqForm.categoryEnglish,
        description: eqForm.description,
        totalQuantity: Number(eqForm.totalQuantity),
        availableQuantity: Number(eqForm.availableQuantity),
        status: eqForm.status,
      });
      showToast(`บันทึกและอัปเดตข้อมูล "${eqForm.name}" เรียบร้อยแล้ว`);
    } else {
      addEquipmentItem({
        name: eqForm.name,
        category: eqForm.category,
        categoryEnglish: eqForm.categoryEnglish,
        description: eqForm.description,
        totalQuantity: Number(eqForm.totalQuantity),
        availableQuantity: Number(eqForm.availableQuantity),
        status: eqForm.status,
      });
      showToast(`เพิ่มอุปกรณ์ "${eqForm.name}" เข้าสู่คลังเรียบร้อยแล้ว`);
    }

    setEquipmentModal({ isOpen: false, item: null });
  };

  const handleDeleteEquipment = async (item: EquipmentItem) => {
    try {
      setIsDeletingEquipment(true);
      await deleteEquipmentItem(item.id);
      showToast(`ลบรายการ "${item.name}" ออกจากคลังเรียบร้อยแล้ว`);
      setDeleteConfirmItem(null);
    } catch (err: any) {
      showToast(`เกิดข้อผิดพลาดในการลบ: ${err?.message || 'โปรดลองใหม่อีกครั้ง'}`);
    } finally {
      setIsDeletingEquipment(false);
    }
  };

  const handleDeleteRequest = async (req: BorrowRequest) => {
    try {
      setIsDeletingRequest(true);
      await deleteBorrowRequest(req.id);
      showToast(`ลบคำขอยืมรหัส "${req.tagCode}" เรียบร้อยแล้ว`);
      setDeleteConfirmRequest(null);
    } catch (err: any) {
      showToast(`เกิดข้อผิดพลาดในการลบคำขอ: ${err?.message || 'โปรดลองใหม่อีกครั้ง'}`);
    } finally {
      setIsDeletingRequest(false);
    }
  };

  const getStatusBadge = (status: BorrowRequestStatus) => {
    switch (status) {
      case 'pending': return { label: 'รออนุมัติ', cls: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'approved': return { label: 'อนุมัติแล้ว', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'ready': return { label: 'รอรับของ', cls: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'borrowed': return { label: 'กำลังยืม', cls: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'returned': return { label: 'คืนแล้ว', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'rejected': return { label: 'ปฏิเสธ', cls: 'bg-red-50 text-red-800 border-red-200' };
      case 'cancelled': return { label: 'ยกเลิกแล้ว', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto text-slate-800 my-12 animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-blue-600/20">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              สิทธิ์เข้าถึงเฉพาะผู้ดูแลระบบ (Admin Required)
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              ฝั่งผู้ใช้ทั่วไปสามารถดูรายการอุปกรณ์และยืมได้เท่านั้น หากต้องการเพิ่ม ลบ หรือแก้ไขอุปกรณ์ กรุณาเข้าสู่ระบบ Admin
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-sm mx-auto text-left text-xs space-y-1.5 font-mono shadow-sm">
            <div className="text-blue-700 font-sans font-bold mb-2 text-[11px] uppercase tracking-wider">
              ข้อมูลเข้าสู่ระบบ Admin (Credentials)
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="text-slate-500">User:</span>
              <span className="font-bold text-slate-900">Krunon</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="text-slate-500">Password:</span>
              <span className="font-bold text-slate-900">08082496</span>
            </div>
          </div>

          <button
            onClick={() => setShowAdminLoginModal(true)}
            className="w-full max-w-sm mx-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-95"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>เข้าสู่ระบบ Admin</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto text-slate-800">
      {/* Top Banner Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-200">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>ระบบหลังบ้าน (Admin Control Panel)</span>
              {!isFirebaseConnected && (
                <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                  โหมด Local (ยกเลิก Firebase แล้ว)
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              จัดการอนุมัติคำขอยืม ตรวจรับ-คืนอุปกรณ์ และบริหารคลังครุภัณฑ์ ED-TECH
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-60"
            title={isFirebaseConnected ? 'ดึงข้อมูลล่าสุดจาก Firebase' : 'รีเฟรชข้อมูลจาก Local Storage'}
          >
            <RotateCcw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>
              {isRefreshing 
                ? 'กำลังดึงข้อมูล...' 
                : isFirebaseConnected 
                  ? 'รีเฟรชจาก Firebase' 
                  : 'รีเฟรชข้อมูล (Local)'}
            </span>
          </button>


          {/* Restore History Button */}
          <button
            type="button"
            onClick={() => setShowRestoreHistoryModal(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
            title="รื้อฟื้นประวัติคำขอยืมที่ถูกล้างออก"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
            <span>รื้อฟื้นข้อมูลการยืม</span>
            {archivedRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-bold ml-0.5">
                {archivedRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
            title="ล้างประวัติคำขอยืมทั้งหมด"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
            <span>ล้างประวัติการยืมทั้งหมด</span>
          </button>
        </div>
      </div>

      {/* Admin Primary Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6">
        <button
          onClick={() => setAdminTab('requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition border ${
            adminTab === 'requests'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>จัดการคำขอยืม</span>
          {pendingCount > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              adminTab === 'requests' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700 border border-blue-200'
            }`}>
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition border ${
            adminTab === 'inventory'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>จัดการคลังอุปกรณ์</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
            adminTab === 'inventory' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}>
            {equipment.length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition border ${
            adminTab === 'attendance'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>เช็คชื่อสมาชิก</span>
        </button>

        <button
          onClick={() => setAdminTab('reports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition border ${
            adminTab === 'reports'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>รายงานและสถิติ</span>
        </button>
      </div>

      {/* TAB 1: REQUESTS MANAGEMENT */}
      {adminTab === 'requests' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 w-full sm:w-auto custom-scrollbar">
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'pending', label: 'รออนุมัติ', badge: pendingCount },
                { id: 'approved', label: 'อนุมัติแล้ว' },
                { id: 'ready', label: 'รอรับของ' },
                { id: 'borrowed', label: 'กำลังยืม' },
                { id: 'returned', label: 'คืนแล้ว' },
                { id: 'rejected', label: 'ปฏิเสธ' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                    statusFilter === filter.id
                      ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {filter.label}
                  {filter.badge !== undefined && filter.badge > 0 && (
                    <span className={`ml-1.5 font-bold px-1.5 py-0.2 rounded-full text-[10px] ${
                      statusFilter === filter.id ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {filter.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหา Tag, ชื่อ, รหัสนักเรียน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none shadow-sm"
              />
            </div>
          </div>

          {/* Requests Table / Cards */}
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl text-slate-400">
                <p className="text-sm font-medium">ไม่พบรายการยืมที่ตรงกับเงื่อนไข</p>
              </div>
            ) : (
              filteredRequests.map((req) => {
                const badge = getStatusBadge(req.status);

                return (
                  <div
                    key={req.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row justify-between gap-6 hover:border-slate-300 transition"
                  >
                    {/* Left: Info & Items */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                          {req.tagCode}
                        </span>
                        <h3 className="font-bold text-base text-slate-900">{req.studentName}</h3>
                        <span className="text-xs text-slate-500 font-mono">
                          ({req.studentId}) • Tel: {req.phone}
                        </span>
                        <span
                          className={`text-xs font-bold px-3 py-0.5 rounded-full border ml-auto lg:ml-0 ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* Equipment Items with Visual Status Badges */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Box className="w-3.5 h-3.5 text-blue-600" />
                          <span>รายการอุปกรณ์ในคำขอนี้:</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {req.items.map((it, idx) => {
                            const itemBadge = getItemStatusBadge(req.status);
                            return (
                              <div
                                key={idx}
                                className="bg-white text-slate-800 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
                              >
                                <span className="text-slate-900 font-bold">{it.equipmentName}</span>
                                <span className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded text-[11px] font-mono border border-blue-200">
                                  x{it.quantity}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${itemBadge.cls}`}>
                                  <span>{itemBadge.icon}</span>
                                  <span>{itemBadge.label}</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap gap-4">
                        <span>
                          <strong className="text-slate-700">วัตถุประสงค์:</strong> {req.purpose}
                        </span>
                        <span>
                          <strong className="text-slate-700">ระยะเวลา:</strong> {req.startDate} ถึง {req.endDate} (เวลารับ {req.pickupTime} น.)
                        </span>
                      </div>

                      {req.adminNote && (
                        <div className="text-xs text-blue-800 bg-blue-50 border border-blue-200 p-2.5 rounded-lg flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span><strong>หมายเหตุแอดมิน:</strong> {req.adminNote}</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Quick Action Buttons Workflow */}
                    <div className="flex flex-wrap lg:flex-col items-stretch justify-center gap-2 lg:w-52 border-t lg:border-t-0 lg:border-l border-slate-200 pt-3 lg:pt-0 lg:pl-6">
                      {req.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleDirectApprove(req)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                            title="กดอนุมัติคำขอนี้ทันที"
                          >
                            <CheckCircle className="w-4 h-4 text-white shrink-0" />
                            <span>อนุมัติคำขอ</span>
                          </button>

                          <button
                            onClick={() => openActionModal('reject', req)}
                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                          >
                            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                            <span>ปฏิเสธคำขอ</span>
                          </button>
                        </>
                      )}

                      {(req.status === 'approved' || req.status === 'ready') && (
                        <button
                          onClick={() => openActionModal('checkout', req)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                        >
                          <PackageCheck className="w-4 h-4" />
                          <span>บันทึกผู้ยืมรับของ</span>
                        </button>
                      )}

                      {req.status === 'borrowed' && (
                        <button
                          onClick={() => openActionModal('return', req)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>บันทึกรับคืนของ</span>
                        </button>
                      )}

                      <button
                        onClick={() => openActionModal('note', req)}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                        <span>แก้ไขหมายเหตุ</span>
                      </button>

                      <button
                        onClick={() => setDeleteConfirmRequest(req)}
                        className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition"
                        title="ลบคำขอยืมนี้ออกจากระบบ"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                        <span>ลบคำขอนี้</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY MANAGEMENT */}
      {adminTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>รายการอุปกรณ์ทั้งหมดในคลัง</span>
                <span className="text-xs bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  {equipment.length} ชิ้น
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                จัดการเพิ่ม แก้ไข ปรับสถานะ หรือลบรายการอุปกรณ์ของแอดมิน
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
                title="รีโหลดและซิงก์ข้อมูลคลังอุปกรณ์ล่าสุด"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-700 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'กำลังอัปเดต...' : 'อัปเดต & รีโหลดคลัง'}</span>
              </button>

              <button
                onClick={() => openEquipmentModal()}
                className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มอุปกรณ์ใหม่</span>
              </button>
            </div>
          </div>

          {equipment.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center mx-auto">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">ยังไม่มีอุปกรณ์ในคลัง</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  กดปุ่ม "เพิ่มอุปกรณ์ใหม่" เพื่อเริ่มสร้างรายการอุปกรณ์ของแอดมิน
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => openEquipmentModal()}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มอุปกรณ์ชิ้นใหม่</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipment.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{item.name}</h3>
                        <p className="text-[10px] text-slate-500 font-mono font-bold uppercase">
                          {item.category} • {item.categoryEnglish}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          item.status === 'available'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}
                      >
                        {item.status === 'available' ? 'ปกติ / พร้อมใช้' : 'ชำรุด / ส่งซ่อม'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                      {item.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="font-mono">
                      <span className="text-slate-500">พร้อมใช้:</span>{' '}
                      <span className="font-bold text-emerald-700">{item.availableQuantity}</span> / {item.totalQuantity}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEquipmentModal(item)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition"
                        title="แก้ไขข้อมูล"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmItem(item)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition"
                        title="ลบออกจากคลัง"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: ATTENDANCE MANAGEMENT */}
      {adminTab === 'attendance' && (
        <div className="space-y-6">
          <AdminAttendanceView />
        </div>
      )}

      {/* TAB 3: REPORTS & STATS */}
      {adminTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
              <p className="text-xs text-slate-500 font-bold">อัตราการอนุมัติ (Approval Rate)</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">
                {Math.round(
                  (borrowRequests.filter((r) => r.status === 'approved' || r.status === 'returned').length /
                    (borrowRequests.length || 1)) *
                    100
                )}%
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
              <p className="text-xs text-slate-500 font-bold">อุปกรณ์รวมในระบบ</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {equipment.reduce((acc, curr) => acc + curr.totalQuantity, 0)} ชิ้น
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
              <p className="text-xs text-slate-500 font-bold">อุปกรณ์กำลังถูกยืม</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {borrowRequests.filter((r) => r.status === 'borrowed').length} รายการ
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ACTION MODAL (Approve, Reject, Checkout, Return, Note) */}
      {actionModal.type && actionModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              {actionModal.type === 'approve' && '✅ อนุมัติคำขอยืม'}
              {actionModal.type === 'reject' && '❌ ปฏิเสธคำขอยืม'}
              {actionModal.type === 'checkout' && '📦 บันทึกการรับของ'}
              {actionModal.type === 'return' && '🔄 บันทึกการคืนของ'}
              {actionModal.type === 'note' && '📝 แก้ไขหมายเหตุแอดมิน'}
            </h3>

            <p className="text-xs text-slate-500 font-mono">
              Tag: {actionModal.request.tagCode} • {actionModal.request.studentName}
            </p>

            {actionModal.type === 'reject' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เหตุผลในการปฏิเสธ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder="เช่น ติดวันหยุด, ตรวจเช็คครุภัณฑ์ประจำปี..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white shadow-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ข้อความ/หมายเหตุเพิ่มเติมถึงนักเรียน
              </label>
              <textarea
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                placeholder="ระบุคำแนะนำ หรือสถานที่รับของ..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white shadow-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setActionModal({ type: null, request: null })}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 shadow-sm transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
              >
                ยืนยันการทำรายการ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EQUIPMENT ADD / EDIT MODAL */}
      {equipmentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <form
            onSubmit={handleSaveEquipment}
            className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-800 space-y-4"
          >
            <h3 className="text-lg font-bold text-slate-900">
              {equipmentModal.item ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ชื่ออุปกรณ์ *</label>
              <input
                type="text"
                required
                value={eqForm.name}
                onChange={(e) => setEqForm({ ...eqForm, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white shadow-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">หมวดหมู่ *</label>
                <select
                  value={eqForm.category}
                  onChange={(e) => setEqForm({ ...eqForm, category: e.target.value as EquipmentCategory })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white shadow-sm"
                >
                  {['กล้อง', 'เลนส์', 'อุปกรณ์เสริมกล้อง', 'กิมบอล', 'โดรน', 'เสียง', 'ไฟ', 'อุปกรณ์เสริมไฟ', 'ขาตั้ง', 'อื่นๆ'].map(
                    (cat) => (
                      <option key={cat} value={cat} className="bg-white text-slate-900">
                        {cat}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">หมวดภาษาอังกฤษ</label>
                <input
                  type="text"
                  value={eqForm.categoryEnglish}
                  onChange={(e) => setEqForm({ ...eqForm, categoryEnglish: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">จำนวนทั้งหมด *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={eqForm.totalQuantity}
                  onChange={(e) => setEqForm({ ...eqForm, totalQuantity: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none font-mono focus:border-blue-500 focus:bg-white shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">จำนวนพร้อมใช้ *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={eqForm.availableQuantity}
                  onChange={(e) => setEqForm({ ...eqForm, availableQuantity: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none font-mono focus:border-blue-500 focus:bg-white shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">สถานะอุปกรณ์ *</label>
              <select
                value={eqForm.status}
                onChange={(e) => setEqForm({ ...eqForm, status: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white shadow-sm"
              >
                <option value="available" className="bg-white text-slate-900">พร้อมใช้งาน (Available)</option>
                <option value="maintenance" className="bg-white text-slate-900">กำลังส่งซ่อม (Maintenance)</option>
                <option value="broken" className="bg-white text-slate-900">ชำรุด (Broken)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">รายละเอียดเพิ่มเติม</label>
              <textarea
                value={eqForm.description}
                onChange={(e) => setEqForm({ ...eqForm, description: e.target.value })}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white shadow-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEquipmentModal({ isOpen: false, item: null })}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 shadow-sm"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                บันทึกข้อมูล
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl relative text-slate-800">
            <div className="w-12 h-12 bg-red-50 border border-red-200 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              ยืนยันการล้างประวัติการยืมทั้งหมด?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              คำขอยืมทั้งหมดในระบบจะถูกย้ายเข้าสู่คลังประวัติเก่า (Archived) ใน Cloud Firestore โดยคุณสามารถกดปุ่ม <span className="text-blue-600 font-bold">"รื้อฟื้นข้อมูลการยืม"</span> และเลือกช่วงวันที่หรือรายการที่ต้องการนำกลับมาได้เสมอ
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl border border-slate-200 transition shadow-sm"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={async () => {
                  await clearAllBorrowHistory('all');
                  setShowClearModal(false);
                  showToast('ล้างประวัติการยืมและย้ายเข้าสู่คลังเก่าเรียบร้อยแล้ว');
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-sm"
              >
                ยืนยันล้างประวัติ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl relative space-y-4 text-slate-800">
            <div className="w-12 h-12 bg-red-50 border border-red-200 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">ยืนยันการลบอุปกรณ์</h3>
              <p className="text-xs text-slate-500 mt-1">
                คุณต้องการลบรายการ <strong className="text-red-600">"{deleteConfirmItem.name}"</strong> ออกจากคลังระบบถาวรใช่หรือไม่?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={isDeletingEquipment}
                onClick={() => setDeleteConfirmItem(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl border border-slate-200 transition shadow-sm disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                disabled={isDeletingEquipment}
                onClick={() => handleDeleteEquipment(deleteConfirmItem)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDeletingEquipment ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังลบ...</span>
                  </>
                ) : (
                  <span>ยืนยันการลบ</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Request Confirmation Modal */}
      {deleteConfirmRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl relative space-y-4 text-slate-800">
            <div className="w-12 h-12 bg-red-50 border border-red-200 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">ยืนยันการลบคำขอยืม</h3>
              <p className="text-xs text-slate-500 mt-1">
                คุณต้องการลบคำขอยืมรหัส <strong className="text-blue-600">{deleteConfirmRequest.tagCode}</strong> ของ <strong className="text-slate-800">{deleteConfirmRequest.studentName}</strong> ออกจากระบบถาวรใช่หรือไม่?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={isDeletingRequest}
                onClick={() => setDeleteConfirmRequest(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl border border-slate-200 transition shadow-sm disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                disabled={isDeletingRequest}
                onClick={() => handleDeleteRequest(deleteConfirmRequest)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDeletingRequest ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังลบ...</span>
                  </>
                ) : (
                  <span>ยืนยันการลบ</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-slate-200 text-slate-800 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in backdrop-blur-md">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">{toastMsg}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">ระบบได้ทำการอัปเดตและบันทึกข้อมูลเรียบร้อยแล้ว</p>
          </div>
        </div>
      )}
    </div>
  );
};
