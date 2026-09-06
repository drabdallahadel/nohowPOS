import React, { useState } from 'react';
import {
  FileCheck,
  Plus,
  Search,
  ShoppingCart,
  Printer,
  X,
  CheckCircle2,
  Clock,
  Ban,
  User,
  Package,
  Calendar,
  Layers,
} from 'lucide-react';
import { storage } from '../services/storage';
import { QuotationEntity, CustomerEntity, ProductEntity, QuotationItemEntity, SaleEntity, SaleItemEntity } from '../types';

interface QuotationsScreenProps {
  onConvertToSale?: (quotation: QuotationEntity) => void;
}

export const QuotationsScreen: React.FC<QuotationsScreenProps> = ({ onConvertToSale }) => {
  const [quotations, setQuotations] = useState<QuotationEntity[]>(() => storage.getAllQuotations());
  const [customers] = useState<CustomerEntity[]>(() => storage.getAllCustomers());
  const [products] = useState<ProductEntity[]>(() => storage.getAllProducts());
  const settings = storage.getSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedQuoteForView, setSelectedQuoteForView] = useState<QuotationEntity | null>(null);

  // New Quote Form
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState('هذا العرض ساري لمدة 14 يوماً من تاريخ إصداره، والأسعار تشمل ضريبة القيمة المضافة.');
  const [items, setItems] = useState<QuotationItemEntity[]>([]);
  const [discount, setDiscount] = useState(0);

  // Item inputs
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(products[0]?.sellingPrice || 0);

  const refreshData = () => {
    setQuotations(storage.getAllQuotations());
  };

  const handleProductSelectChange = (id: string) => {
    setSelectedProdId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setItemPrice(prod.sellingPrice);
    }
  };

  const handleAddItem = () => {
    const prod = products.find((p) => p.id === selectedProdId);
    if (!prod || itemQty <= 0) return;

    const existingIdx = items.findIndex((i) => i.productId === selectedProdId);
    if (existingIdx >= 0) {
      const updated = [...items];
      updated[existingIdx].quantity += itemQty;
      updated[existingIdx].unitPrice = itemPrice;
      updated[existingIdx].totalPrice = updated[existingIdx].quantity * itemPrice;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          productName: prod.name,
          quantity: itemQty,
          unitPrice: itemPrice,
          totalPrice: itemQty * itemPrice,
        },
      ]);
    }
    setItemQty(1);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
  const taxRate = settings.taxRate || 14;
  const taxAmount = subtotal > discount ? ((subtotal - discount) * taxRate) / 100 : 0;
  const grandTotal = Math.max(0, subtotal - discount + taxAmount);

  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('يرجى إضافة صنف واحد على الأقل في عرض السعر.');
      return;
    }
    const cust = customers.find((c) => c.id === customerId);
    const customerName = cust ? cust.name : 'عميل عام';
    const currentUser = storage.getCurrentUser();

    const newQuote: QuotationEntity = {
      quotationId: 'QT-' + (1000 + quotations.length + 1),
      date: Date.now(),
      validUntil,
      customerId,
      customerName,
      status: 'SENT',
      items,
      subtotal,
      taxAmount,
      discount,
      grandTotal,
      notes,
      createdBy: currentUser ? currentUser.fullName : 'مسؤول المبيعات',
    };

    storage.insertQuotation(newQuote);
    refreshData();
    setIsCreateModalOpen(false);
    setItems([]);
    setDiscount(0);
  };

  const handleStatusChange = (quote: QuotationEntity, newStatus: QuotationEntity['status']) => {
    storage.updateQuotation({ ...quote, status: newStatus });
    refreshData();
  };

  const handleConvertQuotation = (quote: QuotationEntity) => {
    if (onConvertToSale) {
      onConvertToSale(quote);
    } else {
      // Direct conversion into sale
      const currentUser = storage.getCurrentUser();
      const cashierName = currentUser ? currentUser.fullName : 'مسؤول المبيعات';
      const saleId = 'INV-' + (1000 + storage.getAllSales().length + 1);

      // Create sale items
      const saleItems: SaleItemEntity[] = quote.items.map((it, idx) => {
        const prod = products.find((p) => p.id === it.productId);
        const purchasePrice = prod ? prod.purchasePrice : it.unitPrice * 0.7;
        return {
          itemId: Date.now() + idx,
          saleId,
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
          profit: it.totalPrice - purchasePrice * it.quantity,
        };
      });

      const saleEntity: SaleEntity = {
        saleId,
        timestamp: Date.now(),
        totalAmount: quote.totalAmount || quote.subtotal || 0,
        discountAmount: quote.discountAmount || quote.discount || 0,
        taxAmount: quote.taxAmount,
        grandTotal: quote.grandTotal,
        paidAmount: quote.grandTotal,
        paymentMethod: 'CASH',
        cashierName,
        status: 'COMPLETED',
        customerId: quote.customerId,
        customerName: quote.customerName,
        branchId: storage.getActiveBranchId(),
      };

      storage.executeSaleTransaction(saleEntity, saleItems);

      storage.updateQuotation({
        ...quote,
        status: 'CONVERTED',
        convertedSaleId: saleId,
      });

      storage.logAudit(
        'CONVERT_QUOTATION',
        'QUOTATION',
        quote.quotationId,
        `تم تحويل عرض السعر ${quote.quotationId} إلى فاتورة مبيعات ${saleId} بقيمة ${quote.grandTotal} ${settings.currencySymbol}`
      );

      refreshData();
      alert(`تم تحويل عرض السعر بنجاح إلى الفاتورة رقم ${saleId}! وتم خصم الكميات من المخزون وتحديث المبيعات.`);
    }
  };

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.quotationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-sm">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">عروض الأسعار للعملاء (Quotations)</h1>
            <p className="text-sm text-gray-500">
              إصدار عروض أسعار تفصيلية، متابعة صلاحيتها، وتحويلها بنقرة زر واحدة إلى فواتير مبيعات
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء عرض سعر جديد</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 my-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3.5" />
          <input
            type="text"
            placeholder="بحث برقم العرض أو اسم العميل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-teal-600 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'الكل' },
            { id: 'SENT', label: 'مرسل' },
            { id: 'ACCEPTED', label: 'مقبول' },
            { id: 'CONVERTED', label: 'تم التحويل لفاتورة' },
            { id: 'REJECTED', label: 'مرفوض' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st.id
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600">
              <tr>
                <th className="py-3 px-4">رقم العرض</th>
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">العميل</th>
                <th className="py-3 px-4">الصلاحية حتى</th>
                <th className="py-3 px-4">الأصناف</th>
                <th className="py-3 px-4">القيمة الإجمالية</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-400">
                    لا توجد عروض أسعار مطابقة
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => (
                  <tr key={q.quotationId} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{q.quotationId}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      {new Date(q.date).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">{q.customerName}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-600 font-mono">{q.validUntil}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">{q.items.length} صنف</td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {q.grandTotal.toLocaleString()} {settings.currencySymbol}
                    </td>
                    <td className="py-3.5 px-4">
                      {q.status === 'CONVERTED' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          فاتورة {q.convertedSaleId}
                        </span>
                      ) : q.status === 'ACCEPTED' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                          مقبول
                        </span>
                      ) : q.status === 'REJECTED' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                          مرفوض
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          قيد الانتظار
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedQuoteForView(q)}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold"
                        >
                          معاينة
                        </button>

                        {q.status !== 'CONVERTED' && (
                          <button
                            onClick={() => handleConvertQuotation(q)}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>تحويل لفاتورة</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-teal-700" />
                <h2 className="font-bold text-lg text-gray-900">إنشاء عرض سعر جديد للعميل</h2>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuotation} className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">العميل *</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-teal-600"
                    required
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ساري حتى تاريخ *</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-teal-600"
                    required
                  >
                  </input>
                </div>
              </div>

              {/* Add items */}
              <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">الصنف</label>
                    <select
                      value={selectedProdId}
                      onChange={(e) => handleProductSelectChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sellingPrice} {settings.currencySymbol})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">الكمية</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة للعرض</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 font-bold text-gray-700">
                    <tr>
                      <th className="py-2 px-3">الصنف</th>
                      <th className="py-2 px-3">الكمية</th>
                      <th className="py-2 px-3">سعر البيع</th>
                      <th className="py-2 px-3">الإجمالي</th>
                      <th className="py-2 px-3">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-gray-400">
                          لم يتم إدراج أصناف بعد
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-bold text-gray-900">{item.productName}</td>
                          <td className="py-2 px-3">{item.quantity}</td>
                          <td className="py-2 px-3">{item.unitPrice.toFixed(2)}</td>
                          <td className="py-2 px-3 font-bold text-teal-700">{item.totalPrice.toFixed(2)}</td>
                          <td className="py-2 px-3">
                            <button type="button" onClick={() => handleRemoveItem(idx)} className="text-rose-600 p-1">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الشروط والأحكام والملاحظات</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                  />
                </div>
                <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span className="font-bold">{subtotal.toFixed(2)} {settings.currencySymbol}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>الخصم الممنوح:</span>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-left"
                    />
                  </div>
                  <div className="flex justify-between font-bold text-sm text-teal-900 pt-2 border-t border-gray-200">
                    <span>إجمالي عرض السعر:</span>
                    <span>{grandTotal.toFixed(2)} {settings.currencySymbol}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-sm shadow-xs transition-colors"
                >
                  حفظ وإصدار عرض السعر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View & Print Modal */}
      {selectedQuoteForView && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-700" />
                <h3 className="font-bold text-lg text-gray-900">عرض سعر {selectedQuoteForView.quotationId}</h3>
              </div>
              <button onClick={() => setSelectedQuoteForView(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                <div>
                  <span className="text-gray-500 block">موجه للعميل:</span>
                  <span className="font-bold text-gray-900 text-sm">{selectedQuoteForView.customerName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">تاريخ الإصدار:</span>
                  <span className="font-bold text-gray-900">{new Date(selectedQuoteForView.date).toLocaleDateString('ar-EG')}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">ساري حتى:</span>
                  <span className="font-bold text-gray-900 font-mono">{selectedQuoteForView.validUntil}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">أعد بواسطة:</span>
                  <span className="font-bold text-gray-900">{selectedQuoteForView.preparedBy}</span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-right">
                  <thead className="bg-gray-100 font-bold text-gray-700">
                    <tr>
                      <th className="py-2 px-3">الصنف</th>
                      <th className="py-2 px-3">الكمية</th>
                      <th className="py-2 px-3">سعر الوحدة</th>
                      <th className="py-2 px-3">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedQuoteForView.items.map((it, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-bold text-gray-900">{it.productName}</td>
                        <td className="py-2 px-3">{it.quantity}</td>
                        <td className="py-2 px-3">{it.unitPrice.toFixed(2)}</td>
                        <td className="py-2 px-3 font-bold text-teal-700">{it.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-teal-50/50 p-4 rounded-xl space-y-1">
                <div className="flex justify-between font-bold text-sm text-teal-900">
                  <span>إجمالي القيمة:</span>
                  <span>{selectedQuoteForView.grandTotal.toFixed(2)} {settings.currencySymbol}</span>
                </div>
                <p className="text-gray-600 mt-2 text-[11px] leading-relaxed border-t border-teal-100 pt-2">
                  {selectedQuoteForView.notes}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                {selectedQuoteForView.status !== 'CONVERTED' && (
                  <button
                    onClick={() => {
                      handleConvertQuotation(selectedQuoteForView);
                      setSelectedQuoteForView(null);
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>تحويل لفاتورة بيع الآن</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-gray-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة عرض السعر</span>
                </button>
                <button
                  onClick={() => setSelectedQuoteForView(null)}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
