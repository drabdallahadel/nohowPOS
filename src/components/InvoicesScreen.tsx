import React, { useState } from 'react';
import {
  Receipt,
  ArrowRight,
  Search,
  Printer,
  Calendar,
  User,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { SaleEntity, SaleItemEntity } from '../types';
import { storage } from '../services/storage';
import { ReceiptModal } from './ReceiptModal';

interface InvoicesScreenProps {
  onBackToDashboard: () => void;
}

export const InvoicesScreen: React.FC<InvoicesScreenProps> = ({ onBackToDashboard }) => {
  const [sales] = useState<SaleEntity[]>(() => storage.getAllSales());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<{
    sale: SaleEntity;
    items: SaleItemEntity[];
  } | null>(null);

  const filteredSales = sales.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      s.saleId.toLowerCase().includes(q) ||
      s.cashierName.toLowerCase().includes(q) ||
      s.paymentMethod.toLowerCase().includes(q)
    );
  });

  const handleOpenReceipt = (sale: SaleEntity) => {
    const items = storage.getSaleItems(sale.saleId);
    setSelectedReceipt({ sale, items });
  };

  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalVatCollected = sales.reduce((sum, s) => sum + s.taxAmount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#dce5df]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRight className="w-5 h-5" />
            <span className="text-xs font-bold hidden sm:inline">العودة للوحة التحكم</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">سجل الفواتير والمبيعات</h1>
            <p className="text-xs text-gray-500 mt-0.5">استعراض العمليات السابقة وإعادة طباعة إيصالات الدفع</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="bg-white px-4 py-2 rounded-xl border border-[#dce5df] text-right shadow-xs">
            <span className="text-gray-500 block">إجمالي مبيعات الفواتير:</span>
            <span className="text-[#006C50] text-sm font-mono font-black">{totalSalesRevenue.toFixed(2)} ج.م</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-[#dce5df] text-right shadow-xs">
            <span className="text-gray-500 block">ضريبة 14% المحصلة:</span>
            <span className="text-gray-900 text-sm font-mono font-black">{totalVatCollected.toFixed(2)} ج.م</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#dce5df] shadow-xs">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الفاتورة أو اسم الكاشير..."
            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#006C50] outline-none"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        {filteredSales.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-gray-700">لا توجد فواتير مسجلة</h3>
            <p className="text-xs text-gray-400 mt-1">ابدأ عملية بيع جديدة من شاشة نقطة البيع (POS)</p>
          </div>
        ) : (
          filteredSales.map((sale) => {
            const formattedDate = new Date(sale.timestamp).toLocaleString('ar-EG', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={sale.saleId}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-[#dce5df] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-right hover:border-[#006C50] transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-gray-900 text-sm">{sale.saleId}</span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        sale.paymentMethod === 'CASH'
                          ? 'bg-emerald-50 text-[#006C50]'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {sale.paymentMethod === 'CASH' ? <Banknote className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                      <span>{sale.paymentMethod === 'CASH' ? 'نقداً' : 'بطاقة'}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formattedDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      الكاشير: {sale.cashierName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <div className="text-left">
                    <span className="text-xs text-gray-500 block">الإجمالي الكلي شامل 14%:</span>
                    <span className="text-lg font-black text-[#006C50] font-mono">
                      {sale.grandTotal.toFixed(2)} ج.م
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenReceipt(sale)}
                    className="py-2 px-3.5 bg-gray-100 hover:bg-emerald-50 hover:text-[#006C50] text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>عرض وطباعة الفاتورة</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          sale={selectedReceipt.sale}
          items={selectedReceipt.items}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};
