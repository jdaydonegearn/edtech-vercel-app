import React from 'react';
import { Newspaper, Bell, Clock, AlertOctagon, HelpCircle, FileText } from 'lucide-react';
import { useBorrow } from '../context/BorrowContext';

export const NewsView: React.FC = () => {
  const { announcements } = useBorrow();

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto text-slate-800 animate-fade-in">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
          ข่าวสารและประกาศ
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          ข้อมูลข่าวสาร กฎระเบียบ และการแจ้งเตือนจากศูนย์บริการอุปกรณ์ ED-TECH
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Announcements List */}
        <div className="lg:col-span-2 space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-white border rounded-2xl p-6 shadow-sm transition relative ${
                ann.isImportant
                  ? 'border-blue-300 bg-blue-50/40 ring-1 ring-blue-100'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {ann.isImportant && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-sm">
                      <Bell className="w-3 h-3" /> ประกาศสำคัญ
                    </span>
                  )}
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(ann.date).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-900 mb-2">{ann.title}</h2>
              <div className="text-sm text-slate-600 whitespace-pre-line leading-relaxed font-normal">
                {ann.content}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: FAQ & Office Hours Card */}
        <div className="space-y-6">
          {/* Office Hours */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>เวลาทำการบริการ</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-700 font-medium">วันจันทร์ - ศุกร์</span>
                <span className="font-mono text-emerald-700 font-bold">09:00 - 16:30 น.</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-700 font-medium">วันเสาร์ - อาทิตย์</span>
                <span className="font-mono text-amber-700 font-bold">ปิดทำการ</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
              <p className="font-bold flex items-center gap-1 text-blue-900">
                <AlertOctagon className="w-4 h-4 text-blue-600" /> หมายเหตุ:
              </p>
              <p className="mt-1 text-slate-600 leading-relaxed">
                กรุณามารับและคืนอุปกรณ์ตามเวลาที่กำหนด หากเกินกำหนดปรับวันละ 100 บาทต่อชิ้น
              </p>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>ขั้นตอนการยืมอุปกรณ์</span>
            </h3>

            <ol className="list-decimal list-inside text-xs text-slate-600 space-y-2 leading-relaxed">
              <li>เลือกอุปกรณ์ที่ต้องการในหน้า <span className="text-blue-600 font-bold">อุปกรณ์</span></li>
              <li>ตรวจสอบจำนวน และกดเพิ่มลงกระเป๋า</li>
              <li>ระบุข้อมูล วันที่ยืม-คืน (ไม่เกิน 3 วัน) และส่งคำขอ</li>
              <li>รอแอดมินอนุมัติสถานะในหน้า <span className="text-blue-600 font-bold">การยืมของฉัน</span></li>
              <li>นำ Tag ID มารับอุปกรณ์ตามเวลานัดหมาย</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
