import React from 'react';
import { Printer, CheckCircle2, X } from 'lucide-react';
import { SaleEntity, SaleItemEntity } from '../types';

interface ReceiptModalProps {
  sale: SaleEntity;
  items: SaleItemEntity[];
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, items, onClose }) => {
  const formattedDate = new Date(sale.timestamp).toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-200">
        {/* Header bar */}
        <div className="bg-[#006C50] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span className="font-bold text-sm">تم إصدار الفاتورة وحفظ المعاملة بنجاح</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable thermal receipt layout */}
        <div id="printable-receipt" className="p-6 text-gray-800 bg-white font-mono text-sm">
          <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
            <h2 className="text-lg font-black font-sans text-gray-900">مؤسسة التجارة والخدمات البيطرية</h2>
            <p className="text-xs text-gray-500 font-sans mt-0.5">نظام نقاط البيع المعتمد - POS Enterprise</p>
            <p className="text-[11px] text-gray-400 font-sans mt-0.5">الرقم الضريبي: 300-854-921</p>
            <div className="mt-3 text-xs bg-gray-100 py-1 px-3 rounded inline-block font-bold">
              فاتورة ضريبية مبسطة رقم: {sale.saleId}
            </div>
          </div>

          <div className="space-y-1 text-xs text-gray-600 mb-4 pb-3 border-b border-dashed border-gray-300 font-sans">
            <div className="flex justify-between">
              <span>التاريخ والوقت:</span>
              <span className="font-mono text-gray-900">{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span>الكاشير المسؤول:</span>
              <span className="font-semibold text-gray-900">{sale.cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span>طريقة الدفع:</span>
              <span className="font-semibold text-[#006C50]">
                {sale.paymentMethod === 'CASH' ? 'نقداً (CASH)' : sale.paymentMethod === 'CARD' ? 'بطاقة بنكية (CARD)' : 'آجل'}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-4">
            <div className="text-xs font-bold text-gray-700 pb-1.5 border-b border-gray-300 flex justify-between font-sans">
              <span className="w-1/2">الصنف</span>
              <span className="w-1/6 text-center">الكمية</span>
              <span className="w-1/6 text-left">السعر</span>
              <span className="w-1/6 text-left">الإجمالي</span>
            </div>
            <div className="divide-y divide-gray-100 py-1">
              {items.map((item, idx) => (
                <div key={idx} className="py-2 flex justify-between text-xs items-center">
                  <span className="w-1/2 font-sans font-medium text-gray-900 truncate pr-1">{item.productName}</span>
                  <span className="w-1/6 text-center font-mono">{item.quantity}</span>
                  <span className="w-1/6 text-left font-mono">{item.unitPrice.toFixed(2)}</span>
                  <span className="w-1/6 text-left font-mono font-bold">{item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="border-t-2 border-gray-300 pt-3 space-y-1.5 text-xs font-sans">
            <div className="flex justify-between text-gray-600">
              <span>المجموع قبل الضريبة:</span>
              <span className="font-mono">{sale.totalAmount.toFixed(2)} ج.م</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>ضريبة القيمة المضافة (14%):</span>
              <span className="font-mono">{sale.taxAmount.toFixed(2)} ج.م</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>الخصم الممنوح:</span>
                <span className="font-mono">-{sale.discountAmount.toFixed(2)} ج.م</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-dashed border-gray-300">
              <span>الإجمالي الكلي النهائي:</span>
              <span className="font-mono text-[#006C50] text-lg">{sale.grandTotal.toFixed(2)} ج.م</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 pt-1">
              <span>المبلغ المدفوع:</span>
              <span className="font-mono">{sale.paidAmount.toFixed(2)} ج.م</span>
            </div>
          </div>

          {/* Receipt Footer */}
          <div className="mt-6 text-center border-t border-dashed border-gray-300 pt-4">
            <p className="text-xs text-gray-600 font-sans font-semibold">شكرًا لتعاملكم معنا!</p>
            <p className="text-[10px] text-gray-400 font-sans mt-0.5">البضاعة المباعة لا ترد ولا تستبدل بعد 14 يومًا وفق الشروط</p>
            <div className="mt-3 text-[10px] font-mono tracking-widest text-gray-400">
              * * * {sale.saleId} * * *
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 bg-[#006C50] hover:bg-[#00543e] text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الفاتورة</span>
          </button>
          <button
            onClick={onClose}
            className="py-3 px-5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-sm rounded-xl transition-all cursor-pointer"
          >
            إغلاق / فاتورة جديدة
          </button>
        </div>
      </div>
    </div>
  );
};
