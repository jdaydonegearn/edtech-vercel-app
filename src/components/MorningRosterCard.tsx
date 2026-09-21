import React, { useState, useEffect } from 'react';
import { useBorrow } from '../context/BorrowContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  Sun, Camera, Tv, Volume2, Film, LifeBuoy, Crown, 
  Settings, Save, X, Calendar as CalendarIcon, RefreshCw 
} from 'lucide-react';

const DAYS_TH = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

interface DailyRoleAssignment {
  leader: string;
  camera: string;
  ob: string; // Outside Broadcast
  sound: string; // Sound Engineer
  media: string;
  support: string;
}

const DEFAULT_ROSTER: Record<string, DailyRoleAssignment> = {
  monday: { leader: 'หัวหน้าเวร 1', camera: 'ตากล้อง 1', ob: 'OB 1', sound: 'ซาวด์ 1', media: 'มีเดีย 1', support: 'ซัพพอร์ต 1' },
  tuesday: { leader: 'หัวหน้าเวร 2', camera: 'ตากล้อง 2', ob: 'OB 2', sound: 'ซาวด์ 2', media: 'มีเดีย 2', support: 'ซัพพอร์ต 2' },
  wednesday: { leader: 'หัวหน้าเวร 3', camera: 'ตากล้อง 3', ob: 'OB 3', sound: 'ซาวด์ 3', media: 'มีเดีย 3', support: 'ซัพพอร์ต 3' },
  thursday: { leader: 'หัวหน้าเวร 4', camera: 'ตากล้อง 4', ob: 'OB 4', sound: 'ซาวด์ 4', media: 'มีเดีย 4', support: 'ซัพพอร์ต 4' },
  friday: { leader: 'หัวหน้าเวร 5', camera: 'ตากล้อง 5', ob: 'OB 5', sound: 'ซาวด์ 5', media: 'มีเดีย 5', support: 'ซัพพอร์ต 5' },
};

export const MorningRosterCard: React.FC = () => {
  const { isAdminLoggedIn, role } = useBorrow() as any;
  const isSuperAdmin = isAdminLoggedIn || role === 'admin';

  const [rosterData, setRosterData] = useState<Record<string, DailyRoleAssignment>>(DEFAULT_ROSTER);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRoster, setEditRoster] = useState(DEFAULT_ROSTER);

  // ดึงข้อมูลวันปัจจุบัน
  const today = new Date();
  const dayIndex = today.getDay(); // 0 = อาทิตย์, 1 = จันทร์, ..., 5 = ศุกร์
  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayKey = dayKeys[dayIndex];
  const isWeekend = dayIndex === 0 || dayIndex === 6;

  // คำนวณการสลับรายชื่อตามเดือน (Rotate ทุกๆ เดือน)
  const currentMonth = today.getMonth(); // 0-11
  
  // โหลดข้อมูลจาก Firestore
  useEffect(() => {
    const fetchRoster = async () => {
      try {
        const docRef = doc(db, 'morning_roster', 'weekly_schedule');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setRosterData(snap.data() as Record<string, DailyRoleAssignment>);
          setEditRoster(snap.data() as Record<string, DailyRoleAssignment>);
        }
      } catch (err) {
        console.error('Error fetching morning roster:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoster();
  }, []);

  const handleSaveRoster = async () => {
    try {
      setLoading(true);
      await setDoc(doc(db, 'morning_roster', 'weekly_schedule'), editRoster);
      setRosterData(editRoster);
      setIsEditModalOpen(false);
      alert('บันทึกตารางเวรเรียบร้อยแล้ว');
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ดึงเวรของวันนี้ (ถ้าเป็นเสาร์-อาทิตย์ ให้ดึงของวันจันทร์มาพรีวิว)
  const displayDayKey = isWeekend ? 'monday' : currentDayKey;
  const activeDuty = rosterData[displayDayKey] || DEFAULT_ROSTER.monday;

  const dutyRoles = [
    { key: 'leader', label: 'Leader ประจำวัน', name: activeDuty.leader, icon: Crown, color: 'text-amber-500 bg-amber-50 border-amber-200' },
    { key: 'camera', label: 'Camera', name: activeDuty.camera, icon: Camera, color: 'text-blue-500 bg-blue-50 border-blue-200' },
    { key: 'ob', label: 'Outside Broadcast (OB)', name: activeDuty.ob, icon: Tv, color: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
    { key: 'sound', label: 'Sound Engineer', name: activeDuty.sound, icon: Volume2, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
    { key: 'media', label: 'Media Control', name: activeDuty.media, icon: Film, color: 'text-purple-500 bg-purple-50 border-purple-200' },
    { key: 'support', label: 'Support & Standby', name: activeDuty.support, icon: LifeBuoy, color: 'text-rose-500 bg-rose-50 border-rose-200' },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white shadow-md">
            <Sun className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900">เวรปฏิบัติหน้าที่ตอนเช้า</h2>
              {isWeekend && (
                <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                  (พรีวิววันจันทร์)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              ประจำวัน{DAYS_TH[dayIndex]} ที่ {today.getDate()} / {today.getMonth() + 1} / {today.getFullYear() + 543}
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>จัดการตารางเวร</span>
          </button>
        )}
      </div>

      {/* Grid รายชื่อเวร 6 ตำแหน่ง */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
        {dutyRoles.map((roleItem, idx) => {
          const Icon = roleItem.icon;
          return (
            <div 
              key={idx} 
              className={`p-3 rounded-2xl border flex flex-col justify-between ${roleItem.color} transition hover:scale-[1.02]`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold opacity-80">{roleItem.label}</span>
                <Icon className="w-4 h-4 opacity-70" />
              </div>
              <p className="text-xs font-black text-slate-900 truncate">
                {roleItem.name || 'ยังไม่กำหนด'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Modal แก้ไขเวรประจำวัน (Admin Only) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">จัดการรายชื่อเวรเช้า (จันทร์ - ศุกร์)</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((dayKey) => {
                const dayLabelTh: Record<string, string> = {
                  monday: 'วันจันทร์', tuesday: 'วันอังคาร', wednesday: 'วันพุธ', thursday: 'วันพฤหัสบดี', friday: 'วันศุกร์'
                };
                const dayDuty = editRoster[dayKey] || DEFAULT_ROSTER.monday;

                return (
                  <div key={dayKey} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <p className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>{dayLabelTh[dayKey]}</span>
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(['leader', 'camera', 'ob', 'sound', 'media', 'support'] as const).map((pos) => (
                        <div key={pos}>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">{pos}</label>
                          <input
                            type="text"
                            value={dayDuty[pos] || ''}
                            onChange={(e) => {
                              setEditRoster({
                                ...editRoster,
                                [dayKey]: { ...dayDuty, [pos]: e.target.value }
                              });
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                            placeholder="ชื่อผู้ปฏิบัติหน้าที่"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveRoster}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกตารางเวรทั้งหมด</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};