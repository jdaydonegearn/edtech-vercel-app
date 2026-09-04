import React, { useState } from 'react';
import { Search, ShoppingBag, Calendar as CalendarIcon, AlertCircle, Ban, CheckCircle2, Check, ArrowRight, ShieldCheck, Plus, Package, RotateCcw } from 'lucide-react';
import { useBorrow } from '../context/BorrowContext';
import { EquipmentCategory } from '../types';

export const EquipmentCatalog: React.FC = () => {
  const { 
    equipment, 
    searchQuery, 
    setSearchQuery, 
    selectedCategory, 
    setSelectedCategory,
    addToCart,
    periodFilter,
    setPeriodFilter,
    cart,
    setIsCartOpen,
    isAdminLoggedIn,
    setActiveTab,
    setShowAdminLoginModal,
    refreshData,
    isFirebaseConnected
  } = useBorrow();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await refreshData();
      if (res?.success) {
        setToastMessage(`✅ ดึงข้อมูลสำเร็จ: อุปกรณ์ ${res.count} รายการ`);
      } else if (res?.error) {
        setToastMessage(res.error);
      }
    } catch {
      setToastMessage('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleAddToCart = (eqId: string, eqName: string) => {
    addToCart(eqId);
    setToastMessage(`เพิ่ม "${eqName}" ลงกระเป๋าเรียบร้อยแล้ว`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const categories: (EquipmentCategory | 'ทั้งหมด')[] = [
    'ทั้งหมด',
    'กล้อง',
    'เลนส์',
    'อุปกรณ์เสริมกล้อง',
    'กิมบอล',
    'โดรน',
    'เสียง',
    'ไฟ',
    'อุปกรณ์เสริมไฟ',
    'ขาตั้ง',
    'อื่นๆ',
  ];

  // Category Icon Mapping
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'กล้อง': return '📷';
      case 'เลนส์': return '🔍';
      case 'อุปกรณ์เสริมกล้อง': return '🎬';
      case 'กิมบอล': return '📹';
      case 'โดรน': return '✈️';
      case 'เสียง': return '🎙️';
      case 'ไฟ': return '💡';
      case 'อุปกรณ์เสริมไฟ': return '✨';
      case 'ขาตั้ง': return '📐';
      default: return '📦';
    }
  };

  // Filter equipment based on Category and Search Query
  const filteredEquipment = equipment.filter((item) => {
    const matchesCategory = selectedCategory === 'ทั้งหมด' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Get item quantity already in cart
  const getItemCartQty = (eqId: string) => {
    const found = cart.find((c) => c.equipmentId === eqId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto text-slate-800">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            อุปกรณ์ทั้งหมด
          </h1>
          <p className="text-slate-500 text-sm mt-1">เลือกอุปกรณ์ที่ต้องการยืมสำหรับโปรเจกต์ของคุณ</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Refresh / Sync Firebase Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-60"
            title={isFirebaseConnected ? "ดึงข้อมูลล่าสุดจาก Firebase" : "รีเฟรชข้อมูล (Local)"}
          >
            <RotateCcw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'กำลังดึง...' : 'ดึงจาก Firebase'}</span>
          </button>

          {/* Admin Management Quick Action */}
          {isAdminLoggedIn ? (
            <button
              onClick={() => setActiveTab('admin')}
              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-sm"
              title="ไปที่หน้าจัดการคลังอุปกรณ์หลังบ้าน"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>จัดการคลังอุปกรณ์ (Admin)</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAdminLoginModal(true)}
              className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-400 text-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-sm"
              title="เข้าสู่ระบบ Admin เพื่อเพิ่ม ลบ หรือแก้ไขอุปกรณ์"
            >
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <span>เข้าสู่ระบบ Admin</span>
            </button>
          )}

          {/* Period Picker Header Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs flex items-center gap-3 shadow-sm">
            <div className="flex items-center gap-1.5 text-slate-500">
              <CalendarIcon className="w-4 h-4 text-slate-600" />
              <span className="font-medium hidden sm:inline">ช่วงเวลา (Period)</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={periodFilter.startDate}
                onChange={(e) => setPeriodFilter({ ...periodFilter, startDate: e.target.value })}
                className="bg-slate-50 text-slate-800 px-2 py-1 rounded border border-slate-200 font-mono focus:outline-none focus:border-slate-400 focus:bg-white"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={periodFilter.endDate}
                onChange={(e) => setPeriodFilter({ ...periodFilter, endDate: e.target.value })}
                className="bg-slate-50 text-slate-800 px-2 py-1 rounded border border-slate-200 font-mono focus:outline-none focus:border-slate-400 focus:bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="mb-6 relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="ค้นหาอุปกรณ์..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 focus:border-slate-400 rounded-full pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition shadow-sm"
        />
      </div>

      {/* Category Filter Horizontal Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 custom-scrollbar scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
              }`}
            >
              <span>{getCategoryIcon(cat)}</span>
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Equipment Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {equipment.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">ยังไม่มีรายการอุปกรณ์ในระบบ</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                ขณะนี้ยังไม่มีอุปกรณ์เปิดให้ยืม หรือแอดมินกำลังอัปเดตรายการอุปกรณ์
              </p>
            </div>
            {isAdminLoggedIn ? (
              <button
                onClick={() => setActiveTab('admin')}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>ไปที่หน้าจัดการคลังเพื่อเพิ่มอุปกรณ์</span>
              </button>
            ) : null}
          </div>
        ) : filteredEquipment.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
            <Ban className="w-10 h-10 mx-auto text-slate-400" />
            <div>
              <p className="text-sm font-bold text-slate-800">ไม่พบอุปกรณ์ที่ตรงกับการค้นหา</p>
              <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือกดปุ่มด้านล่างเพื่อแสดงอุปกรณ์ทั้งหมด</p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ทั้งหมด');
              }}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs border border-slate-200 transition shadow-sm"
            >
              <span>ล้างตัวกรองและแสดงทั้งหมด</span>
            </button>
          </div>
        ) : (
          filteredEquipment.map((item) => {
            const isBroken = item.status === 'broken' || item.status === 'maintenance';
            const availableQty = item.availableQuantity;
            const inCartQty = getItemCartQty(item.id);
            const canAdd = !isBroken && availableQty > 0 && inCartQty < availableQty;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-2xl p-5 flex flex-col justify-between transition shadow-sm group relative overflow-hidden"
              >
                <div>
                  {/* Title and Category Tag */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-slate-700 transition">
                      {item.name}
                    </h3>
                  </div>

                  <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2 font-mono">
                    {item.categoryEnglish || item.category}
                  </p>

                  {/* Status Badges (Maintenance/Broken) */}
                  {isBroken && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold">
                        <AlertCircle className="w-3 h-3" />
                        ชำรุด
                      </span>
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                        <Ban className="w-3 h-3" />
                        งดให้บริการ
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] mb-4">
                    {item.description || 'ไม่มีรายละเอียด'}
                  </p>
                </div>

                {/* Bottom Row: Stock status & Add button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Availability indicator */}
                  <div>
                    {isBroken ? (
                      <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
                        ชำรุด / Broken
                      </span>
                    ) : availableQty > 0 ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ว่าง {availableQty} ชิ้น
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-700">
                        ถูกยืมหมดแล้ว
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  {isBroken || availableQty === 0 ? (
                    <button
                      disabled
                      className="bg-slate-100 text-slate-400 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-not-allowed"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      ไม่สามารถยืมได้
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(item.id, item.name)}
                      disabled={!canAdd}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                        canAdd
                          ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm active:scale-95 font-bold'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{inCartQty > 0 ? `ในกระเป๋า (${inCartQty})` : 'เพิ่มลงกระเป๋า'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Subtle Floating Toast Notification when item added */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-slate-200 text-slate-900 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in backdrop-blur-md">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">{toastMessage}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">กดที่ไอคอนกระเป๋าด้านบนเมื่อพร้อมตรวจสอบรายการยืม</p>
          </div>
        </div>
      )}

      {/* Floating Bottom Cart Quick Trigger Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 border border-slate-200 backdrop-blur-md rounded-2xl px-5 py-3 shadow-xl flex items-center gap-4 text-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </div>
            <span className="text-xs font-bold text-slate-700">มีอุปกรณ์ในกระเป๋า</span>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <span>ดูรายการกระเป๋า</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
