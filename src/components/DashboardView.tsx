import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  FileSpreadsheet, 
  Calendar as CalendarIcon, 
  Copy, 
  Check, 
  AlertTriangle, 
  XCircle, 
  Search,
  Trash2,
  Package,
  PlusCircle,
  Filter,
  ShieldCheck,
  User as UserIcon,
  History
} from 'lucide-react';
import { useBorrow } from '../context/BorrowContext';
import { BorrowRequest, BorrowRequestStatus } from '../types';

export const DashboardView: React.FC = () => {
  const { 
    borrowRequests, 
    myBorrowRequests, 
    archivedRequests, 
    cancelBorrowRequest, 
    setActiveTab, 
    setSelectedDate, 
    clearAllBorrowHistory,
    isAdminLoggedIn,
    role,
    authUser,
    currentUser,
    setShowRestoreHistoryModal,
    refreshData,
    isFirebaseConnected
  } = useBorrow();

  const isAdmin = isAdminLoggedIn || role === 'admin';
  const [adminViewMode, setAdminViewMode] = useState<'all' | 'mine'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<string>('all');
  const [showClearModal, setShowClearModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await refreshData();
      if (res?.success) {
        setToastMsg(`✅ ดึงข้อมูลสำเร็จ: ประวัติการยืม ${res.reqCount} รายการ, อุปกรณ์ ${res.count} รายการ`);
      } else if (res?.error) {
        setToastMsg(res.error);
      }
    } catch {
      setToastMsg('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  // Determine active dataset: Admin can toggle between all and mine; regular users strictly see only their own!
  const currentRequestsList = isAdmin 
    ? (adminViewMode === 'all' ? borrowRequests : myBorrowRequests)
    : myBorrowRequests;

  // Compute stat counts based on current accessible list
  const totalRequests = currentRequestsList.length;
  const pendingRequests = currentRequestsList.filter((r) => r.status === 'pending').length;
  const approvedRequests = currentRequestsList.filter((r) => r.status === 'approved' || r.status === 'ready' || r.status === 'borrowed').length;
  const returnedRequests = currentRequestsList.filter((r) => r.status === 'returned').length;

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  // Filter requests by status tab and search text
  const filteredRequests = currentRequestsList.filter((req) => {
    const matchesStatus = 
      statusTab === 'all' ||
      (statusTab === 'pending' && req.status === 'pending') ||
      (statusTab === 'approved' && (req.status === 'approved' || req.status === 'ready' || req.status === 'borrowed')) ||
      (statusTab === 'returned' && req.status === 'returned') ||
      (statusTab === 'closed' && (req.status === 'rejected' || req.status === 'cancelled'));

    const q = searchFilter.toLowerCase();
    const matchesQuery = 
      req.tagCode.toLowerCase().includes(q) ||
      req.studentName.toLowerCase().includes(q) ||
      req.studentId.toLowerCase().includes(q) ||
      req.purpose.toLowerCase().includes(q);

    return matchesStatus && matchesQuery;
  });

  const getStatusBadge = (status: BorrowRequestStatus) => {
    switch (status) {
      case 'pending':
        return { text: 'รออนุมัติ', bg: 'bg-amber-50 text-amber-800 border-amber-200', borderLeft: 'border-l-amber-500' };
      case 'approved':
        return { text: 'อนุมัติแล้ว', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', borderLeft: 'border-l-emerald-500' };
      case 'ready':
        return { text: 'รอรับของ', bg: 'bg-purple-50 text-purple-800 border-purple-200', borderLeft: 'border-l-purple-500' };
      case 'borrowed':
        return { text: 'กำลังยืม', bg: 'bg-blue-50 text-blue-800 border-blue-200', borderLeft: 'border-l-blue-500' };
      case 'returned':
        return { text: 'คืนแล้ว', bg: 'bg-slate-100 text-slate-700 border-slate-200', borderLeft: 'border-l-slate-400' };
      case 'rejected':
        return { text: 'ปฏิเสธ', bg: 'bg-red-50 text-red-800 border-red-200', borderLeft: 'border-l-red-500' };
      case 'cancelled':
        return { text: 'ยกเลิกแล้ว', bg: 'bg-slate-100 text-slate-500 border-slate-200', borderLeft: 'border-l-slate-300' };
      default:
        return { text: status, bg: 'bg-slate-100 text-slate-700 border-slate-200', borderLeft: 'border-l-slate-400' };
    }
  };

  const getItemStatusBadge = (status: BorrowRequestStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'รออนุมัติ (Pending)', bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: '⏳' };
      case 'approved':
        return { label: 'อนุมัติแล้ว (Approved)', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: '✅' };
      case 'ready':
        return { label: 'พร้อมรับอุปกรณ์ (Ready)', bg: 'bg-purple-50 text-purple-800 border-purple-200', icon: '📦' };
      case 'borrowed':
        return { label: 'อยู่ระหว่างยืม (Borrowed)', bg: 'bg-blue-50 text-blue-800 border-blue-200', icon: '🎒' };
      case 'returned':
        return { label: 'คืนเรียบร้อย (Returned)', bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: '🔄' };
      case 'rejected':
        return { label: 'ปฏิเสธคำขอ (Rejected)', bg: 'bg-red-50 text-red-800 border-red-200', icon: '❌' };
      case 'cancelled':
        return { label: 'ยกเลิกแล้ว (Cancelled)', bg: 'bg-slate-100 text-slate-500 border-slate-200', icon: '🚫' };
      default:
        return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: '📌' };
    }
  };

  // Export Requests to CSV/Excel file
  const handleExportExcel = () => {
    const headers = ['Tag Code', 'Student Name', 'Student ID', 'Phone', 'Purpose', 'Start Date', 'End Date', 'Pickup Time', 'Status'];
    const rows = borrowRequests.map((req) => [
      req.tagCode,
      `"${req.studentName}"`,
      req.studentId,
      req.phone,
      `"${req.purpose}"`,
      req.startDate,
      req.endDate,
      req.pickupTime,
      req.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DCD_Borrow_Requests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group items by category
  const groupItemsByCategory = (items: BorrowRequest['items']) => {
    const grouped: Record<string, { name: string; quantity: number }[]> = {};
    items.forEach((item) => {
      const cat = item.category || 'อื่นๆ';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({ name: item.equipmentName, quantity: item.quantity });
    });
    return grouped;
  };

  // Format date helper
  const formatDateThai = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const thaiMonthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${d.getDate()} ${thaiMonthsShort[d.getMonth()]}`;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto text-slate-800 animate-fade-in">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="mb-4 p-3 bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center justify-between shadow-lg animate-fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white ml-2 text-sm font-bold">×</button>
        </div>
      )}

      {/* Title & Top Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              {isAdmin ? 'แดชบอร์ดประวัติการยืม' : 'ประวัติการยืมอุปกรณ์ของฉัน'}
            </h1>
            {isAdmin ? (
              <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                แอดมิน (Admin View)
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                เฉพาะส่วนบุคคล ({authUser?.email || currentUser?.username || 'ผู้ใช้'})
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1">
            {isAdmin 
              ? 'ตรวจสอบ จัดการสถานะคำขอยืม และติดตามอุปกรณ์ ED-TECH ทั้งหมด'
              : 'ตรวจสอบสถานะและประวัติการยืมอุปกรณ์ของคุณ (ระบบสงวนสิทธิ์เฉพาะเจ้าของข้อมูลเท่านั้น)'}
          </p>
        </div>

        {/* Action Buttons for Dashboard (Restore & Clear & Scope Toggle) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Admin Scope Toggle: All vs Mine */}
          {isAdmin && (
            <div className="bg-slate-100 border border-slate-200 p-1 rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setAdminViewMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  adminViewMode === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>ทั้งหมด ({borrowRequests.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminViewMode('mine')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  adminViewMode === 'mine'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>ของฉัน ({myBorrowRequests.length})</span>
              </button>
            </div>
          )}

          {/* Refresh / Sync Firebase Button */}
          {isAdminLoggedIn && (
            <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-60"
            title={isFirebaseConnected ? "ดึงข้อมูลล่าสุดจาก Firebase" : "รีเฟรชข้อมูล (Local)"}
          >
            <RotateCcw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'กำลังดึง...' : 'ดึงจาก Firebase'}</span>
          </button>
)}
          {/* Restore History Button */}
          {isAdminLoggedIn && (
            <button
            type="button"
            onClick={() => setShowRestoreHistoryModal(true)}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-400 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>รื้อฟื้นข้อมูลการยืม</span>
            {archivedRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-white text-[10px] font-extrabold ml-0.5">
                {archivedRequests.length}
              </span>
            )}
          </button>

          )}
          {/* Clear History Button */}
          {totalRequests > 0 && (
            <button
              type="button"
              onClick={() => setShowClearModal(true)}
              className="flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>{isAdmin && adminViewMode === 'all' ? 'ล้างประวัติการยืมทั้งหมด' : 'ล้างประวัติของฉัน'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:border-slate-300 transition">
          <div>
            <p className="text-xs text-slate-500 font-medium">คำขอทั้งหมด</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1.5">{totalRequests}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:border-amber-300 transition">
          <div>
            <p className="text-xs text-slate-500 font-medium">รออนุมัติ</p>
            <p className="text-3xl font-extrabold text-amber-700 mt-1.5">{pendingRequests}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:border-emerald-300 transition">
          <div>
            <p className="text-xs text-slate-500 font-medium">อนุมัติแล้ว / กำลังยืม</p>
            <p className="text-3xl font-extrabold text-emerald-700 mt-1.5">{approvedRequests}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:border-blue-300 transition">
          <div>
            <p className="text-xs text-slate-500 font-medium">คืนแล้ว</p>
            <p className="text-3xl font-extrabold text-blue-700 mt-1.5">{returnedRequests}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 p-1.5 rounded-xl overflow-x-auto custom-scrollbar">
          {[
            { id: 'all', label: 'ทั้งหมด', count: totalRequests },
            { id: 'pending', label: 'รออนุมัติ', count: pendingRequests },
            { id: 'approved', label: 'อนุมัติ/กำลังยืม', count: approvedRequests },
            { id: 'returned', label: 'คืนแล้ว', count: returnedRequests },
            { id: 'closed', label: 'ยกเลิก/ปฏิเสธ', count: borrowRequests.filter((r) => r.status === 'rejected' || r.status === 'cancelled').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                statusTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                statusTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Export Buttons */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหา Tag, ชื่อนักเรียน..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-slate-400 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition shadow-sm"
            />
          </div>

          <button
            onClick={handleExportExcel}
            disabled={totalRequests === 0}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Activity List Tickets */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl p-8 max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">ยังไม่มีประวัติการยืมอุปกรณ์</h3>
            <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto leading-relaxed">
              ประวัติการยืมถูกรีเซ็ตเรียบร้อย คุณสามารถเรียกดูรายการอุปกรณ์และส่งคำขอยืมอุปกรณ์ใหม่ได้ทันที
            </p>
            <button
              onClick={() => setActiveTab('catalog')}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>ไปยังคลังอุปกรณ์เพื่อทำการยืม</span>
            </button>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const statusBadge = getStatusBadge(req.status);
            const grouped = groupItemsByCategory(req.items);

            return (
              <div
                key={req.id}
                className={`bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row justify-between gap-6 transition relative border-l-4 ${statusBadge.borderLeft}`}
              >
                {/* Left Block: Tag, Name, Equipment, Purpose, Admin Note */}
                <div className="flex-1 space-y-3">
                  {/* Top Header Tag & Name */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs text-slate-500 font-medium">เลข Tag ยืมของ:</span>
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-sm">
                      {req.tagCode}
                    </span>
                    <button
                      onClick={() => handleCopyTag(req.tagCode)}
                      className="text-slate-400 hover:text-slate-700 transition"
                      title="คัดลอก Tag Code"
                    >
                      {copiedTag === req.tagCode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <h3 className="font-bold text-sm text-slate-900 ml-2">{req.studentName}</h3>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusBadge.bg}`}
                    >
                      {statusBadge.text}
                    </span>

                    <span className="text-xs text-slate-500 font-mono ml-auto lg:ml-0">
                      {req.studentId}
                    </span>
                  </div>

                  {/* Equipment Items Grouped with Visual Status Badges */}
                  <div className="space-y-2 pt-1">
                    <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-slate-700" />
                      <span>รายการอุปกรณ์ในคำขอนี้:</span>
                    </span>
                    <div className="space-y-2">
                      {Object.entries(grouped).map(([cat, items]) => (
                        <div key={cat} className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-slate-800 font-bold min-w-[60px] text-xs">{cat}:</span>
                          <div className="flex flex-wrap gap-2 flex-1">
                            {items.map((it, idx) => {
                              const itemBadge = getItemStatusBadge(req.status);
                              return (
                                <div
                                  key={idx}
                                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-1.5 flex items-center gap-2.5 text-xs shadow-sm transition"
                                >
                                  <span className="font-bold text-slate-800">{it.name}</span>
                                  <span className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono text-[11px]">
                                    x{it.quantity}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${itemBadge.bg}`}>
                                    <span>{itemBadge.icon}</span>
                                    <span>{itemBadge.label}</span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Purpose */}
                  <div className="text-xs text-slate-700">
                    <span className="text-slate-500 font-medium">วัตถุประสงค์:</span> {req.purpose}
                  </div>

                  {/* Admin Note / Rejection Warning Callout */}
                  {(req.adminNote || req.rejectionReason) && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-red-800">ข้อความจากแอดมิน: </span>
                        <span>{req.adminNote || req.rejectionReason}</span>
                      </div>
                    </div>
                  )}

                  {/* User Cancel Action button if still pending */}
                  {req.status === 'pending' && (
                    <div className="pt-1">
                      <button
                        onClick={() => cancelBorrowRequest(req.id)}
                        className="text-xs text-red-600 hover:text-red-700 underline font-medium"
                      >
                        ขอยกเลิกคำขอนี้
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Block: Schedule Box */}
                <div className="lg:w-80 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 shrink-0">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs border-b border-slate-200 pb-3">
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Start</p>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{formatDateThai(req.startDate)}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(req.startDate).getFullYear()}</p>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        🕒 รับของ: {req.pickupTime}
                      </span>
                      <p className="text-[9px] text-slate-500 font-mono mt-1">
                        จองเมื่อ: {formatDateThai(req.createdAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Return</p>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{formatDateThai(req.endDate)}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(req.endDate).getFullYear()}</p>
                    </div>
                  </div>

                  {/* Link to view in calendar */}
                  <button
                    onClick={() => {
                      setSelectedDate(req.startDate);
                      setActiveTab('calendar');
                    }}
                    className="w-full bg-white hover:bg-slate-100 text-slate-800 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-600" />
                    <span>ดูในปฏิทิน</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Clear History Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl relative">
            <div className="w-12 h-12 bg-red-50 border border-red-200 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {isAdmin && adminViewMode === 'all' 
                ? 'ยืนยันการล้างประวัติการยืมทั้งหมด?' 
                : 'ยืนยันการล้างประวัติการยืมของฉัน?'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              รายการที่ถูกล้างจะถูกจัดเก็บเข้าสู่คลังประวัติเก่าอย่างปลอดภัยใน Firestore โดยคุณหรือแอดมินสามารถกดปุ่ม <span className="text-slate-900 font-bold">"รื้อฟื้นข้อมูลการยืม"</span> เพื่อนำกลับมาแสดงใหม่ได้ตลอดเวลา
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl border border-slate-200 transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={async () => {
                  await clearAllBorrowHistory(isAdmin && adminViewMode === 'all' ? 'all' : 'mine');
                  setShowClearModal(false);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-sm"
              >
                ยืนยันล้างประวัติ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

