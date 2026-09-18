import React, { useState } from 'react';
import { useBorrow } from '../../context/BorrowContext';
import { Users, Trash2 } from 'lucide-react';

export const AdminAttendanceView: React.FC = () => {
  const { members, attendanceRecords, removeMember } = useBorrow();
  const [searchTerm] = useState('');
  const [dateFilter] = useState(new Date().toISOString().split('T')[0]);

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.studentId.includes(searchTerm)
  );
  const todayAttendance = attendanceRecords.filter((r) => r.date === dateFilter);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
        <Users className="text-blue-600" /> จัดการสมาชิก
      </h2>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase font-bold">
              <th className="pb-4">ชื่อสมาชิก</th>
              <th className="pb-4">รหัสนักเรียน</th>
              <th className="pb-4">สถานะวันนี้</th>
              <th className="pb-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400 text-sm">
                  ไม่พบข้อมูลสมาชิก
                </td>
              </tr>
            ) : (
              filteredMembers.map((m) => {
                const record = todayAttendance.find((r) => r.memberId === m.id);
                return (
                  <tr key={m.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-4 font-bold text-slate-800">{m.name}</td>
                    <td className="py-4 text-slate-500">{m.studentId}</td>
                    <td className="py-4 text-sm">
                      {record ? (record.status === 'present' ? '✅ มา' : '❌ ไม่มา') : '⏳ ขาดการติดต่อ'}
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => removeMember(m.id)}
                        className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                        title="ลบสมาชิก"
                      >
                        <Trash2 size={16} />
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
  );
};

export default AdminAttendanceView;