import React, { useState } from 'react';
import { 
  History, 
  RotateCcw, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Square, 
  X, 
  Search, 
  AlertCircle, 
  CheckCircle2,
  Package,
  Layers
} from 'lucide-react';
import { useBorrow } from '../../context/BorrowContext';

export const RestoreHistoryModal: React.FC = () => {
  const { 
    archivedRequests, 
    restoreBorrowHistory, 
    showRestoreHistoryModal, 
    setShowRestoreHistoryModal 
  } = useBorrow();

  const [restoreDate, setRestoreDate] = useState<string>('2026-08-01');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restoreMode, setRestoreMode] = useState<'date' | 'selection' | 'all'>('date');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!showRestoreHistoryModal) return null;

  const filteredArchived = archivedRequests.filter((req) => {
    const q = searchQuery.toLowerCase();
    return (
      req.tagCode.toLowerCase().includes(q) ||
      req.studentName.toLowerCase().includes(q) ||
      req.studentId.toLowerCase().includes(q) ||
      req.purpose.toLowerCase().includes(q)
    );
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredArchived.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredArchived.map((r) => r.id));
    }
  };

  const handleRestore = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      let res;
      if (restoreMode === 'all') {
        res = await restoreBorrowHistory();
      } else if (restoreMode === 'date') {
        res = await restoreBorrowHistory(restoreDate);
      } else {
        if (selectedIds.length === 0) {
          setFeedback({ type: 'error', message: 'กรุณาเลือกรายการที่ต้องการรื้อฟื้นอย่างน้อย 1 รายการ' });
          setIsSubmitting(false);
          return;
        }
        res = await restoreBorrowHistory(undefined, selectedIds);
      }

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setTimeout(() => {
          setShowRestoreHistoryModal(false);
          setFeedback(null);
          setSelectedIds([]);
        }, 1500);
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'เกิดข้อผิดพลาดในการรื้อฟื้นข้อมูล' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
                รื้อฟื้นข้อมูลประวัติการยืม
              </h2>
              <p className="text-xs text-slate-500">
                กู้คืนประวัติการยืมที่ถูกล้างออก กลับเข้าสู่ระบบแสดงผล
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowRestoreHistoryModal(false)}
            className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {feedback && (
            <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs md:text-sm font-medium ${
              feedback.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Archived Summary Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-slate-500 font-medium">จำนวนประวัติที่เก็บในคลังเก่า</p>
                <p className="text-xl font-bold text-blue-600">{archivedRequests.length} รายการ</p>
              </div>
            </div>
            <span className="text-[11px] px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold shadow-sm">
              ถาวรใน Cloud Firestore
            </span>
          </div>

          {archivedRequests.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <Package className="w-12 h-12 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">ไม่มีข้อมูลที่ถูกล้างอยู่ในคลังประวัติ</p>
              <p className="text-xs text-slate-500 mt-1">ประวัติการยืมทั้งหมดกำลังแสดงอยู่ในระบบ หรือยังไม่มีการล้างข้อมูล</p>
            </div>
          ) : (
            <>
              {/* Mode Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  เลือกรูปแบบการรื้อฟื้น:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRestoreMode('date')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      restoreMode === 'date'
                        ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <CalendarIcon className="w-4 h-4 text-blue-600" />
                    <span>ตามวันที่</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRestoreMode('selection')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      restoreMode === 'selection'
                        ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    <span>เลือกทีละรายการ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRestoreMode('all')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      restoreMode === 'all'
                        ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>รื้อฟื้นทั้งหมด</span>
                  </button>
                </div>
              </div>

              {/* Date Mode Input */}
              {restoreMode === 'date' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <CalendarIcon className="w-4 h-4 text-blue-600" />
                    <span>ระบุวันที่เริ่มต้นที่ต้องการรื้อฟื้น:</span>
                  </div>
                  <input
                    type="date"
                    value={restoreDate}
                    onChange={(e) => setRestoreDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition shadow-sm"
                  />
                  <p className="text-[11px] text-slate-500">
                    * ระบบจะรื้อฟื้นคำขอยืมทั้งหมดที่มีวันที่เริ่มต้นยืมตั้งแต่วันที่ {formatDate(restoreDate)} เป็นต้นไป
                  </p>
                </div>
              )}

              {/* Selection Mode Item List */}
              {restoreMode === 'selection' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ค้นหารายการ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={selectAll}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      {selectedIds.length === filteredArchived.length && filteredArchived.length > 0 ? (
                        <>
                          <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                          <span>ยกเลิกทั้งหมด</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5 text-slate-400" />
                          <span>เลือกทั้งหมด ({filteredArchived.length})</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white custom-scrollbar">
                    {filteredArchived.map((req) => {
                      const isSelected = selectedIds.includes(req.id);
                      return (
                        <div
                          key={req.id}
                          onClick={() => toggleSelect(req.id)}
                          className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition ${
                            isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">{req.tagCode}</span>
                                <span className="text-[11px] text-slate-600">• {req.studentName}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                ยืม: {formatDate(req.startDate)} - {formatDate(req.endDate)} | {req.items.map((i) => `${i.equipmentName} (${i.quantity})`).join(', ')}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ล้างเมื่อ: {formatDate(req.archivedAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Mode Info */}
              {restoreMode === 'all' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    การเลือก "รื้อฟื้นทั้งหมด" จะนำคำขอยืมทั้งหมดในคลังเก่า ({archivedRequests.length} รายการ) กลับคืนสู่ระบบประวัติการยืมหลักทันที
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowRestoreHistoryModal(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 transition shadow-sm"
          >
            ปิด
          </button>

          {archivedRequests.length > 0 && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleRestore}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>
                {isSubmitting ? 'กำลังรื้อฟื้นข้อมูล...' : 'ยืนยันการรื้อฟื้นข้อมูล'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
