import React, { useMemo, useState } from 'react';
import { useBorrow } from '../context/BorrowContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { MEMBERS_COLLECTION } from '../lib/firebase';
import { 
  Award, CheckCircle2, AlertTriangle, ShieldCheck, 
  Search, Edit3, Save, X, User, BarChart2
} from 'lucide-react';

interface MemberKpi {
  id: string;
  name: string;
  studentId: string;
  role: string;
  email?: string;
  userId?: string;
  attendedEvents: number;
  lateEvents: number;
  absentEvents: number;
  attendanceScore: number;
  adminScore: number;
  adminNote: string;
  totalScore: number;
  grade: 'A' | 'B' | 'C' | 'F';
}

export const KpiView: React.FC = () => {
  const { members = [], attendanceRecords = [], isAdminLoggedIn, role, authUser } = useBorrow() as any;
  const isSuperAdmin = isAdminLoggedIn || role === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [editingMember, setEditingMember] = useState<MemberKpi | null>(null);
  const [inputScore, setInputScore] = useState<number>(0);
  const [inputNote, setInputNote] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // คำนวณข้อมูล KPI
  const kpiData: MemberKpi[] = useMemo(() => {
    return members.map((member: any) => {
      const memberAttendances = attendanceRecords.filter(
        (rec: any) => rec.memberId === member.id || rec.studentId === member.studentId
      );

      const attended = memberAttendances.filter((r: any) => r.status === 'present').length;
      const late = memberAttendances.filter((r: any) => r.status === 'late').length;
      const absent = memberAttendances.filter((r: any) => r.status === 'absent').length;

      let attScore = (attended * 10) + (late * 5) - (absent * 5);
      attScore = Math.max(0, Math.min(50, attScore));

      const adminScore = Number(member.adminScore ?? 35);
      const adminNote = member.adminNote || 'ยังไม่มีบันทึกประเมิน';
      const totalScore = Math.min(100, Math.max(0, attScore + adminScore));

      let grade: 'A' | 'B' | 'C' | 'F' = 'F';
      if (totalScore >= 80) grade = 'A';
      else if (totalScore >= 70) grade = 'B';
      else if (totalScore >= 50) grade = 'C';

      return {
        id: member.id,
        name: member.name || member.fullName || 'ไม่ระบุชื่อ',
        studentId: member.studentId || '-',
        role: member.role || 'ทีมงาน',
        email: member.email,
        userId: member.userId,
        attendedEvents: attended,
        lateEvents: late,
        absentEvents: absent,
        attendanceScore: attScore,
        adminScore: adminScore,
        adminNote: adminNote,
        totalScore: totalScore,
        grade,
      };
    }).sort((a: MemberKpi, b: MemberKpi) => b.totalScore - a.totalScore);
  }, [members, attendanceRecords]);

  // หาข้อมูลของนักเรียนคนปัจจุบัน
  const myKpi = useMemo(() => {
    if (!authUser) return null;
    return kpiData.find(m => 
      (m.email && m.email.toLowerCase() === authUser.email?.toLowerCase()) ||
      (m.userId && m.userId === authUser.uid) ||
      (m.name && authUser.displayName && m.name.includes(authUser.displayName))
    ) || null;
  }, [kpiData, authUser]);

  const handleSaveScore = async () => {
    if (!editingMember) return;
    try {
      setSaving(true);
      const memberRef = doc(db, MEMBERS_COLLECTION || 'organization_members', editingMember.id);
      await updateDoc(memberRef, {
        adminScore: Number(inputScore),
        adminNote: inputNote.trim(),
        evaluatedAt: new Date().toISOString()
      });
      alert(`บันทึกคะแนนประเมินของ ${editingMember.name} สำเร็จ`);
      setEditingMember(null);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredKpi = kpiData.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.studentId.includes(searchTerm)
  );

  // -------------------------------------------------------------
  // มุมมองฝั่งนักเรียนทั่วไป (Student View)
  // -------------------------------------------------------------
  if (!isSuperAdmin) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <User className="w-4 h-4" />
            <span>Personal Evaluation</span>
          </div>
          <h1 className="text-2xl font-black mt-1">ผลการประเมินการปฏิบัติหน้าที่ของคุณ</h1>
          <p className="text-xs text-slate-400 mt-1">
            คะแนนประเมินรายบุคคลจากฐานการเข้าเวรและการประเมินของคณะกรรมการ
          </p>
        </div>

        {myKpi ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{myKpi.name}</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">รหัส: {myKpi.studentId} • ตำแหน่ง: {myKpi.role}</p>
              </div>
              <span className={`self-start sm:self-auto px-4 py-1.5 rounded-2xl text-sm font-black border ${
                myKpi.grade === 'A' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                myKpi.grade === 'B' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                myKpi.grade === 'C' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                เกรดระดับ {myKpi.grade}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-500">คะแนนการเข้างาน</span>
                <p className="text-2xl font-black text-slate-800 mt-1">{myKpi.attendanceScore} <span className="text-xs text-slate-400">/ 50</span></p>
                <p className="text-[10px] text-emerald-600 font-medium mt-1">ตรงเวลา {myKpi.attendedEvents} งาน</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-500">คะแนนประเมินหน้างาน</span>
                <p className="text-2xl font-black text-indigo-600 mt-1">{myKpi.adminScore} <span className="text-xs text-slate-400">/ 50</span></p>
                <p className="text-[10px] text-slate-400 mt-1">ประเมินโดยหัวหน้าฝ่าย</p>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-center">
                <span className="text-[11px] font-bold text-indigo-900">คะแนนรวมสุทธิ</span>
                <p className="text-2xl font-black text-indigo-700 mt-1">{myKpi.totalScore} <span className="text-xs text-indigo-400">/ 100</span></p>
                <p className="text-[10px] text-indigo-600 mt-1">เกณฑ์ขั้นต่ำ 50 คะแนน</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700 block mb-1">ความเห็นและคำแนะนำจากผู้ดูแลระบบ:</span>
              <p className="text-xs text-slate-600 italic">"{myKpi.adminNote}"</p>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">
            <BarChart2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold">ยังไม่พบข้อมูลประเมินของคุณในระบบ</p>
            <p className="text-xs text-slate-400 mt-1">กรุณาแจ้งแอดมินหรือหัวหน้าฝ่ายเพื่อลงทะเบียนรหัสนักเรียน</p>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // มุมมองภาพรวมเฉพาะแอดมิน (Admin Overview)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Executive KPI Dashboard</span>
          </div>
          <h1 className="text-2xl font-black mt-1">ภาพรวมคะแนน KPI สมาชิกทั้งหมด</h1>
          <p className="text-xs text-slate-400 mt-1">เกณฑ์คะแนน 100% = การเข้างาน (50) + ผู้ดูแลระบบประเมิน (50)</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-2xl text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase">สมาชิกทั้งหมด</p>
            <p className="text-lg font-black text-white">{kpiData.length} คน</p>
          </div>
        </div>
      </div>

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

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-4 px-4 text-center w-12">อันดับ</th>
                <th className="py-4 px-4">ชื่อ - รหัสนักเรียน</th>
                <th className="py-4 px-4 text-center">เข้าเวร (ครั้ง)</th>
                <th className="py-4 px-4 text-center">คะแนนเข้างาน (50)</th>
                <th className="py-4 px-4 text-center">คะแนนแอดมิน (50)</th>
                <th className="py-4 px-4">บันทึกประเมิน</th>
                <th className="py-4 px-4 text-center">คะแนนรวม</th>
                <th className="py-4 px-4 text-center">เกรด</th>
                <th className="py-4 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredKpi.map((member, index) => (
                <tr key={member.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-4 px-4 text-center font-bold">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-bold text-slate-900">{member.name}</p>
                    <p className="text-[10px] text-slate-400">{member.studentId} • {member.role}</p>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {member.attendedEvents}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center font-bold">{member.attendanceScore}</td>
                  <td className="py-4 px-4 text-center font-bold text-indigo-600">{member.adminScore}</td>
                  <td className="py-4 px-4 text-slate-500 max-w-xs truncate">
                    <span className="text-[11px] italic bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 block truncate">
                      "{member.adminNote}"
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center font-black text-sm text-slate-900">{member.totalScore}</td>
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
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => {
                        setEditingMember(member);
                        setInputScore(member.adminScore);
                        setInputNote(member.adminNote === 'ยังไม่มีบันทึกประเมิน' ? '' : member.adminNote);
                      }}
                      className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition"
                      title="ให้คะแนนประเมิน"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal ประเมินคะแนน */}
      {editingMember && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">ประเมินผลการทำงาน</h3>
                <p className="text-xs text-slate-500">{editingMember.name}</p>
              </div>
              <button onClick={() => setEditingMember(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  คะแนนแอดมินประเมิน (0 - 50)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={inputScore}
                    onChange={(e) => setInputScore(Number(e.target.value))}
                    className="flex-1 accent-indigo-600 cursor-pointer"
                  />
                  <span className="w-12 text-center py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-sm rounded-lg">
                    {inputScore}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">บันทึกความคิดเห็น</label>
                <textarea
                  rows={3}
                  value={inputNote}
                  onChange={(e) => setInputNote(e.target.value)}
                  placeholder="เช่น ปฏิบัติหน้าที่ได้ดี มีความรับผิดชอบ..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveScore}
                disabled={saving}
                className="flex-1 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'กำลังบันทึก...' : 'บันทึกคะแนน'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};