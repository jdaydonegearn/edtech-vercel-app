import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, AlertCircle, ShoppingBag, CheckCircle } from 'lucide-react';
import { useBorrow } from '../context/BorrowContext';
import { CartItem } from '../types';

export const CartDrawer: React.FC = () => {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    updateCartQuantity, 
    removeFromCart, 
    submitBorrowRequest,
    currentUser,
    authUser
  } = useBorrow();

  // Form State initialized from registered user profile or auth user
  const initialName = currentUser?.username || authUser?.displayName || (authUser?.email ? authUser.email.split('@')[0] : 'นักเรียน/ครู');
  const initialStudentId = currentUser?.studentId || (authUser?.email ? authUser.email.split('@')[0] : '');
  const initialPhone = currentUser?.phone || '0800000000';

  const [studentName, setStudentName] = useState(initialName);
  const [studentId, setStudentId] = useState(initialStudentId);
  const [phone, setPhone] = useState(initialPhone);
  const [purpose, setPurpose] = useState('ทำโปรเจกต์รายวิชา');

  // Dynamic default dates (today to 2 days later)
  const todayStr = new Date().toISOString().split('T')[0];
  const returnDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(returnDate);
  const [pickupTime, setPickupTime] = useState('15:00');

  useEffect(() => {
    if (currentUser) {
      if (currentUser.username) setStudentName(currentUser.username);
      if (currentUser.studentId) setStudentId(currentUser.studentId);
      if (currentUser.phone) setPhone(currentUser.phone);
    } else if (authUser) {
      const localPart = authUser.email ? authUser.email.split('@')[0] : '';
      if (authUser.displayName) setStudentName(authUser.displayName);
      if (localPart) setStudentId(localPart);
    }
  }, [currentUser, authUser]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successTag, setSuccessTag] = useState<string | null>(null);

  if (!isCartOpen) return null;

  // Group cart items by category
  const groupedCart = cart.reduce((acc, item) => {
    const cat = item.equipment.category || 'อื่นๆ';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!studentName.trim() || !studentId.trim() || !phone.trim() || !purpose.trim()) {
      setErrorMessage('กรุณากรอกข้อมูลผู้ยืมให้ครบถ้วนทุกช่อง');
      return;
    }

    if (!startDate || !endDate) {
      setErrorMessage('กรุณาเลือกวันที่เริ่มและวันที่คืนอุปกรณ์');
      return;
    }

    const res = submitBorrowRequest({
      studentName,
      studentId,
      phone,
      purpose,
      startDate,
      endDate,
      pickupTime,
    });

    if (!res.success) {
      setErrorMessage(res.message);
    } else {
      setSuccessTag(res.tagCode || 'ED-TECH-U-XXXX');
      setTimeout(() => {
        setSuccessTag(null);
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl text-slate-800 relative animate-slide-left"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              กระเป๋าอุปกรณ์ของฉัน
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              เลือกอุปกรณ์ ED-TECH ที่ต้องการยืมสำหรับโปรเจกต์ของคุณ
            </p>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Modal Notification Banner */}
        {successTag && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 text-emerald-800 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">ทำรายการสำเร็จ!</p>
              <p className="text-xs text-emerald-700">
                สร้างคำขอเรียบร้อย Tag: <span className="font-mono font-extrabold text-white bg-slate-900 px-1.5 py-0.5 rounded">{successTag}</span>
              </p>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
              <p className="text-sm font-semibold text-slate-600">ยังไม่มีอุปกรณ์ในกระเป๋า</p>
              <p className="text-xs text-slate-400 mt-1">เลือกอุปกรณ์ที่ต้องการจากหน้าคลังอุปกรณ์</p>
            </div>
          ) : (
            <>
              {/* Equipment Items Grouped */}
              <div className="space-y-4">
                {(Object.entries(groupedCart) as [string, CartItem[]][]).map(([cat, items]) => (
                  <div key={cat} className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <span>{cat === 'กล้อง' ? '📷' : cat === 'เลนส์' ? '🔍' : '📦'}</span>
                      <span>{cat}</span>
                    </h3>

                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.equipmentId}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 truncate">
                              {item.equipment.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-mono">
                              คงเหลือ: {item.equipment.availableQuantity} ชิ้น
                            </p>
                          </div>

                          {/* Stepper Quantity controls */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.equipmentId, item.quantity - 1)}
                                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-7 text-center text-xs font-extrabold text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.equipmentId, item.quantity + 1)}
                                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeFromCart(item.equipmentId)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                              title="ลบออก"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Form Fields: Borrower Information */}
              <form id="borrowForm" onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-200 pb-2">
                  ข้อมูลผู้ยืม
                </h3>

                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อ-นามสกุล <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="นาย/นางสาว..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                {/* Student ID & Phone Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      รหัสนักศึกษา <span className="text-blue-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="69122600..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      เบอร์โทรศัพท์ <span className="text-blue-600">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09XXXXXX..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    วัตถุประสงค์ <span className="text-blue-600">*</span>
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  >
                    <option value="ทำโปรเจกต์รายวิชา">ทำโปรเจกต์รายวิชา (ED-TECH Studio)</option>
                    <option value="งานคณะ/มหาวิทยาลัย">งานคณะ/งานมหาวิทยาลัย</option>
                    <option value="ใช้ในงานส่วนตัว (Personal Use)">ใช้ในงานส่วนตัว (Personal Use)</option>
                    <option value="ถ่ายทำสปอตประชาสัมพันธ์">ถ่ายทำสปอตประชาสัมพันธ์</option>
                  </select>
                </div>

                {/* Dates Grid */}
                <div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        วันที่ (Start) <span className="text-blue-600">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        วันที่ (End) <span className="text-blue-600">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-600 font-medium mt-1">
                    * ยืมสูงสุดได้ไม่เกิน 3 วัน
                  </p>
                </div>

                {/* Pickup Time */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เวลารับอุปกรณ์ <span className="text-blue-600">*</span>
                  </label>
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-mono transition"
                  >
                    <option value="09:00">09:00 น.</option>
                    <option value="10:30">10:30 น.</option>
                    <option value="13:00">13:00 น.</option>
                    <option value="15:00">15:00 น.</option>
                    <option value="16:30">16:30 น.</option>
                  </select>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer Confirm Button */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <button
              type="submit"
              form="borrowForm"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-xl text-base shadow-md hover:shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>ยืนยันการยืม</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
