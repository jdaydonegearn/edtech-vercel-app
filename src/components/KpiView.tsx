import React, { useMemo, useState } from 'react';
import { useBorrow } from '../context/BorrowContext';
import { Award, CheckCircle2, Clock, AlertTriangle, ShieldCheck, UserCheck, TrendingUp, Search } from 'lucide-react';

interface MemberKpi {
  id: string;
  name: string;
  studentId: string;
  role: string;
  totalEvents: number;
  attendedEvents: number;
  lateEvents: number;
  absentEvents: number;
  attendanceRate: number;
  overdueCount: number;
  totalHours: number;
  kpiScore: number;
  grade: 'A' | 'B' | 'C' | 'F';
}

export const KpiView: React.FC = () => {
  // ดึงข้อมูลจริงจาก Context
  const { members = [], attendanceRecords = [], events = [], requests = [] } = useBorrow() as any;
  const [searchTerm, setSearchTerm] = useState('');

  const kpiData: MemberKpi[] = useMemo(() => {
    const totalPublishedEvents = events.length || 1;

    return members.map((member: any) => {
      // 1. ประมวลผลประวัติการเช็คชื่อ
      const memberAttendances = attendanceRecords.filter(
        (rec: any) => rec.memberId === member.id || rec.studentId === member.studentId
      );

      const attended = memberAttendances.filter((r: any) => r.status === 'present').length;
      const late = memberAttendances.filter((r: any) => r.status === 'late').length;
      const absent = memberAttendances.filter((r: any) => r.status === 'absent').length;
      const totalHours = memberAttendances.reduce((acc: number, curr: any) => acc + (Number(curr.hours) || 2), 0);

      // 2. ประมวลผลประวัติการยืมอุปกรณ์
      const memberRequests = requests.filter(
        (req: any) => req.studentId === member.studentId || req.userId === member.userId
      );
      const overdueCount = memberRequests.filter((r: any) => r.status === 'overdue').length;

      // 3. คำนวณคะแนน KPI (ฐานเริ่มต้น 50 คะแนน)
      let score = 50;
      score += attended * 10;
      score += late * 5;
      score -= absent * 10;
      score -= overdueCount * 15;
      if (totalHours >= 20) score += 10;

      // ล็อกช่วงคะแนน 0 - 100
      const finalScore = Math.min(100, Math.max(0, score));

      // 4. ตัดเกรด
      let grade: 'A' | 'B' | 'C' | 'F' = 'F';
      if (finalScore >= 85) grade = 'A';
      else if (finalScore >= 70) grade = 'B';
      else if (finalScore >= 50) grade = 'C';

      const attendanceRate = Math.round(((attended + late) / totalPublishedEvents) * 100);

      return {
        id: member.id,
        name: member.name || member.fullName || 'ไม่ระบุชื่อ',
        studentId: member.studentId || '-',
        role: member.role || 'ทีมงาน',
        totalEvents: totalPublishedEvents,
        attendedEvents: attended,
        lateEvents: late,
        absentEvents: absent,
        attendanceRate: isNaN(attendanceRate) ? 0 : attendanceRate,
        overdueCount,
        totalHours,
        kpiScore: finalScore,
        grade,
      };
    }).sort((a: MemberKpi, b: MemberKpi) => b.kpiScore - a.kpiScore);
  }, [members, attendanceRecords, events, requests]);

  const filteredKpi = kpiData.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.studentId.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header สรุปภาพรวม */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>ED-TECH Evaluation Metrics</span>
            </div>
            <h1 className="text-2xl font-black mt-1">ประเมินผล KPI & วินัยการปฏิบัติงาน</h1>
            <p className="text-xs text-slate-400 mt-1">เกณฑ์วัดผลการเข้าร่วมกิจกรรม ชั่วโมงการทำงาน และความรับผิดชอบต่องานโสตฯ</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-2xl text-center min-w-[90px]">
              <p className="text-[10px] text-slate-400 font-bold uppercase">สมาชิกทั้งหมด</p>
              <p className="text-xl font-black text-white">{kpiData.length}</p>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-800/50 p-3 rounded-2xl text-center min-w-[90px]">
              <p className="text-[10px] text-emerald-400 font-bold uppercase">เกรด A ดีเยี่ยม</p>
              <p className="text-xl font-black text-emerald-400">
                {kpiData.filter(m => m.grade === 'A').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ช่องค้นหา */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรือ รหัสนักเรียน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* ตารางแสดงผลรายบุคคล */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-4 px-4 text-center w-12">อันดับ</th>
                <th className="py-4 px-4">ชื่อ - รหัสนักเรียน</th>
                <th className="py-4 px-4 text-center">เข้างาน / ตรงเวลา</th>
                <th className="py-4 px-4 text-center">มาสาย / ขาด</th>
                <th className="py-4 px-4 text-center">ชั่วโมงสะสม</th>
                <th className="py-4 px-4 text-center">คืนของช้า</th>
                <th className="py-4 px-4 text-center">คะแนน KPI</th>
                <th className="py-4 px-4 text-center">ระดับผลงาน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredKpi.map((member, index) => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-4 px-4 text-center">
                    {index === 0 && <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-600 rounded-full font-black text-xs">🥇</span>}
                    {index === 1 && <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-200 text-slate-600 rounded-full font-black text-xs">🥈</span>}
                    {index === 2 && <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-700/20 text-amber-800 rounded-full font-black text-xs">🥉</span>}
                    {index > 2 && <span className="text-slate-400 font-bold">{index + 1}</span>}
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-bold text-slate-900">{member.name}</p>
                    <p className="text-[10px] text-slate-400">{member.studentId} • {member.role}</p>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                      <CheckCircle2 className="w-3 h-3" /> {member.attendedEvents} งาน
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center space-x-1">
                    <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md text-[11px] font-bold">
                      สาย {member.lateEvents}
                    </span>
                    <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md text-[11px] font-bold">
                      ขาด {member.absentEvents}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-slate-800">
                    {member.totalHours} ชม.
                  </td>
                  <td className="py-4 px-4 text-center">
                    {member.overdueCount > 0 ? (
                      <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" /> {member.overdueCount} ครั้ง
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-black text-sm text-indigo-600">{member.kpiScore}</span>
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-1.5 rounded-full" 
                          style={{ width: `${member.kpiScore}%` }} 
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                      member.grade === 'A' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      member.grade === 'B' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      member.grade === 'C' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      เกรด {member.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};