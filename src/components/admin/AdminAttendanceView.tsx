import React, { useState } from 'react';
import { useBorrow } from '../../context/BorrowContext';
import { Users, UserPlus, Trash2, Calendar, Plus, Megaphone, Clock, MapPin } from 'lucide-react';
import { EventStatus } from '../../types';

export const AdminAttendanceView: React.FC = () => {
  const { members, events, attendanceRecords, addMember, removeMember, addEvent, updateEventStatus, deleteEvent } = useBorrow();
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'events' | 'members'>('attendance');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all');

  // Modal สมาชิก
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [studentId, setStudentId] = useState('');

  // Modal กิจกรรม
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState('08:30 - 16:30');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventStatus, setEventStatus] = useState<EventStatus>('upcoming');

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !studentId.trim()) return;
    await addMember({ name: memberName.trim(), studentId: studentId.trim() } as any);
    setMemberName('');
    setStudentId('');
    setIsAddMemberOpen(false);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    await addEvent({
      title: eventTitle.trim(),
      date: eventDate,
      time: eventTime,
      location: eventLocation,
      description: eventDesc,
      status: eventStatus,
    });
    setEventTitle('');
    setEventLocation('');
    setEventDesc('');
    setIsAddEventOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
              activeSubTab === 'attendance'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            📋 ตรวจสอบการลงชื่อ
          </button>
          <button
            onClick={() => setActiveSubTab('events')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
              activeSubTab === 'events'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            📢 จัดการกิจกรรม ({events.length})
          </button>
          <button
            onClick={() => setActiveSubTab('members')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
              activeSubTab === 'members'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            👥 รายชื่อสมาชิก ({members.length})
          </button>
        </div>

        {activeSubTab === 'events' && (
          <button
            onClick={() => setIsAddEventOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> <span>ประกาศกิจกรรมใหม่</span>
          </button>
        )}

        {activeSubTab === 'members' && (
          <button
            onClick={() => setIsAddMemberOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> <span>เพิ่มสมาชิกใหม่</span>
          </button>
        )}
      </div>

      {/* VIEW 1: ตรวจสอบการลงชื่อ */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-700">เลือกกิจกรรมที่ต้องการดู:</span>
            <select
              value={selectedEventFilter}
              onChange={(e) => setSelectedEventFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
            >
              <option value="all">แสดงทุกกิจกรรม</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  [{ev.date}] {ev.title}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-3 px-6">ชื่อ-นามสกุล</th>
                  <th className="py-3 px-6">รหัสนักเรียน</th>
                  <th className="py-3 px-6">กิจกรรม</th>
                  <th className="py-3 px-6">สถานะ</th>
                  <th className="py-3 px-6">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">ยังไม่มีบันทึกการเช็คชื่อ</td>
                  </tr>
                ) : (
                  attendanceRecords
                    .filter((r) => selectedEventFilter === 'all' || r.eventId === selectedEventFilter)
                    .map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-6 font-bold text-slate-900">{rec.studentName}</td>
                        <td className="py-3.5 px-6 font-mono text-slate-500">{rec.studentId}</td>
                        <td className="py-3.5 px-6 font-medium text-slate-700">{rec.eventTitle || '-'}</td>
                        <td className="py-3.5 px-6">
                          {rec.status === 'present' ? (
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-bold text-[10px]">
                              ✅ มาเข้าร่วม
                            </span>
                          ) : (
                            <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full font-bold text-[10px]">
                              ❌ ไม่มา / ลา
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-slate-500">{rec.note || '-'}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: จัดการกิจกรรม */}
      {activeSubTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">
              ยังไม่มีกิจกรรมที่ประกาศ กดปุ่ม "ประกาศกิจกรรมใหม่" ด้านบนเพื่อเริ่มต้น
            </div>
          ) : (
            events.map((ev) => (
              <div key={ev.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{ev.title}</h3>
                  <button onClick={() => deleteEvent(ev.id)} className="text-slate-400 hover:text-rose-600 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-slate-500 font-mono space-y-1">
                  <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-600" /> {ev.date}</p>
                  {ev.time && <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-600" /> {ev.time}</p>}
                  {ev.location && <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-600" /> {ev.location}</p>}
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-bold">สถานะงาน:</span>
                  <select
                    value={ev.status}
                    onChange={(e) => updateEventStatus(ev.id, e.target.value as EventStatus)}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800"
                  >
                    <option value="upcoming">⏱️ กำลังจะเกิดขึ้น</option>
                    <option value="ongoing">● กำลังเกิดขึ้น</option>
                    <option value="completed">✓ จบไปแล้ว</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW 3: รายชื่อสมาชิก */}
      {activeSubTab === 'members' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-3 px-6">ชื่อสมาชิก</th>
                <th className="py-3 px-6">รหัสนักเรียน</th>
                <th className="py-3 px-6 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400">ยังไม่มีรายชื่อสมาชิก</td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-6 font-bold text-slate-900">{m.name}</td>
                    <td className="py-3.5 px-6 font-mono text-slate-500">{m.studentId}</td>
                    <td className="py-3.5 px-6 text-right">
                      <button onClick={() => removeMember(m.id)} className="text-rose-500 hover:text-rose-700 p-1.5 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal เพิ่มสมาชิก */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleAddMember} className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-slate-800">
            <h3 className="font-bold text-base text-slate-900">เพิ่มสมาชิกใหม่</h3>
            <input
              type="text"
              required
              placeholder="ชื่อ-นามสกุล"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
            />
            <input
              type="text"
              required
              placeholder="รหัสนักเรียน"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsAddMemberOpen(false)} className="px-3 py-2 text-xs font-bold text-slate-500">ยกเลิก</button>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">บันทึก</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal ประกาศกิจกรรมใหม่ */}
      {isAddEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleAddEvent} className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-800">
            <h3 className="font-bold text-base text-slate-900">ประกาศกิจกรรมใหม่</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ชื่องาน / กิจกรรม *</label>
              <input
                type="text"
                required
                placeholder="เช่น ถ่ายทอดสดพิธีไหว้ครู 2569"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">วันที่ *</label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">เวลา</label>
                <input
                  type="text"
                  placeholder="เช่น 08:30 - 16:30"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">สถานที่</label>
              <input
                type="text"
                placeholder="เช่น หอประชุมใหญ่"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">สถานะกิจกรรม</label>
              <select
                value={eventStatus}
                onChange={(e) => setEventStatus(e.target.value as EventStatus)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
              >
                <option value="upcoming">⏱️ กำลังจะเกิดขึ้น</option>
                <option value="ongoing">● กำลังเกิดขึ้น</option>
                <option value="completed">✓ จบไปแล้ว</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsAddEventOpen(false)} className="px-3 py-2 text-xs font-bold text-slate-500">ยกเลิก</button>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">ประกาศกิจกรรม</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminAttendanceView;