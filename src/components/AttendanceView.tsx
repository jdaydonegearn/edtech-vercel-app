import React, { useState } from 'react';
import { useBorrow } from '../context/BorrowContext';
import { CheckCircle2, XCircle, Clock, Calendar, AlertCircle } from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const { currentUser, authUser, reportAttendance, attendanceRecords } = useBorrow();
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const userStudentId = currentUser?.studentId || '';
  const myTodayRecord = attendanceRecords.find(
    (r) => r.date === today && (r.studentId === userStudentId || r.studentName === currentUser?.username)
  );

  const handleReport = async (status: 'present' | 'absent') => {
    setIsSubmitting(true);
    try {
      await reportAttendance(status, note);
      setNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">เช็คชื่อเข้าร่วมกิจกรรมประจำวัน</h2>
            <p className="text-xs text-slate-500">วันที่: {today}</p>
          </div>
        </div>

        {myTodayRecord ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-white shadow-sm">
              {myTodayRecord.status === 'present' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-600" />
              )}
            </div>
            <div>
              <p className="font-bold text-slate-900">
                คุณได้ลงชื่อเรียบร้อยแล้ว: {myTodayRecord.status === 'present' ? 'มาเข้าร่วม' : 'ลา / ไม่มา'}
              </p>
              {myTodayRecord.note && (
                <p className="text-xs text-slate-500 mt-1">หมายเหตุ: {myTodayRecord.note}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                หมายเหตุเพิ่มเติม (ถ้ามี)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น ติดคาบเรียน, เข้าสาย 10 นาที..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                disabled={isSubmitting}
                onClick={() => handleReport('present')}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-sm active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>มาเข้าร่วม</span>
              </button>
              <button
                disabled={isSubmitting}
                onClick={() => handleReport('absent')}
                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm border border-slate-200 transition active:scale-95 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 text-slate-500" />
                <span>ลา / ไม่มา</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default AttendanceView;