import React from 'react';
import { 
  Calendar, 
  Newspaper, 
  Camera, 
  LayoutDashboard, 
  ShoppingBag, 
  ShieldCheck 
} from 'lucide-react';
import { useBorrow } from '../context/BorrowContext';

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab, cart, setIsCartOpen, role } = useBorrow();

  const totalCartCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  const navItems = [
    { id: 'calendar', label: 'ปฏิทิน', icon: Calendar },
    { id: 'catalog', label: 'อุปกรณ์', icon: Camera },
    { id: 'dashboard', label: 'การยืม', icon: LayoutDashboard },
    { id: 'news', label: 'ข่าวสาร', icon: Newspaper },
    { id: 'admin', label: 'แอดมิน', icon: ShieldCheck },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-2 flex items-center justify-around shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition text-[10px] font-bold ${
              isActive
                ? 'text-slate-900 bg-slate-100 border border-slate-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-slate-900 scale-110' : 'text-slate-400'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}

      {/* Quick Cart Bag Dock Button */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-[10px] shadow-md hover:bg-slate-800"
      >
        <ShoppingBag className="w-4 h-4 mb-0.5 text-white" />
        <span>กระเป๋า</span>
        {totalCartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
            {totalCartCount}
          </span>
        )}
      </button>
    </nav>
  );
};
