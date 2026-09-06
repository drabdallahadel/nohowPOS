import React, { useState } from 'react';
import { X, RotateCcw, Search, AlertTriangle, Check } from 'lucide-react';
import { SaleEntity, SaleItemEntity, ReturnEntity, UserEntity } from '../../types';
import { storage } from '../../services/storage';
import { formatCurrency, formatDate } from './reportUtils';

interface ProcessReturnModalProps {
  onClose: () => void;
  onReturnProcessed: () => void;
  currentUser: UserEntity | null;
}

const RETURN_REASONS = [
  'عيب تصنيع أو تلف في العبوة',
  'عدم ملائمة أو رغبة العميل',
  'قريب انتهاء الصلاحية',
  'خطأ في تسجيل الفاتورة الأصلية',
  'أخرى',
];

export const ProcessReturnModal: React.FC<ProcessReturnModalProps> = ({
  onClose,
  onReturnProcessed,
  currentUser,
}) => {
  const [searchInvoice, setSearchInvoice] = useState<string>('');
  const [foundSale, setFoundSale] = useState<SaleEntity | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItemEntity[]>([]);
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<string>(RETURN_REASONS[0]);
  const [error, setError] = useState<string>('');

  const handleSearchSale = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const sales = storage.getAllSales();
    const query = searchInvoice.trim().toUpperCase();

    const sale = sales.find((s) => s.saleId.toUpperCase() === query);
    if (!sale) {
      setError('لم يتم العثور على فاتورة بهذا الرقم. يرجى التأكد من كتابة كود الفاتورة بشكل صحيح (مثال: INV-1001)');
      setFoundSale(null);
      setSaleItems([]);
      return;
    }

    if (sale.status === 'RETURNED') {
      setError('تم إرجاع هذه الفاتورة مسبقاً بالكامل.');
      return;
    }

    const items = storage.getSaleItems(sale.saleId);
    setFoundSale(sale);
    setSaleItems(items);

    // Initialize return quantities to match original by default
    const initialQtys: Record<string, number> = {};
    items.forEach((i) => {
      initialQtys[i.productId] = i.quantity;
    });
    setReturnQtys(initialQtys);
  };

  // Calculate refund amounts
  const subtotalRefund = saleItems.reduce((sum, item) => {
    const q = returnQtys[item.productId] || 0;
    return sum + item.unitPrice * q;
  }, 0);

  const taxRefund = Math.round(subtotalRefund * 0.14 * 100) / 100;
  const grandTotalRefund = subtotalRefund + taxRefund;

  const handleSubmitReturn = () => {
    if (!foundSale) return;

    // Filter items with quantity > 0
    const returnedItems = saleItems
      .filter((i) => (returnQtys[i.productId] || 0) > 0)
      .map((i) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: returnQtys[i.productId] || 0,
        unitPrice: i.unitPrice,
        totalPrice: i.unitPrice * (returnQtys[i.productId] || 0),
      }));

    if (returnedItems.length === 0) {
      setError('يرجى تحديد كمية صنف واحد على الأقل للإرجاع');
      return;
    }

    const returnRecord: ReturnEntity = {
      returnId: 'RET-' + Date.now().toString().slice(-6),
      originalSaleId: foundSale.saleId,
      customerId: foundSale.customerId,
      customerName: foundSale.customerName,
      items: returnedItems,
      totalAmount: subtotalRefund,
      taxAmount: taxRefund,
      grandTotal: grandTotalRefund,
      reason,
      timestamp: Date.now(),
      cashierName: currentUser?.fullName || currentUser?.username || 'الكاشير',
    };

    storage.executeReturnTransaction(returnRecord);
    onReturnProcessed();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl text-right space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900">تسجيل مرتجع مبيعات وإرجاع للمخزن</h3>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Invoice Search Bar */}
        <form onSubmit={handleSearchSale} className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-[#006C50] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
          >
            بحث
          </button>
          <div className="relative w-full">
            <input
              type="text"
              value={searchInvoice}
              onChange={(e) => setSearchInvoice(e.target.value)}
              placeholder="أدخل رقم الفاتورة الأصلية (مثال: INV-1001)..."
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono font-bold outline-none"
            />
          </div>
        </form>

        {foundSale && (
          <div className="space-y-4 pt-2 border-t border-gray-100">
            {/* Sale Meta */}
            <div className="bg-emerald-50/60 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-gray-900 block">فاتورة: {foundSale.saleId}</span>
                <span className="text-gray-500 font-mono">{formatDate(foundSale.timestamp)}</span>
              </div>
              <div className="text-left">
                <span className="text-gray-500 block">العميل: {foundSale.customerName || 'عميل نقدي'}</span>
                <span className="font-mono font-bold text-[#006C50]">{formatCurrency(foundSale.grandTotal)}</span>
              </div>
            </div>

            {/* Items Table with Quantity Picker */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3 font-bold">الصنف</th>
                    <th className="py-2.5 px-3 font-bold">السعر</th>
                    <th className="py-2.5 px-3 font-bold">الكمية بالفاتورة</th>
                    <th className="py-2.5 px-3 font-bold">الكمية المرتجعة</th>
                    <th className="py-2.5 px-3 font-bold">المسترد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {saleItems.map((item) => {
                    const returnQ = returnQtys[item.productId] ?? 0;
                    return (
                      <tr key={item.productId} className="hover:bg-gray-50">
                        <td className="py-2 px-3 font-bold text-gray-900">{item.productName}</td>
                        <td className="py-2 px-3 font-mono">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-2 px-3 font-mono text-gray-500">{item.quantity}</td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={returnQ}
                            onChange={(e) => {
                              const val = Math.min(item.quantity, Math.max(0, parseInt(e.target.value) || 0));
                              setReturnQtys((prev) => ({ ...prev, [item.productId]: val }));
                            }}
                            className="w-16 p-1 bg-white border border-gray-300 rounded font-mono font-bold text-xs text-center outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-red-600">
                          {formatCurrency(item.unitPrice * returnQ)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Return Reason */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">سبب الإرجاع:</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 outline-none"
              >
                {RETURN_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Summary Refund Box */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs space-y-1.5 font-bold">
              <div className="flex justify-between text-gray-600">
                <span>المسترد قبل الضريبة:</span>
                <span className="font-mono">{formatCurrency(subtotalRefund)}</span>
              </div>
              <div className="flex justify-between text-blue-900">
                <span>الضريبة المستردة (14%):</span>
                <span className="font-mono">{formatCurrency(taxRefund)}</span>
              </div>
              <div className="flex justify-between text-red-600 text-sm border-t border-gray-200 pt-1.5">
                <span>إجمالي المبلغ المسترد للعميل:</span>
                <span className="font-mono font-black">{formatCurrency(grandTotalRefund)}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSubmitReturn}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                تأكيد الإرجاع واسترداد النقد
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
