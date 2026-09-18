import React, { useState } from 'react';
import { useBorrow } from '../context/BorrowContext';
import { CheckCircle2, XCircle, Calendar, Clock, MapPin } from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const { members, events, attendanceRecords, reportAttendance } = useBorrow();
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeEvent = events.find((e) => e.id === selectedEventId);
  const existingRecord = attendanceRecords.find(
    (r) => r.memberId === selectedMemberId && r.eventId === selectedEventId
  );

  const handleReport = async (status: 'present' | 'absent') => {
    if (!selectedMemberId) return alert('กรุณาเลือกรายชื่อของตนเอง');
    if (!selectedEventId) return alert('กรุณาเลือกกิจกรรมที่ต้องลงชื่อ');

    setIsSubmitting(true);
    try {
      await reportAttendance(status, selectedMemberId, selectedEventId, note);
      setNote('');
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + (err?.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ongoing':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 rounded-full font-bold border border-emerald-200">● กำลังเกิดขึ้น</span>;
      case 'upcoming':
        return <span className="bg-blue-100 text-blue-800 text-[11px] px-2 py-0.5 rounded-full font-bold border border-blue-200">⏱️ กำลังจะเกิดขึ้น</span>;
      case 'completed':
        return <span className="bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5 rounded-full font-bold border border-slate-200">✓ จบไปแล้ว</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">เช็คชื่อเข้าร่วมกิจกรรม ED-TECH</h2>
            <p className="text-xs text-slate-500">เลือกรายชื่อของตนเองและเลือกกิจกรรมที่เปิดให้รายงานตัว</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. เลือกรายชื่อของตนเอง <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="">-- กรุณาเลือกชื่อของคุณ --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.studentId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              2. เลือกกิจกรรม / งานที่ต้องลงชื่อ <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="">-- เลือกกิจกรรมที่เปิดให้รายงานตัว --</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  [{ev.date}] {ev.title} ({ev.status === 'ongoing' ? 'กำลังเกิดขึ้น' : ev.status === 'upcoming' ? 'กำลังจะเกิดขึ้น' : 'จบไปแล้ว'})
                </option>
              ))}
            </select>
          </div>

          {activeEvent && (
            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">{activeEvent.title}</h4>
                {getStatusBadge(activeEvent.status)}
              </div>
              <div className="flex flex-wrap gap-4 text-slate-600 text-[11px] font-mono">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-blue-600" /> {activeEvent.date}</span>
                {activeEvent.time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-600" /> {activeEvent.time}</span>}
                {activeEvent.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-600" /> {activeEvent.location}</span>}
              </div>
              {activeEvent.description && (
                <p className="text-slate-500 text-[11px] pt-1">{activeEvent.description}</p>
              )}
            </div>
          )}

          {selectedMemberId && selectedEventId && existingRecord ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-2">
              <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center bg-white shadow-sm">
                {existingRecord.status === 'present' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600" />
                )}
              </div>
              <p className="text-xs font-bold text-slate-900">
                คุณได้บันทึกกิจกรรมนี้แล้ว: {existingRecord.status === 'present' ? '✅ มาเข้าร่วม' : '❌ ลา / ไม่มา'}
              </p>
              {existingRecord.note && (
                <p className="text-[11px] text-slate-500">หมายเหตุ: {existingRecord.note}</p>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หมายเหตุเพิ่มเติม (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น เข้าสาย 15 นาที, ปฏิบัติงานฝ่ายเวที..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting || !selectedMemberId || !selectedEventId}
                  onClick={() => handleReport('present')}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm active:scale-95 disabled:opacity-40"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>มาเข้าร่วม</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || !selectedMemberId || !selectedEventId}
                  onClick={() => handleReport('absent')}
                  className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs border border-slate-200 transition active:scale-95 disabled:opacity-40"
                >
                  <XCircle className="w-4 h-4 text-slate-500" />
                  <span>ลา / ไม่มา</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceView;