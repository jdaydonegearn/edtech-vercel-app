import React, { useState } from 'react';
import { User, CreditCard, Phone, CheckCircle, Sparkles, X } from 'lucide-react';
import { useBorrow } from '../../context/BorrowContext';

export const UserRegisterModal: React.FC = () => {
  const { 
    currentUser, 
    setCurrentUser, 
    showUserRegisterModal, 
    setShowUserRegisterModal 
  } = useBorrow();

  const [username, setUsername] = useState(currentUser?.username || '');
  const [studentId, setStudentId] = useState(currentUser?.studentId || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!showUserRegisterModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('กรุณากรอกชื่อผู้ใช้งาน หรือ ชื่อ-นามสกุล');
      return;
    }
    if (!studentId.trim()) {
      setErrorMsg('กรุณากรอกรหัสนักศึกษา');
      return;
    }

    setCurrentUser({
      username: username.trim(),
      studentId: studentId.trim(),
      phone: phone.trim() || '0800000000',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-800 space-y-5 animate-scale-up">
        {/* Allow close if profile already exists */}
        {currentUser && (
          <button
            onClick={() => setShowUserRegisterModal(false)}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition border border-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md border border-slate-800">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {currentUser ? 'แก้ไขข้อมูลส่วนตัว' : 'ยินดีต้อนรับสู่ระบบ ED-TECH'}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed px-2">
            {currentUser 
              ? 'อัปเดตข้อมูลผู้ยืมสำหรับใช้ในการทำรายการส่งขอยืมอุปกรณ์'
              : 'กรุณากรอก Username และรหัสนักศึกษาครั้งแรก เพื่อใช้ในการยืมอุปกรณ์'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2">
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-600" />
              <span>ชื่อผู้ใช้งาน / ชื่อ-นามสกุล (Username) <span className="text-blue-600">*</span></span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น นายทวีทรัพย์ ชังยืนยง"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-600" />
              <span>รหัสนักศึกษา <span className="text-blue-600">*</span></span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น 69122600114"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-600" />
              <span>เบอร์โทรศัพท์ติดต่อ</span>
            </label>
            <input
              type="tel"
              placeholder="เช่น 0933848058"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none transition"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 mt-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{currentUser ? 'บันทึกการแก้ไข' : 'เริ่มใช้งานระบบ'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
