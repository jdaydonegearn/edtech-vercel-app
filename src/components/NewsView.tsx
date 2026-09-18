import React, { useState } from 'react';
import { useBorrow } from '../context/BorrowContext';
import { 
  Megaphone, 
  Calendar, 
  Clock, 
  MapPin, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  X, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { ClubEvent } from '../types';

export const NewsView: React.FC = () => {
  const { events, attendanceRecords, setActiveTab } = useBorrow();
  const [selectedEventModal, setSelectedEventModal] = useState<ClubEvent | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');

  const filteredEvents = events.filter((ev) => {
    if (statusFilter === 'all') return true;
    return ev.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ongoing':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            กำลังเกิดขึ้น
          </span>
        );
      case 'upcoming':
        return (
          <span className="bg-blue-100 text-blue-800 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-blue-200">
            ⏱️ กำลังจะเกิดขึ้น
          </span>
        );
      case 'completed':
        return (
          <span className="bg-slate-100 text-slate-600 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-slate-200">
            ✓ จบไปแล้ว
          </span>
        );
      default:
        return null;
    }
  };

  const currentModalAttendees = selectedEventModal
    ? attendanceRecords.filter((r) => r.eventId === selectedEventModal.id)
    : [];

  const modalPresentCount = currentModalAttendees.filter((r) => r.status === 'present').length;
  const modalAbsentCount = currentModalAttendees.filter((r) => r.status === 'absent').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-sm">
            <Megaphone className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">ข่าวสาร & ประกาศกิจกรรม</h1>
            <p className="text-xs text-slate-500 mt-1">
              ติดตามภารกิจงาน กำหนดการ และตรวจสอบรายชื่อสมาชิกที่ร่วมปฏิบัติหน้าที่
            </p>
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'ongoing', label: 'กำลังเกิดขึ้น' },
            { id: 'upcoming', label: 'กำลังจะมาถึง' },
            { id: 'completed', label: 'สิ้นสุดแล้ว' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event Cards Grid */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-3 shadow-sm">
          <Calendar className="w-10 h-10 mx-auto text-slate-300" />
          <p className="font-bold text-slate-700 text-base">ไม่พบกิจกรรมในหมวดหมู่นี้</p>
          <p className="text-xs text-slate-400">
            เมื่อแอดมินประกาศงานหรือกิจกรรมใหม่ ข้อมูลจะแสดงผลที่นี่ทันที
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((ev) => {
            const attendees = attendanceRecords.filter((r) => r.eventId === ev.id);
            const present = attendees.filter((r) => r.status === 'present').length;
            const absent = attendees.filter((r) => r.status === 'absent').length;

            return (
              <div
                key={ev.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{ev.title}</h3>
                    {getStatusBadge(ev.status)}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 font-mono">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{ev.date}</span>
                    </p>
                    {ev.time && (
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{ev.time}</span>
                      </p>
                    )}
                    {ev.location && (
                      <p className="flex items-center gap-2 font-sans">
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{ev.location}</span>
                      </p>
                    )}
                  </div>

                  {ev.description && (
                    <p className="text-xs text-slate-500 pt-1 leading-relaxed line-clamp-3">
                      {ev.description}
                    </p>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px]">
                        <UserCheck size={12} /> มา {present}
                      </span>
                      {absent > 0 && (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[11px]">
                          ลา {absent}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedEventModal(ev)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      ดูรายชื่อ ({attendees.length})
                    </button>
                  </div>

                  {ev.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('attendance')}
                      className="w-full bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <span>ไปที่หน้าลงชื่อเข้าร่วม</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: ดูรายชื่อผู้เข้าร่วมในกิจกรรม */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-800 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{selectedEventModal.title}</h3>
                  {getStatusBadge(selectedEventModal.status)}
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  วันที่ {selectedEventModal.date} {selectedEventModal.time ? `• เวลา ${selectedEventModal.time}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEventModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs shrink-0">
              <span className="text-slate-600">ลงชื่อแล้ว: <strong className="text-slate-900">{currentModalAttendees.length}</strong> คน</span>
              <span className="text-emerald-700 font-bold">มา: {modalPresentCount}</span>
              <span className="text-rose-700 font-bold">ลา: {modalAbsentCount}</span>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar border border-slate-100 rounded-2xl">
              {currentModalAttendees.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  ยังไม่มีสมาชิกรายงานตัวในกิจกรรมนี้
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="py-2.5 px-4">ชื่อ-นามสกุล</th>
                      <th className="py-2.5 px-3">รหัส</th>
                      <th className="py-2.5 px-3">สถานะ</th>
                      <th className="py-2.5 px-4">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentModalAttendees.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-bold text-slate-900">{att.studentName}</td>
                        <td className="py-3 px-3 font-mono text-slate-500">{att.studentId}</td>
                        <td className="py-3 px-3">
                          {att.status === 'present' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <CheckCircle2 size={12} /> มา
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <XCircle size={12} /> ลา
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">{att.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-2 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedEventModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsView;