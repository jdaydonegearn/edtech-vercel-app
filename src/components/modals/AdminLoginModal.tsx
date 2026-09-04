import React, { useState } from 'react';
import { ShieldCheck, Lock, KeyRound, Eye, EyeOff, AlertTriangle, X, User } from 'lucide-react';
import { useBorrow } from '../../context/BorrowContext';

export const AdminLoginModal: React.FC = () => {
  const { 
    showAdminLoginModal, 
    setShowAdminLoginModal, 
    adminLogin 
  } = useBorrow();

  const [username, setUsername] = useState('Krunon');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!showAdminLoginModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = adminLogin(username, password);
    if (!result.success) {
      setErrorMsg(result.message);
    } else {
      setPassword('');
    }
  };

  const handleFillDemoCreds = () => {
    setUsername('Krunon');
    setPassword('08082496');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-800 space-y-5 animate-scale-up">
        {/* Close Button */}
        <button
          onClick={() => setShowAdminLoginModal(false)}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-blue-600/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            เข้าสู่ระบบผู้ดูแลระบบ (Admin Login)
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed px-2">
            กรุณากรอก User และ Password สำหรับสิทธิ์การเพิ่ม ลบ และแก้ไขอุปกรณ์
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>User (ชื่อผู้ใช้ Admin) <span className="text-blue-600">*</span></span>
            </label>
            <input
              type="text"
              required
              placeholder="กรอกชื่อผู้ใช้ เช่น Krunon"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:bg-white transition shadow-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>Password (รหัสผ่าน Admin) <span className="text-blue-600">*</span></span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="กรอกรหัสผ่าน เช่น 08082496"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:bg-white transition shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Preset Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="text-slate-700 space-y-0.5">
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <KeyRound className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>User: <strong className="text-slate-900">Krunon</strong></span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] pl-5">
                <span>Pass: <strong className="text-slate-900">08082496</strong></span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleFillDemoCreds}
              className="text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1.5 rounded-lg font-bold transition shrink-0 shadow-sm"
            >
              เติมข้อมูลเข้าใช้
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>เข้าสู่ระบบ Admin</span>
          </button>
        </form>
      </div>
    </div>
  );
};
