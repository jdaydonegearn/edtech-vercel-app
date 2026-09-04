import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Calendar, 
  Newspaper, 
  Camera, 
  LayoutDashboard, 
  ShieldCheck, 
  ShoppingBag, 
  Clock, 
  X, 
  Sparkles,
  User,
  LogOut
} from 'lucide-react';
import { useBorrow } from '../context/BorrowContext';

interface TopBarProps {
  onOpenMobileSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileSidebar }) => {
  const { 
    activeTab, 
    cart, 
    setIsCartOpen, 
    searchQuery, 
    setSearchQuery, 
    currentUser, 
    isAdminLoggedIn,
    authUser,
    logout
  } = useBorrow();

  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalCartCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  const getPageDetails = () => {
    switch (activeTab) {
      case 'calendar':
        return {
          title: 'ปฏิทินการยืมอุปกรณ์',
          subtitle: 'ตรวจสอบสถานะคิวการยืมล่วงหน้าและการจองตามวันเวลา',
          icon: Calendar,
        };
      case 'catalog':
        return {
          title: 'คลังอุปกรณ์ทั้งหมด',
          subtitle: 'รายการกล้อง เลนส์ ไมโครโฟน และอุปกรณ์การศึกษา ED-TECH',
          icon: Camera,
        };
      case 'dashboard':
        return {
          title: 'รายการยืมของฉัน',
          subtitle: 'ตรวจสอบสถานะคำขอ รหัสคิว แท็กโค้ด และประวัติการคืน',
          icon: LayoutDashboard,
        };
      case 'news':
        return {
          title: 'ข่าวสาร & ประกาศ',
          subtitle: 'อัปเดตระเบียบการยืม-คืน ข้อมูลอุปกรณ์ใหม่ และวันหยุดทำการ',
          icon: Newspaper,
        };
      case 'admin':
        return {
          title: 'ศูนย์จัดการหลังบ้าน (Admin Console)',
          subtitle: 'อนุมัติคำขอ เช็คอิน-เช็คเอาต์ จัดการคลังอุปกรณ์ และรายงานสรุป',
          icon: ShieldCheck,
        };
      default:
        return {
          title: 'ระบบยืม-คืนอุปกรณ์',
          subtitle: 'ศูนย์บริหารจัดการอุปกรณ์ ED-TECH',
          icon: Sparkles,
        };
    }
  };

  const page = getPageDetails();
  const PageIcon = page.icon;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 py-3.5 flex items-center justify-between text-slate-800 shadow-sm">
      {/* Left: Mobile Toggle + Breadcrumb & Title */}
      <div className="flex items-center gap-4">
        {/* Mobile Sidebar Hamburger */}
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          title="เปิดเมนูหลัก"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>

        {/* Page Title & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center shrink-0 shadow-sm">
            <PageIcon className="w-5 h-5 animate-scale-up" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{page.title}</span>
              {activeTab === 'admin' && (
                <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-mono font-bold">
                  ADMIN
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block truncate max-w-md">
              {page.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Search Input + Live Clock + User Profile + Cart Bag Button */}
      <div className="flex items-center gap-3">
        {/* Global Quick Search Input (shows on catalog & dashboard & admin) */}
        {(activeTab === 'catalog' || activeTab === 'dashboard' || activeTab === 'admin') && (
          <div className="relative hidden md:block w-48 lg:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาอุปกรณ์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 text-xs text-slate-800 placeholder-slate-400 pl-9 pr-8 py-2 rounded-xl focus:outline-none transition focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Live Clock Display */}
        <div className="hidden xl:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-700">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{timeString || '12:00:00'}</span>
        </div>

        {/* User Account & Role Badge */}
        {authUser && (
          <div className="flex items-center gap-2">
            {/* User Info & Role Badge */}
            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              {authUser.photoURL ? (
                <img
                  src={authUser.photoURL}
                  alt={authUser.displayName || 'User'}
                  className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  <User className="w-3 h-3" />
                </div>
              )}
              <span className="font-bold text-slate-800 max-w-[120px] lg:max-w-[160px] truncate">
                {authUser.displayName || authUser.email}
              </span>
              {isAdminLoggedIn ? (
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase font-mono">
                  ADMIN
                </span>
              ) : (
                <span className="bg-slate-200 text-slate-700 border border-slate-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase font-mono">
                  @visut.ac.th
                </span>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border border-red-200 px-3 py-2 rounded-xl transition text-xs font-extrabold shadow-sm shrink-0"
              title="ออกจากระบบ"
            >
              <LogOut className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>ออกจากระบบ (Logout)</span>
            </button>
          </div>
        )}

        {/* Equipment Cart Bag Action Button */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold shadow-sm transition flex items-center gap-2 group"
          title="เปิดกระเป๋าอุปกรณ์"
        >
          <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition" />
          <span className="text-xs hidden sm:inline">ตระกร้า</span>
          {totalCartCount > 0 && (
            <span className="bg-blue-600 text-white font-black text-[11px] px-1.5 py-0.2 rounded-full min-w-[20px] text-center shadow-sm">
              {totalCartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
