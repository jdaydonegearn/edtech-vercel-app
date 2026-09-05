import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Copy, Check, Filter } from 'lucide-react';
import { useBorrow } from '../context/BorrowContext';
import { BorrowRequest, BorrowRequestStatus } from '../types';

export const CalendarView: React.FC = () => {
  const { 
    borrowRequests, 
    selectedDate, 
    setSelectedDate,
    periodFilter,
    setPeriodFilter 
  } = useBorrow();

  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Thai Month Names
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const formatDateStr = (year: number, monthIndex: number, day: number) =>
    `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const parseDateStr = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return { year, monthIndex: month - 1, day };
  };

  const initialView = parseDateStr(selectedDate);
  const [currentYear, setCurrentYear] = useState<number>(initialView.year);
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(initialView.monthIndex);

  const daysOfWeek = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  const generateMonthDays = (year: number, monthIndex: number) => {
    const days: {
      dayNumber: number;
      month: number;
      year: number;
      isCurrentMonth: boolean;
      dateStr: string;
    }[] = [];

    const startWeekday = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
    const prevYear = monthIndex === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear, prevMonthIndex + 1, 0).getDate();

    for (let i = startWeekday - 1; i >= 0; i--) {
      const dayNumber = daysInPrevMonth - i;
      days.push({
        dayNumber,
        month: prevMonthIndex,
        year: prevYear,
        isCurrentMonth: false,
        dateStr: formatDateStr(prevYear, prevMonthIndex, dayNumber),
      });
    }

    for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
      days.push({
        dayNumber,
        month: monthIndex,
        year,
        isCurrentMonth: true,
        dateStr: formatDateStr(year, monthIndex, dayNumber),
      });
    }

    const nextMonthIndex = monthIndex === 11 ? 0 : monthIndex + 1;
    const nextYear = monthIndex === 11 ? year + 1 : year;
    let nextDay = 1;
    while (days.length < 42) {
      days.push({
        dayNumber: nextDay,
        month: nextMonthIndex,
        year: nextYear,
        isCurrentMonth: false,
        dateStr: formatDateStr(nextYear, nextMonthIndex, nextDay),
      });
      nextDay += 1;
    }

    return days;
  };

  const goToMonth = (year: number, monthIndex: number) => {
    let nextYear = year;
    let nextMonth = monthIndex;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }

    setCurrentYear(nextYear);
    setCurrentMonthIndex(nextMonth);

    const daysInTarget = new Date(nextYear, nextMonth + 1, 0).getDate();
    const selectedDay = parseDateStr(selectedDate).day;
    setSelectedDate(formatDateStr(nextYear, nextMonth, Math.min(selectedDay, daysInTarget)));
  };

  const goToToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const day = now.getDate();
    setCurrentYear(year);
    setCurrentMonthIndex(monthIndex);
    setSelectedDate(formatDateStr(year, monthIndex, day));
  };

  const calendarDays = generateMonthDays(currentYear, currentMonthIndex);

  // Helper: Find requests active on a specific date
  const getRequestsForDate = (dateStr: string) => {
    return borrowRequests.filter((req) => {
      // Exclude cancelled or rejected requests from calendar
      if (req.status === 'cancelled' || req.status === 'rejected') return false;
      return dateStr >= req.startDate && dateStr <= req.endDate;
    });
  };

  // Helper: Format badge color based on request status or name hash
  const getStatusBadge = (status: BorrowRequestStatus) => {
    switch (status) {
      case 'approved':
        return { text: 'อนุมัติแล้ว', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'ready':
        return { text: 'รอรับของ', bg: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'borrowed':
        return { text: 'กำลังยืม', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'returned':
        return { text: 'คืนแล้ว', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'pending':
        return { text: 'รออนุมัติ', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      default:
        return { text: status, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const getPillColorByName = (name: string, status: BorrowRequestStatus) => {
    if (status === 'returned') return 'bg-slate-100 text-slate-700 border-slate-200';
    if (status === 'ready') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (status === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    
    // Hash based color
    const colors = [
      'bg-slate-100 text-slate-800 border-slate-300',
      'bg-blue-50 text-blue-800 border-blue-200',
      'bg-emerald-50 text-emerald-800 border-emerald-200',
      'bg-purple-50 text-purple-800 border-purple-200'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  };

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  // Active requests for sidebar daily details
  const activeDailyRequests = getRequestsForDate(selectedDate);

  // Group items by category for detailed card rendering
  const groupItemsByCategory = (items: BorrowRequest['items']) => {
    const grouped: Record<string, { name: string; quantity: number }[]> = {};
    items.forEach((item) => {
      const cat = item.category || 'อื่นๆ';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({ name: item.equipmentName, quantity: item.quantity });
    });
    return grouped;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto text-slate-800">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
          ปฏิทินการยืม
        </h1>
        <p className="text-slate-500 text-sm mt-1">ดูรายการยืมอุปกรณ์ตามวันที่</p>
      </div>

      {/* Main Grid: Calendar on Left, Daily Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calendar Component */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm flex flex-col justify-between">
          
          {/* Calendar Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold tracking-wide text-slate-900">
                {thaiMonths[currentMonthIndex]} {currentYear}
              </h2>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
                <button 
                  type="button"
                  aria-label="เดือนก่อนหน้า"
                  onClick={() => goToMonth(currentYear, currentMonthIndex - 1)}
                  className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  type="button"
                  onClick={goToToday}
                  className="px-2.5 py-0.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition"
                >
                  วันนี้
                </button>
                <button 
                  type="button"
                  aria-label="เดือนถัดไป"
                  onClick={() => goToMonth(currentYear, currentMonthIndex + 1)}
                  className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Period Date Filter Box */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
              <span className="text-slate-500 font-medium hidden sm:inline">ช่วงเวลา (Period)</span>
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-slate-400">เริ่ม</span>
                <input
                  type="date"
                  value={periodFilter.startDate}
                  onChange={(e) => setPeriodFilter({ ...periodFilter, startDate: e.target.value })}
                  className="bg-transparent text-slate-800 font-mono text-xs focus:outline-none w-28"
                />
              </div>
              <span className="text-slate-400">-</span>
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-slate-400">คืน</span>
                <input
                  type="date"
                  value={periodFilter.endDate}
                  onChange={(e) => setPeriodFilter({ ...periodFilter, endDate: e.target.value })}
                  className="bg-transparent text-slate-800 font-mono text-xs focus:outline-none w-28"
                />
              </div>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-600 mb-2">
            {daysOfWeek.map((day, idx) => (
              <div key={idx} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* 42-Cell Month Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-xs">
            {calendarDays.map((cell) => {
              const isSelected = selectedDate === cell.dateStr;
              const reqs = getRequestsForDate(cell.dateStr);
              const maxDisplay = 3;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => {
                    setSelectedDate(cell.dateStr);
                    if (!cell.isCurrentMonth) {
                      setCurrentYear(cell.year);
                      setCurrentMonthIndex(cell.month);
                    }
                  }}
                  className={`min-h-[96px] md:min-h-[105px] p-1.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-slate-900 bg-slate-100 ring-2 ring-slate-900/20 shadow-sm'
                      : cell.isCurrentMonth
                      ? 'bg-slate-50 border-slate-200 hover:border-slate-400 hover:bg-slate-100'
                      : 'bg-slate-50/50 border-slate-100 opacity-40 hover:opacity-70'
                  }`}
                >
                  {/* Cell Top Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`font-semibold text-xs px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-slate-900 text-white font-extrabold shadow-sm'
                          : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {reqs.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse"></span>
                    )}
                  </div>

                  {/* Requests Pills List */}
                  <div className="space-y-1 overflow-hidden flex-1">
                    {reqs.slice(0, maxDisplay).map((req) => (
                      <div
                        key={req.id}
                        className={`truncate text-[10px] px-1.5 py-0.5 rounded border ${getPillColorByName(
                          req.studentName,
                          req.status
                        )}`}
                        title={`${req.studentName} (${req.tagCode})`}
                      >
                        {req.studentName}
                      </div>
                    ))}
                    {reqs.length > maxDisplay && (
                      <div className="text-[10px] font-semibold text-slate-500 pl-1">
                        +{reqs.length - maxDisplay} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Daily Details Drawer/Sidebar (รายละเอียดประจำวัน) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-full max-h-[720px]">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                รายละเอียดประจำวัน
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5 font-semibold">
                {selectedDate.split('-').reverse().join('/')}
              </p>
            </div>
            <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-full border border-slate-200 font-bold">
              {activeDailyRequests.length} รายการ
            </span>
          </div>

          {/* Daily Borrow Tickets List */}
          <div className="space-y-4 overflow-y-auto pr-1 flex-1 custom-scrollbar">
            {activeDailyRequests.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                <p className="text-sm font-medium text-slate-600">ไม่มีรายการยืมในวันที่เลือก</p>
                <p className="text-xs text-slate-400 mt-1">คลิกเลือกวันที่อื่นในปฏิทินเพื่อดูรายละเอียด</p>
              </div>
            ) : (
              activeDailyRequests.map((req) => {
                const statusBadge = getStatusBadge(req.status);
                const groupedItems = groupItemsByCategory(req.items);

                return (
                  <div
                    key={req.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 hover:border-slate-400 transition"
                  >
                    {/* Top Row: Tag & Status */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">เลข Tag ยืมของ:</span>
                        <span className="font-mono text-xs font-extrabold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm">
                          {req.tagCode}
                        </span>
                        <button
                          onClick={() => handleCopyTag(req.tagCode)}
                          className="text-slate-400 hover:text-slate-700 transition"
                          title="คัดลอก Tag Code"
                        >
                          {copiedTag === req.tagCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.bg}`}
                      >
                        {statusBadge.text}
                      </span>
                    </div>

                    {/* Borrower Name & Student ID */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{req.studentName}</h3>
                      <p className="text-xs text-slate-500 font-mono">{req.studentId}</p>
                    </div>

                    {/* Equipment Items Grouped */}
                    <div className="space-y-1.5 pt-1">
                      {Object.entries(groupedItems).map(([cat, itemList]) => (
                        <div key={cat} className="text-xs flex items-start gap-2">
                          <span className="text-slate-500 min-w-[50px] font-medium">{cat}:</span>
                          <div className="flex flex-wrap gap-1">
                            {itemList.map((it, idx) => (
                              <span
                                key={idx}
                                className="bg-white text-slate-800 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-medium shadow-sm"
                              >
                                {it.name} <span className="text-slate-900 font-bold">x{it.quantity}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Purpose */}
                    {req.purpose && (
                      <div className="text-xs text-slate-700 bg-white p-2 rounded border border-slate-200 shadow-sm">
                        <span className="text-slate-500 font-medium">วัตถุประสงค์:</span> {req.purpose}
                      </div>
                    )}

                    {/* Period Date */}
                    <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between border-t border-slate-200">
                      <span className="flex items-center gap-1">
                        🕒 {new Date(req.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - {new Date(req.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-slate-500 font-mono">เวลารับ: {req.pickupTime} น.</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
