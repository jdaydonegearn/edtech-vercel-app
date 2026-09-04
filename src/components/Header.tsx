import React from 'react';
import { ShoppingBag, Calendar, Newspaper, Camera, LayoutDashboard, ShieldCheck, UserCheck, ShieldAlert, User, LogOut, Edit3, Key } from 'lucide-react';
import { useBorrow } from '../context/BorrowContext';
import { EdTechEmblem } from './EdTechLogo';

export const Header: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    cart, 
    setIsCartOpen, 
    role, 
    toggleRole,
    currentUser,
    setShowUserRegisterModal,
    isAdminLoggedIn,
    adminLogout,
    setShowAdminLoginModal
  } = useBorrow();

  const totalCartCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  const navItems = [
    { id: 'calendar', label: 'ปฏิทิน', icon: Calendar },
    { id: 'news', label: 'ข่าวสาร', icon: Newspaper },
    { id: 'catalog', label: 'อุปกรณ์', icon: Camera },
    { id: 'dashboard', label: 'การยืมของฉัน', icon: LayoutDashboard },
  ];

  return (
    <header className="bg-white/95 border-b border-slate-200 sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between text-slate-800 shadow-sm backdrop-blur-md">
      {/* Brand / Logo ED-TECH */}
      <div className="flex items-center gap-8">
        <button 
          onClick={() => setActiveTab('calendar')}
          className="flex items-center gap-3 group text-left transition"
        >
          <div className="bg-black text-white font-black px-3 py-1.5 rounded-xl text-sm tracking-wider shadow-sm group-hover:scale-105 transition flex items-center gap-2 border border-slate-900">
            <EdTechEmblem className="w-5 h-5" colorMode="monochrome" />
            <span>ED-TECH</span>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xs tracking-[0.22em] text-slate-900 group-hover:text-slate-600 transition">AUDIO-VISUAL</span>
            <span className="text-[10px] tracking-[0.18em] text-slate-500 -mt-0.5 font-semibold">BORROW SYSTEM</span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}

          {/* Admin Tab Link */}
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition border ${
              activeTab === 'admin'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm font-bold'
                : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-slate-700" />
            <span>หลังบ้าน (Admin)</span>
            {isAdminLoggedIn ? (
              <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                Authed
              </span>
            ) : (
              <Key className="w-3 h-3 text-amber-600" />
            )}
          </button>
        </nav>
      </div>

      {/* Right Action Icons & Profile */}
      <div className="flex items-center gap-3">
        {/* User Profile Username Tag */}
        <button
          onClick={() => setShowUserRegisterModal(true)}
          className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-800 px-3 py-1.5 rounded-xl transition text-xs group"
          title="คลิกเพื่อแก้ไขชื่อผู้ใช้ / รหัสนักศึกษา"
        >
          <div className="w-6 h-6 rounded-lg bg-slate-200 border border-slate-300 text-slate-800 flex items-center justify-center font-bold shrink-0">
            <User className="w-3.5 h-3.5 text-slate-700" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-[11px] font-extrabold text-slate-900 leading-none flex items-center gap-1">
              <span>{currentUser?.username || 'ยังไม่ได้ระบุชื่อ'}</span>
              <Edit3 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
            </p>
            <p className="text-[9px] text-slate-500 font-mono mt-0.5 leading-none">
              {currentUser?.studentId ? `ID: ${currentUser.studentId}` : 'คลิกเพื่อตั้งชื่อ'}
            </p>
          </div>
        </button>

        {/* Role Toggle Switcher */}
        <button
          onClick={toggleRole}
          title={isAdminLoggedIn ? "ล็อกเอาต์หรือสลับโหมด" : "เข้าสู่ระบบแอดมิน"}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition ${
            role === 'admin'
              ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {role === 'admin' ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>โหมด: แอดมิน</span>
            </>
          ) : (
            <>
              <UserCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>โหมด: นักศึกษา</span>
            </>
          )}
        </button>

        {/* Admin Logout Button if logged in */}
        {isAdminLoggedIn && (
          <button
            onClick={adminLogout}
            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 transition"
            title="ออกจากระบบ Admin"
          >
            <LogOut className="w-4 h-4 text-red-600" />
          </button>
        )}

        {/* Equipment Cart Button */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 transition flex items-center justify-center group"
          title="กระเป๋าอุปกรณ์ของฉัน"
        >
          <ShoppingBag className="w-5 h-5 group-hover:text-slate-900 transition" />
          {totalCartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white font-extrabold text-[11px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              {totalCartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
