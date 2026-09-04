import React, { useState } from 'react';
import { ShieldAlert, Sparkles, Lock, ArrowRight, UserCheck, ShieldCheck } from 'lucide-react';
import { useBorrow } from '../context/BorrowContext';
import { EdTechEmblem } from './EdTechLogo';

export const LoginGate: React.FC = () => {
  const { 
    authUser, 
    authLoading, 
    loginWithGoogle, 
    loginWithSchoolEmail,
    loginAsDemoStudent,
    loginAsDemoAdmin,
    domainErrorMsg, 
    setDomainErrorMsg,
    isFirebaseConnected
  } = useBorrow();

  const [inputEmail, setInputEmail] = useState('');
  const [inputName, setInputName] = useState('');

  if (authLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-100">
        <div className="w-20 h-20 rounded-3xl bg-black border border-slate-700 text-white flex items-center justify-center p-3 mb-4 shadow-xl shadow-black/50">
          <EdTechEmblem className="w-14 h-14 animate-pulse" />
        </div>
        <p className="text-sm font-bold text-slate-300 animate-pulse">กำลังตรวจสอบสถานะระบบและสิทธิ์การเข้าใช้งาน...</p>
      </div>
    );
  }

  if (authUser) {
    return null; // Already logged in with school email
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim()) return;
    loginWithSchoolEmail(inputEmail.trim(), inputName.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-8 shadow-2xl relative text-slate-800 space-y-6 text-center animate-scale-up my-auto">
        {/* Logo & Header */}
        <div className="space-y-4">
          <div className="w-24 h-24 bg-black rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-black/20 border border-slate-800 p-3">
            <EdTechEmblem className="w-16 h-16" colorMode="monochrome" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-300 text-slate-800 px-3 py-1 rounded-full text-xs font-bold font-mono">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>ED.TECH AUDIO-VISUAL</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
              ระบบยืม-คืนอุปกรณ์ ED-TECH
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed px-4 mt-1">
              โรงเรียนวิสุทธรังษี จังหวัดกาญจนบุรี<br />
              {isFirebaseConnected 
                ? 'กรุณาเข้าสู่ระบบด้วย Google โดยใช้อีเมลโรงเรียน (@visut.ac.th)'
                : 'ระบบทำงานในโหมดจัดเก็บข้อมูลในเครื่อง (ยกเลิกการเชื่อมต่อ Firebase)'}
            </p>
          </div>
        </div>

        {/* Firebase Disconnected Banner */}
        {!isFirebaseConnected && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-2xl text-xs space-y-1 text-left">
            <div className="flex items-center gap-2 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>📡 ปัจจุบันยกเลิกการเชื่อมต่อ Firebase แล้ว (Local Storage Mode)</span>
            </div>
            <p className="text-[11px] text-amber-700">
              ข้อมูลทั้งหมด (ของในคลัง, ประวัติการยืม, การอนุมัติ) จะบันทึกลงในเครื่องบราวเซอร์อย่างปลอดภัยและสามารถทำงานได้สมบูรณ์โดยไม่ต้องพึ่งพาเซิร์ฟเวอร์
            </p>
          </div>
        )}

        {/* Error Alert Box for invalid domain */}
        {domainErrorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs space-y-2 text-left shadow-sm">
            <div className="flex items-center gap-2 font-bold text-red-800 text-sm">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
              <span>ปฏิเสธการเข้าสู่ระบบ</span>
            </div>
            <p className="text-red-700 leading-relaxed font-semibold">
              ⚠️ {domainErrorMsg}
            </p>
            <p className="text-[11px] text-red-500">
              *(เฉพาะนักเรียน ครู และบุคลากรโรงเรียนวิสุทธรังษีที่ใช้อีเมล @visut.ac.th เท่านั้น)*
            </p>
            <button
              onClick={() => setDomainErrorMsg(null)}
              className="mt-1 text-[11px] bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg font-bold transition shadow-sm"
            >
              รับทราบ / ลองเข้าสู่ระบบอีกครั้ง
            </button>
          </div>
        )}

        {/* School Domain Rules Badge */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-left space-y-2 text-xs">
          <p className="font-bold text-slate-700 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" />
            <span>เงื่อนไขการเข้าใช้งานระบบ:</span>
          </p>
          <ul className="space-y-1.5 text-slate-600 pl-6 list-disc text-[11px]">
            <li>ต้องใช้อีเมลโรงเรียนที่ลงท้ายด้วย <strong className="text-amber-600 font-mono">@visut.ac.th</strong> เท่านั้น</li>
            <li>สิทธิ์นักเรียน/ครู: ดูรายการอุปกรณ์ ยื่นขอยืม และติดตามสถานะคำขอ</li>
            <li>สิทธิ์แอดมิน (<strong className="text-emerald-700 font-mono">43524@visut.ac.th, kachanon@visut.ac.th</strong>): จัดการคลังและอนุมัติคำขอ</li>
          </ul>
        </div>

        {/* Login Controls based on Firebase connection state */}
        {isFirebaseConnected ? (
          <button
            onClick={loginWithGoogle}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 px-6 rounded-2xl text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3 group active:scale-[0.98]"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.24 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.24 2.7 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span className="text-white">
              เข้าสู่ระบบด้วย Google (อีเมลโรงเรียน)
            </span>
          </button>
        ) : (
          <div className="space-y-4">
            {/* Email login form for Local Mode */}
            <form onSubmit={handleEmailSubmit} className="space-y-2 text-left">
              <label className="text-xs font-bold text-slate-700 block">
                ระบุอีเมลโรงเรียน @visut.ac.th เพื่อเข้าใช้งาน:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="เช่น 45102@visut.ac.th"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition"
                />
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition shrink-0"
                >
                  <span>เข้าสู่ระบบ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-2 text-[10px] text-slate-400 font-bold uppercase">หรือเลือกทดสอบด่วน</span>
            </div>

            {/* Quick Login Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={loginAsDemoStudent}
                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-3 rounded-xl text-xs border border-slate-200 transition"
              >
                <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>เข้าสู่ระบบแบบนักเรียน</span>
              </button>

              <button
                type="button"
                onClick={loginAsDemoAdmin}
                className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold py-2.5 px-3 rounded-xl text-xs border border-emerald-200 transition"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>เข้าสู่ระบบแบบแอดมิน</span>
              </button>
            </div>
          </div>
        )}

        <p className="text-[11px] text-slate-400">
          ระบบตรวจสอบสิทธิ์และโดเมนอย่างปลอดภัย @visut.ac.th
        </p>
      </div>
    </div>
  );
};
