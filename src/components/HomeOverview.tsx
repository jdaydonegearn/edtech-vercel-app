import { MorningRosterCard } from './MorningRosterCard';
import React, { useState } from 'react';
import { useBorrow } from '../context/BorrowContext';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Users, 
  ArrowRight,
  LayoutDashboard,
  Calendar,
  MapPin,
  Megaphone,
  XCircle,
  X,
  UserCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ClubEvent } from '../types';

export const HomeOverview: React.FC = () => {
  const { 
    equipment, 
    borrowRequests, 
    setActiveTab, 
    members, 
    attendanceRecords,
    events,
    role
  } = useBorrow();

  // State สำหรับเปิดดูรายชื่อผู้ลงชื่อในกิจกรรมนั้นๆ
  const [selectedEventModal, setSelectedEventModal] = useState<ClubEvent | null>(null);

  const totalEquipment = equipment.length;
  const availableEquipment = equipment.filter((e) => e.status === 'available').length;
  const activeBorrows = borrowRequests.filter((r) => ['approved', 'ready', 'borrowed'].includes(r.status)).length;

  const stats = [
    { label: 'อุปกรณ์ทั้งหมด', value: totalEquipment, icon: Package, color: 'bg-blue-500', tab: 'catalog' },
    { label: 'พร้อมใช้งาน', value: availableEquipment, icon: CheckCircle2, color: 'bg-emerald-500', tab: 'catalog' },
    { label: 'กำลังยืมอยู่', value: activeBorrows, icon: Clock, color: 'bg-amber-500', tab: 'dashboard' },
    { label: 'สมาชิกทั้งหมด', value: members.length, icon: Users, color: 'bg-indigo-500', tab: role === 'admin' ? 'admin' : 'attendance' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ongoing':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">● กำลังเกิดขึ้น</span>;
      case 'upcoming':
        return <span className="bg-blue-100 text-blue-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-blue-200">⏱️ กำลังจะเกิดขึ้น</span>;
      case 'completed':
        return <span className="bg-slate-100 text-slate-600 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-slate-200">✓ จบไปแล้ว</span>;
      default:
        return null;
    }
  };

  // ดึงรายชื่อคนที่ลงชื่อของกิจกรรมที่กำลังเปิดดูใน Modal
  const currentModalAttendees = selectedEventModal 
    ? attendanceRecords.filter((r) => r.eventId === selectedEventModal.id)
    : [];

  const modalPresentCount = currentModalAttendees.filter((r) => r.status === 'present').length;
  const modalAbsentCount = currentModalAttendees.filter((r) => r.status === 'absent').length;

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 md:p-12 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              ยินดีต้อนรับสู่ <span className="text-blue-400">ED-TECH</span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg max-w-xl">
              ระบบบริหารจัดการอุปกรณ์และเช็คชื่อสมาชิกกลุ่มงานเทคโนโลยีการศึกษา โรงเรียนวิสุทธรังษี
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button 
                onClick={() => setActiveTab('catalog')} 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition shadow-lg active:scale-95"
              >
                ยืมอุปกรณ์ <ArrowRight size={16} />
              </button>
              <button 
                onClick={() => setActiveTab('attendance')} 
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition border border-slate-700 active:scale-95"
              >
                เช็คชื่อเข้าร่วมงาน <Calendar size={16} />
              </button>
            </div>
          </div>
          <div className="hidden md:block opacity-20">
            <LayoutDashboard size={180} className="text-blue-400" />
          </div>
        </div>
      </section>

      {/* ตารางเวรตอนเช้าประจำวัน */}
      <MorningRosterCard />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, idx) => (
          <motion.button 
            key={stat.label} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: idx * 0.08 }} 
            onClick={() => setActiveTab(stat.tab)} 
            className="flex flex-col items-center text-center p-5 md:p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition group"
          >
            <div className={`p-3 rounded-xl ${stat.color} text-white mb-3 group-hover:scale-110 transition-transform`}>
              <stat.icon size={22} />
            </div>
            <span className="text-xs font-medium text-slate-500 mb-1">{stat.label}</span>
            <span className="text-2xl md:text-3xl font-black text-slate-900">{stat.value}</span>
          </motion.button>
        ))}
      </div>

      {/* Event Announcements Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">ประกาศกิจกรรมและภารกิจงาน</h2>
              <p className="text-xs text-slate-500">ตรวจสอบกำหนดการ และดูรายชื่อสมาชิกที่เข้าร่วมในแต่ละกิจกรรม</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
            ทั้งหมด {events.length} งาน
          </span>
        </div>

        {events.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 space-y-2">
            <Calendar className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">ยังไม่มีประกาศกิจกรรมในขณะนี้</p>
            <p className="text-xs">เมื่อแอดมินประกาศงาน รายละเอียดและรายชื่อผู้เข้าร่วมจะแสดงที่นี่</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((ev) => {
              const eventAttendees = attendanceRecords.filter((r) => r.eventId === ev.id);
              const presentCount = eventAttendees.filter((r) => r.status === 'present').length;
              const absentCount = eventAttendees.filter((r) => r.status === 'absent').length;

              return (
                <div 
                  key={ev.id} 
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-blue-300 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-base leading-snug">{ev.title}</h3>
                      {getStatusBadge(ev.status)}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 font-mono">
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{ev.date}</span>
                      </p>
                      {ev.time && (
                        <p className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{ev.time}</span>
                        </p>
                      )}
                      {ev.location && (
                        <p className="flex items-center gap-1.5 font-sans">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{ev.location}</span>
                        </p>
                      )}
                    </div>

                    {ev.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 pt-1">
                        {ev.description}
                      </p>
                    )}
                  </div>

                  {/* Footer Card: Stats & Action Button */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px]">
                        <UserCheck size={12} /> มา {presentCount}
                      </span>
                      {absentCount > 0 && (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[11px]">
                          ลา {absentCount}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedEventModal(ev)}
                      className="bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold px-3 py-1.5 rounded-xl transition text-[11px] border border-slate-200"
                    >
                      ดูรายชื่อ ({eventAttendees.length})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal: แสดงรายชื่อคนที่มาในกิจกรรมนั้นๆ */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-800 space-y-4 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
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

            {/* Summary Counters */}
            <div className="flex items-center gap-3 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs shrink-0">
              <span className="text-slate-600">ลงชื่อแล้วทั้งหมด: <strong className="text-slate-900">{currentModalAttendees.length}</strong> คน</span>
              <span className="text-emerald-700">มาเข้าร่วม: <strong>{modalPresentCount}</strong></span>
              <span className="text-rose-700">ลา / ไม่มา: <strong>{modalAbsentCount}</strong></span>
            </div>

            {/* Attendee List Table */}
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

            {/* Modal Close Button */}
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

export default HomeOverview;