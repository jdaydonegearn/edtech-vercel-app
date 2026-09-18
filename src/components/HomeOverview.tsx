import React from 'react';
import { useBorrow } from '../context/BorrowContext';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Users, 
  ArrowRight,
  LayoutDashboard,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export const HomeOverview: React.FC = () => {
  const { 
    equipment, 
    borrowRequests, 
    setActiveTab, 
    members, 
    attendanceRecords,
    role
  } = useBorrow();

  const totalEquipment = equipment.length;
  const availableEquipment = equipment.filter(e => e.status === 'available').length;
  const activeBorrows = borrowRequests.filter(r => ['approved', 'ready', 'borrowed'].includes(r.status)).length;
  
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendanceRecords.filter(r => r.date === today);
  const presentCount = todayAttendance.filter(r => r.status === 'present').length;

  const stats = [
    { label: 'อุปกรณ์ทั้งหมด', value: totalEquipment, icon: Package, color: 'bg-blue-500', tab: 'catalog' },
    { label: 'พร้อมใช้งาน', value: availableEquipment, icon: CheckCircle2, color: 'bg-emerald-500', tab: 'catalog' },
    { label: 'กำลังยืมอยู่', value: activeBorrows, icon: Clock, color: 'bg-amber-500', tab: 'dashboard' },
    { label: 'สมาชิกทั้งหมด', value: members.length, icon: Users, color: 'bg-indigo-500', tab: role === 'admin' ? 'admin' : 'attendance' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 md:p-12 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">ยินดีต้อนรับสู่ <span className="text-blue-400">ED-TECH</span></h1>
            <p className="text-slate-400 text-lg max-w-xl">ระบบบริหารจัดการอุปกรณ์และเช็คชื่อสมาชิกกลุ่มงานเทคโนโลยีการศึกษา โรงเรียนวิสุทธรังษี</p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button onClick={() => setActiveTab('catalog')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg">ยืมอุปกรณ์ <ArrowRight size={18} /></button>
              <button onClick={() => setActiveTab('attendance')} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold transition-all border border-slate-700">รายงานตัววันนี้ <Calendar size={18} /></button>
            </div>
          </div>
          <div className="hidden md:block opacity-20"><LayoutDashboard size={200} className="text-blue-400" /></div>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, idx) => (
          <motion.button key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} onClick={() => setActiveTab(stat.tab)} className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className={`p-3 rounded-xl ${stat.color} text-white mb-4 group-hover:scale-110 transition-transform`}><stat.icon size={24} /></div>
            <span className="text-sm font-medium text-slate-500 mb-1">{stat.label}</span>
            <span className="text-3xl font-black text-slate-900">{stat.value}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default HomeOverview;