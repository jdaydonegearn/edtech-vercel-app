import React, { useState } from 'react';
import { BorrowProvider, useBorrow } from './context/BorrowContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { CalendarView } from './components/CalendarView';
import { EquipmentCatalog } from './components/EquipmentCatalog';
import { DashboardView } from './components/DashboardView';
import { HomeOverview } from './components/HomeOverview';
import { AttendanceView } from './components/AttendanceView';
import { NewsView } from './components/NewsView';
import { CartDrawer } from './components/CartDrawer';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginModal } from './components/modals/AdminLoginModal';
import { RestoreHistoryModal } from './components/modals/RestoreHistoryModal';
import { LoginGate } from './components/LoginGate';

const AppContent: React.FC = () => {
  const { activeTab, realtimeNotice } = useBorrow();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans selection:bg-slate-900 selection:text-white relative">
      {/* Mandatory Firebase Auth Google Login Gate */}
      <LoginGate />
      {/* Realtime Toast Banner */}
      {realtimeNotice && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-slate-900 text-white font-extrabold text-xs px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span>{realtimeNotice}</span>
        </div>
      )}
      {/* Sidebar Navigation */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        mobileOpen={mobileSidebarOpen} 
        setMobileOpen={setMobileSidebarOpen} 
      />

      {/* Main Workspace Column */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        {/* Top Header Command Bar */}
        <TopBar onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />

        {/* Main Content View Frame */}
        <main className="flex-1 p-4 md:p-8 pb-24 lg:pb-12 max-w-7xl w-full mx-auto animate-fade-in">
          {activeTab === 'home' && <HomeOverview />}
          {activeTab === 'attendance' && <AttendanceView />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'catalog' && <EquipmentCatalog />}
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'news' && <NewsView />}
          {activeTab === 'admin' && <AdminDashboard />}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500 bg-white">
          <p>© 2026 ED-TECH Equipment Management System. โรงเรียนวิสุทธรังษี</p>
        </footer>
      </div>

      {/* Mobile Floating Bottom Bar */}
      <MobileBottomNav />

      {/* Slide-over Cart Drawer */}
      <CartDrawer />

      {/* Modals for Admin Login & Restore History */}
      <AdminLoginModal />
      <RestoreHistoryModal />
    </div>
  );
};

export default function App() {
  return (
    <BorrowProvider>
      <AppContent />
    </BorrowProvider>
  );
}

