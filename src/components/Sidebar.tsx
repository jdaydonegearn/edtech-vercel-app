import { Users } from 'lucide-react';
import React, { useState } from 'react';
import { 
  Calendar, 
  Newspaper, 
  Camera, 
  LayoutDashboard, 
  ShieldCheck, 
  User, 
  LogOut, 
  Edit3, 
  Key, 
  UserCheck, 
  ShieldAlert, 
  PanelLeftClose, 
  PanelLeftOpen, 
  ChevronRight,
  Radio,
  ShoppingBag,
  TrendingUp
} from 'lucide-react';
import { useBorrow } from '../context/BorrowContext';
import { EdTechEmblem } from './EdTechLogo';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed, 
  setCollapsed, 
  mobileOpen, 
  setMobileOpen 
}) => {
  const { 
    activeTab, 
    setActiveTab, 
    cart, 
    setIsCartOpen, 
    role, 
    toggleRole, 
    currentUser, 
    isAdminLoggedIn, 
    borrowRequests,
    authUser,
    logout
  } = useBorrow();

  const totalCartCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  // Filter pending or active user requests for badge count
  const myActiveRequests = borrowRequests.filter(
    (r) => r.status === 'pending' || r.status === 'approved' || r.status === 'ready' || r.status === 'borrowed'
  ).length;

  // Build navGroups conditionally (Admin menu only shown if isAdminLoggedIn = true)
  const navGroups = [
    {
      title: 'เมนูหลัก',
      items: [
        { id: 'home', label: 'ภาพรวมระบบ', icon: LayoutDashboard, badge: null },
        { id: 'attendance', label: 'เช็คชื่อสมาชิก', icon: UserCheck, badge: null },
        { id: 'kpi', label: 'ประเมินผล KPI', icon: TrendingUp, badge: null },
        { id: 'calendar', label: 'ปฏิทินการยืม', icon: Calendar, badge: null },
        { id: 'news', label: 'ข่าวสาร & ประกาศ', icon: Newspaper, badge: null },
        { id: 'org', label: 'ผังองค์กรสมาชิก', icon: Users, badge: null },
      ]
    },
    {
      title: 'บริการยืม-คืน',
      items: [
        { id: 'catalog', label: 'คลังอุปกรณ์ทั้งหมด', icon: Camera, badge: null },
        { id: 'dashboard', label: 'การยืมของฉัน', icon: ShoppingBag, badge: myActiveRequests > 0 ? myActiveRequests : null },
      ]
    },
    ...(isAdminLoggedIn
      ? [
          {
            title: 'ผู้ดูแลระบบ',
            items: [
              { 
                id: 'admin', 
                label: 'จัดการหลังบ้าน (Admin)', 
                icon: ShieldCheck, 
                statusTag: 'Authed' 
              },
            ]
          }
        ]
      : [])
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200 text-slate-800 flex flex-col justify-between transition-all duration-300 shadow-sm ${
          collapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header / Branding */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <button 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 group text-left transition overflow-hidden"
          >
            <div className="bg-black text-white p-1.5 rounded-2xl shadow-sm group-hover:scale-105 transition shrink-0 border border-slate-800 w-10 h-10 flex items-center justify-center">
              <EdTechEmblem className="w-7 h-7" colorMode="monochrome" />
            </div>

            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col whitespace-nowrap leading-none">
                <span className="font-extrabold text-sm tracking-wider text-slate-900 group-hover:text-blue-600 transition">
                  ED-TECH
                </span>
                <span className="text-[10px] tracking-[0.2em] text-slate-500 font-bold mt-1">
                  AUDIO-VISUAL
                </span>
              </div>
            )}
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition border border-slate-200"
            title={collapsed ? "ขยายแถบเมนู" : "ย่อแถบเมนู"}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Realtime Live Sync Status */}
        {(!collapsed || mobileOpen) && (
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span>Realtime Synced</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">v2.4</span>
          </div>
        )}

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {(!collapsed || mobileOpen) && (
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  {group.title}
                </p>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    title={collapsed && !mobileOpen ? item.label : undefined}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition group ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon 
                        className={`w-4 h-4 shrink-0 transition ${
                          isActive ? 'text-white scale-110' : 'text-slate-500 group-hover:text-slate-800'
                        }`} 
                      />
                      {(!collapsed || mobileOpen) && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>

                    {(!collapsed || mobileOpen) && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge !== null && item.badge !== undefined && (
                          <span className={`font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-sm ${
                            isActive ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-800'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        {item.statusTag && (
                          item.statusTag === 'Authed' ? (
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                              Authed
                            </span>
                          ) : (
                            <Key className="w-3 h-3 text-amber-500" />
                          )
                        )}
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer: User Profile & Controls */}
        <div className="p-3 border-t border-slate-200 bg-white space-y-3">
          {/* Cart Bag Quick Shortcut */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 p-2.5 rounded-xl transition flex items-center justify-between text-xs group shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-slate-700" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                    {totalCartCount}
                  </span>
                )}
              </div>
              {(!collapsed || mobileOpen) && (
                <span className="font-bold text-slate-700 group-hover:text-slate-900">ตระกร้าอุปกรณ์</span>
              )}
            </div>
            {(!collapsed || mobileOpen) && (
              <span className="font-extrabold text-slate-800 font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                {totalCartCount} ชิ้น
              </span>
            )}
          </button>

          {/* User Profile Card */}
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-2 shadow-sm">
            <div className="w-full flex items-center gap-2.5 text-left">
              {authUser?.photoURL ? (
                <img
                  src={authUser.photoURL}
                  alt={authUser.displayName || 'User'}
                  className="w-8 h-8 rounded-xl object-cover shrink-0 border border-slate-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}

              {(!collapsed || mobileOpen) && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-slate-900 truncate">
                    {authUser?.displayName || authUser?.email || 'ผู้ใช้งาน'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    {authUser?.email || '@visut.ac.th'}
                  </p>
                </div>
              )}
            </div>

            {/* Role Badge & Logout Button */}
            {(!collapsed || mobileOpen) && (
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-1.5">
                {isAdminLoggedIn ? (
                  <div className="flex-1 flex items-center gap-1.5 py-1 px-2 rounded-lg text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Admin ({authUser?.email ? authUser.email.split('@')[0] : 'ผู้ดูแลระบบ'})</span>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center gap-1.5 py-1 px-2 rounded-lg text-[10px] font-extrabold bg-slate-200 text-slate-800 border border-slate-300">
                    <User className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span className="truncate">นักเรียน/ครู</span>
                  </div>
                )}

                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 transition shrink-0 flex items-center gap-1 text-[10px] font-bold"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-600" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};