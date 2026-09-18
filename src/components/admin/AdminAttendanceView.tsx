import React, { useState } from 'react';
import { useBorrow } from '../../context/BorrowContext';
import { Users, UserPlus, Trash2, Search, Calendar, X, Plus, CheckCircle2, XCircle } from 'lucide-react';

export const AdminAttendanceView: React.FC = () => {
  const { members, attendanceRecords, addMember, removeMember } = useBorrow();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter logic
  const filteredMembers = members.filter(
    (m) =>
      (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.studentId || '').includes(searchTerm)
  );

  const selectedDateAttendance = attendanceRecords.filter((r) => r.date === dateFilter);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !studentId.trim()) return;

    // Check duplicate studentId
    const exists = members.some((m) => m.studentId.trim() === studentId.trim());
    if (exists) {
      alert('รหัสนักเรียนนี้มีอยู่ในระบบแล้ว');
      return;
    }

    setIsSubmitting(true);
    try {
      await addMember({
        name: memberName.trim(),
        studentId: studentId.trim(),
      } as any);
      setMemberName('');
      setStudentId('');
      setIsAddModalOpen(false);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการเพิ่มสมาชิก: ' + (err?.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (window.confirm(`ยืนยันการลบสมาชิก "${name}" ออกจากระบบ?`)) {
      await removeMember(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>จัดการสมาชิกกลุ่มงาน ED-TECH</span>
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-mono font-bold">
              {members.length} คน
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            เพิ่ม รายชื่อสมาชิก รหัสนักเรียน และตรวจสอบประวัติการลงชื่อปฏิบัติงาน
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>เพิ่มสมาชิกใหม่</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรือ รหัสนักเรียน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 whitespace-nowrap">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>วันที่ตรวจเช็ค:</span>
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3.5 px-6">ชื่อ-นามสกุล</th>
                <th className="py-3.5 px-6">รหัสนักเรียน</th>
                <th className="py-3.5 px-6">สถานะวันที่ ({dateFilter})</th>
                <th className="py-3.5 px-6 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold">ไม่พบรายชื่อสมาชิก</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">กดปุ่ม "เพิ่มสมาชิกใหม่" ด้านบนเพื่อลงทะเบียนนักเรียนเข้าสู่ระบบ</p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                  const record = selectedDateAttendance.find((r) => r.studentId === m.studentId || r.memberId === m.id);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">{m.name}</td>
                      <td className="py-4 px-6 font-mono text-slate-600">{m.studentId}</td>
                      <td className="py-4 px-6">
                        {record ? (
                          record.status === 'present' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>มาเข้าร่วม</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>ลา / ไม่มา</span>
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full font-medium text-[11px]">
                            ยังไม่ลงชื่อ
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemove(m.id, m.name)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-xl transition border border-transparent hover:border-rose-200"
                          title="ลบสมาชิก"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: เพิ่มสมาชิกใหม่ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>เพิ่มสมาชิกใหม่</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="เช่น นายธนากร ใจดี"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รหัสนักเรียน (Student ID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="เช่น 45102"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white shadow-sm"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  * ใช้สำหรับล็อกอินและยืนยันตัวตนเวลาเช็คชื่อในระบบ
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกสมาชิก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendanceView;