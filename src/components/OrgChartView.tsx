import React, { useState, useEffect } from 'react';
import { useBorrow } from '../context/BorrowContext';
import { db } from '../lib/firebase';
import { MEMBERS_COLLECTION } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { 
  Users, Crown, Shield, Camera, Plus, Edit2, Trash2, 
  Search, UploadCloud, X, Save, User, Check 
} from 'lucide-react';

interface OrgMember {
  id: string;
  name: string;
  studentId: string;
  orgRole: string; // เช่น ประธานฝ่าย, หัวหน้าตากล้อง, ฝ่ายเสียง
  tier: 'executive' | 'lead' | 'member'; // ระดับผังองค์กร
  generation?: string; // รุ่น เช่น ED-TECH #15
  photoUrl?: string;
  bio?: string;
}

export const OrgChartView: React.FC = () => {
  const { isAdminLoggedIn, role } = useBorrow() as any;
  const isSuperAdmin = isAdminLoggedIn || role === 'admin';

  const [members, setMembers] = useState<OrgMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');

  // State Modal แอดมินจัดการสมาชิก
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<OrgMember, 'id'>>({
    name: '',
    studentId: '',
    orgRole: 'เจ้าหน้าที่โสตทัศนูปกรณ์',
    tier: 'member',
    generation: 'ED-TECH #2026',
    photoUrl: '',
    bio: '',
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, MEMBERS_COLLECTION || 'organization_members'), (snapshot) => {
      const docs: OrgMember[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as OrgMember));
      setMembers(docs);
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, MEMBERS_COLLECTION || 'organization_members', editingId), formData);
        alert('อัปเดตข้อมูลสมาชิกเรียบร้อย');
      } else {
        await addDoc(collection(db, MEMBERS_COLLECTION || 'organization_members'), formData);
        alert('เพิ่มสมาชิกใหม่เรียบร้อย');
      }
      setModalOpen(false);
      setEditingId(null);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`ยืนยันการลบ ${name} ออกจากผังองค์กร?`)) {
      await deleteDoc(doc(db, MEMBERS_COLLECTION || 'organization_members', id));
    }
  };

  // กรองสมาชิกตามค้นหาและระดับ
  const filtered = members.filter(m => {
    const matchesSearch = m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.orgRole?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = selectedTier === 'all' || m.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Organization Chart</span>
          </div>
          <h1 className="text-2xl font-black mt-1">ผังองค์กรและทำเนียบสมาชิก ED-TECH</h1>
          <p className="text-xs text-slate-400 mt-1">รายนามคณะกรรมการ ทีมงานช่างภาพ และฝ่ายเทคนิคโสตทัศนูปกรณ์ โรงเรียนวิสุทธรังษี</p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                name: '', studentId: '', orgRole: 'ช่างภาพ / สตรีมมิ่ง',
                tier: 'member', generation: 'ED-TECH #2026', photoUrl: '', bio: ''
              });
              setModalOpen(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มสมาชิกในผังองค์กร</span>
          </button>
        )}
      </div>

      {/* แถบค้นหาและตัวกรอง */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, ตำแหน่งในทีม..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'executive', 'lead', 'member'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTier(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                selectedTier === t 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t === 'all' && 'ทั้งหมด'}
              {t === 'executive' && 'ฝ่ายบริหาร/หัวหน้า'}
              {t === 'lead' && 'หัวหน้าฝ่ายย่อย'}
              {t === 'member' && 'ทีมงานปฏิบัติการ'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid แสดงการ์ดรูปโปรไฟล์สมาชิก */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((member) => (
          <div 
            key={member.id}
            className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col items-center text-center relative group"
          >
            {/* รูปโปรไฟล์ */}
            <div className="relative mb-3">
              {member.photoUrl ? (
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-100 shadow-inner"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center font-black text-2xl border-2 border-slate-100">
                  <User className="w-10 h-10" />
                </div>
              )}
              {member.tier === 'executive' && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white p-1 rounded-full shadow">
                  <Crown className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            <h3 className="font-bold text-slate-900 text-sm">{member.name}</h3>
            <p className="text-xs font-semibold text-indigo-600 mt-0.5">{member.orgRole}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-1">{member.generation || 'ED-TECH'}</p>

            {member.bio && (
              <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 px-2 italic">
                "{member.bio}"
              </p>
            )}

            {/* ปุ่มแก้ไข / ลบ (เฉพาะ Admin) */}
            {isSuperAdmin && (
              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => {
                    setEditingId(member.id);
                    setFormData({
                      name: member.name || '',
                      studentId: member.studentId || '',
                      orgRole: member.orgRole || '',
                      tier: member.tier || 'member',
                      generation: member.generation || '',
                      photoUrl: member.photoUrl || '',
                      bio: member.bio || '',
                    });
                    setModalOpen(true);
                  }}
                  className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-xl shadow-sm"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(member.id, member.name)}
                  className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-rose-600 rounded-xl shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal เพิ่ม/แก้ไขสมาชิก */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingId ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มสมาชิกใหม่ลงผังองค์กร'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ - นามสกุล</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  placeholder="เช่น นายกิตติศักดิ์ พรหมดี"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ตำแหน่งในทีม</label>
                  <input
                    type="text"
                    required
                    value={formData.orgRole}
                    onChange={(e) => setFormData({ ...formData, orgRole: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    placeholder="เช่น หัวหน้าฝ่ายกล้อง"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ระดับผังองค์กร</label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="executive">ฝ่ายบริหาร/ประธาน</option>
                    <option value="lead">หัวหน้าฝ่ายย่อย</option>
                    <option value="member">สมาชิกทั่วไป</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">URL รูปภาพสมาชิก (หรือลิงก์ Drive/Imgur)</label>
                <input
                  type="url"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">รุ่น / ข้อมูลสังกัด</label>
                <input
                  type="text"
                  value={formData.generation}
                  onChange={(e) => setFormData({ ...formData, generation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  placeholder="ED-TECH รุ่นที่ 15"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกข้อมูล</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};