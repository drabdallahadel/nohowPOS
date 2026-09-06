import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  Building2,
  Receipt,
  FileText,
  DollarSign,
  Package,
  X,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { storage } from '../services/storage';
import { PurchaseBillEntity, PurchaseItemEntity, ProductEntity, SupplierEntity, WarehouseEntity, PaymentMethodType } from '../types';

export const PurchasesScreen: React.FC = () => {
  const [purchases, setPurchases] = useState<PurchaseBillEntity[]>(() => storage.getAllPurchases());
  const [products] = useState<ProductEntity[]>(() => storage.getAllProducts());
  const [suppliers] = useState<SupplierEntity[]>(() => storage.getAllSuppliers());
  const [warehouses] = useState<WarehouseEntity[]>(() => storage.getAllWarehouses());
  const settings = storage.getSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBillForView, setSelectedBillForView] = useState<PurchaseBillEntity | null>(null);

  // New Purchase Form State
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || 'wh-01');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [items, setItems] = useState<PurchaseItemEntity[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(14);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Form item selection
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const [itemQty, setItemQty] = useState(10);
  const [itemPrice, setItemPrice] = useState(products[0]?.purchasePrice || 0);
  const [itemBatch, setItemBatch] = useState('');
  const [itemExpiry, setItemExpiry] = useState('');

  const refreshData = () => {
    setPurchases(storage.getAllPurchases());
  };

  const handleProductSelectChange = (id: string) => {
    setSelectedProdId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setItemPrice(prod.purchasePrice);
      setItemBatch(prod.batchNumber || '');
      setItemExpiry(prod.expiryDate || '');
    }
  };

  const handleAddItem = () => {
    const prod = products.find((p) => p.id === selectedProdId);
    if (!prod || itemQty <= 0 || itemPrice < 0) return;

    const existingIdx = items.findIndex((i) => i.productId === selectedProdId);
    if (existingIdx >= 0) {
      const updated = [...items];
      updated[existingIdx].quantity += itemQty;
      updated[existingIdx].unitPrice = itemPrice;
      updated[existingIdx].totalPrice = updated[existingIdx].quantity * itemPrice;
      if (itemBatch) updated[existingIdx].batchNumber = itemBatch;
      if (itemExpiry) updated[existingIdx].expiryDate = itemExpiry;
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
          batchNumber: itemBatch || 'BATCH-' + Date.now().toString().slice(-4),
          expiryDate: itemExpiry || '2026-12-31',
        },
      ]);
    }

    // Reset item inputs
    setItemQty(10);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
  const taxAmount = (subtotal - discount) > 0 ? ((subtotal - discount) * taxRate) / 100 : 0;
  const grandTotal = Math.max(0, subtotal - discount + taxAmount);
  const remainingAmount = Math.max(0, grandTotal - paidAmount);

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('يرجى إضافة صنف واحد على الأقل لفاتورة الشراء.');
      return;
    }

    const sup = suppliers.find((s) => s.id === supplierId);
    const supplierName = sup ? sup.name : 'مورد عام';
    const currentUser = storage.getCurrentUser();

    const newBill: PurchaseBillEntity = {
      purchaseId: 'PO-' + (2000 + purchases.length + 1),
      date: Date.now(),
      supplierId,
      supplierName,
      status: 'RECEIVED',
      items,
      subtotal,
      taxAmount,
      discount,
      grandTotal,
      paidAmount,
      remainingAmount,
      paymentMethod,
      warehouseId,
      recordedBy: currentUser ? currentUser.fullName : 'مسؤول المشتريات',
      notes,
    };

    storage.executePurchaseTransaction(newBill);
    refreshData();
    setIsAddModalOpen(false);
    // Reset
    setItems([]);
    setDiscount(0);
    setPaidAmount(0);
    setNotes('');
  };

  const filteredPurchases = purchases.filter((p) => {
    const matchesSearch =
      p.purchaseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSupplier = selectedSupplierFilter === 'ALL' || p.supplierId === selectedSupplierFilter;
    return matchesSearch && matchesSupplier;
  });

  const totalPurchasesAmount = purchases.reduce((sum, p) => sum + p.grandTotal, 0);
  const totalPaid = purchases.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalRemaining = purchases.reduce((sum, p) => sum + p.remainingAmount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-700 text-white flex items-center justify-center shadow-sm">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">دورة المشتريات والتوريدات (Purchases ERP)</h1>
            <p className="text-sm text-gray-500">
              إدارة أوامر وفواتير الشراء، توريد البضاعة للمستودعات، وتحديث أرصدة الموردين آلياً
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsAddModalOpen(true);
            setPaidAmount(0);
          }}
          className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>فاتورة شراء جديدة</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">إجمالي المشتريات</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {totalPurchasesAmount.toLocaleString()} {settings.currencySymbol}
          </div>
          <span className="text-xs text-gray-400 mt-1 block">عدد الفواتير: {purchases.length}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">إجمالي المدفوع للموردين</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">
            {totalPaid.toLocaleString()} {settings.currencySymbol}
          </div>
          <span className="text-xs text-emerald-600 mt-1 block">صرف نقدي وتحويلات</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">المتبقي مستحقات للموردين</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-700">
            {totalRemaining.toLocaleString()} {settings.currencySymbol}
          </div>
          <span className="text-xs text-rose-600 mt-1 block">آجل على الحساب</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3.5" />
          <input
            type="text"
            placeholder="بحث برقم الفاتورة أو اسم المورد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedSupplierFilter}
            onChange={(e) => setSelectedSupplierFilter(e.target.value)}
            className="w-full sm:w-60 px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-600"
          >
            <option value="ALL">جميع الموردين</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600">
              <tr>
                <th className="py-3 px-4">رقم الفاتورة</th>
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">المورد</th>
                <th className="py-3 px-4">عدد الأصناف</th>
                <th className="py-3 px-4">إجمالي القيمة</th>
                <th className="py-3 px-4">المدفوع</th>
                <th className="py-3 px-4">المتبقي</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-gray-400">
                    لا توجد فواتير شراء مسجلة
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((bill) => (
                  <tr key={bill.purchaseId} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{bill.purchaseId}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      {new Date(bill.date).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">{bill.supplierName}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">{bill.items.length} صنف</td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {bill.grandTotal.toLocaleString()} {settings.currencySymbol}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-700 font-semibold text-xs">
                      {bill.paidAmount.toLocaleString()} {settings.currencySymbol}
                    </td>
                    <td className="py-3.5 px-4 text-rose-700 font-semibold text-xs">
                      {bill.remainingAmount.toLocaleString()} {settings.currencySymbol}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        تم الاستلام
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => setSelectedBillForView(bill)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>عرض</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Purchase Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-indigo-700" />
                <h2 className="font-bold text-lg text-gray-900">إنشاء واستلام فاتورة شراء وتوريد</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Supplier & Warehouse */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">المورد *</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-600"
                    required
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (رصيد مستحق: {s.balance.toLocaleString()} {settings.currencySymbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">المستودع المستلم *</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-600"
                    required
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">طريقة الدفع *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="CASH">نقدي من الخزينة</option>
                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                    <option value="CREDIT">آجل بالكامل على الحساب</option>
                    <option value="SPLIT">دفع جزء والباقي آجل</option>
                  </select>
                </div>
              </div>

              {/* Add Items Box */}
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <h3 className="text-xs font-bold text-indigo-900 mb-3 flex items-center gap-1.5">
                  <Package className="w-4 h-4" />
                  إضافة أصناف الشراء والتشغيلات
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">الصنف</label>
                    <select
                      value={selectedProdId}
                      onChange={(e) => handleProductSelectChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - الحالي: {p.currentStock}
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

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">سعر الشراء (التكلفة)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إدراج بالفاتورة</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">رقم التشغيلة (Batch No)</label>
                    <input
                      type="text"
                      placeholder="مثال: BATCH-2026-X"
                      value={itemBatch}
                      onChange={(e) => setItemBatch(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">تاريخ انتهاء الصلاحية</label>
                    <input
                      type="date"
                      value={itemExpiry}
                      onChange={(e) => setItemExpiry(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 font-bold text-gray-700">
                    <tr>
                      <th className="py-2.5 px-3">الصنف</th>
                      <th className="py-2.5 px-3">الكمية</th>
                      <th className="py-2.5 px-3">سعر الوحدة</th>
                      <th className="py-2.5 px-3">التشغيلة والصلاحية</th>
                      <th className="py-2.5 px-3">الإجمالي</th>
                      <th className="py-2.5 px-3">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-gray-400">
                          لم يتم إضافة أي صنف بعد
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-bold text-gray-900">{item.productName}</td>
                          <td className="py-2 px-3">{item.quantity}</td>
                          <td className="py-2 px-3">{item.unitPrice.toFixed(2)}</td>
                          <td className="py-2 px-3 text-gray-500 font-mono">
                            {item.batchNumber || '—'} / {item.expiryDate || '—'}
                          </td>
                          <td className="py-2 px-3 font-bold text-indigo-700">{item.totalPrice.toFixed(2)}</td>
                          <td className="py-2 px-3">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-rose-600 hover:text-rose-800 p-1"
                            >
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ملاحظات الفاتورة</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="شروط التسليم، رقم إذن الاستلام الخارجي..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="space-y-2 bg-gray-50 p-4 rounded-xl text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">المجموع الفرعي:</span>
                    <span className="font-bold text-gray-900">{subtotal.toFixed(2)} {settings.currencySymbol}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">خصم تجاري:</span>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-left font-bold"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ضريبة القيمة المضافة ({taxRate}%):</span>
                    <span className="font-bold text-gray-900">{taxAmount.toFixed(2)} {settings.currencySymbol}</span>
                  </div>

                  <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-bold">
                    <span className="text-indigo-900">إجمالي الفاتورة:</span>
                    <span className="text-indigo-900">{grandTotal.toFixed(2)} {settings.currencySymbol}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="font-bold text-emerald-800">المبلغ المدفوع:</span>
                    <input
                      type="number"
                      min="0"
                      max={grandTotal}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                      className="w-28 px-2 py-1 border border-emerald-400 bg-emerald-50 rounded text-left font-bold text-emerald-900"
                    />
                  </div>

                  <div className="flex justify-between font-bold text-rose-800">
                    <span>المتبقي آجل على المنشأة:</span>
                    <span>{remainingAmount.toFixed(2)} {settings.currencySymbol}</span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-sm shadow-xs transition-colors"
                >
                  حفظ وتأكيد استلام الفاتورة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Bill Modal */}
      {selectedBillForView && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-700" />
                <h3 className="font-bold text-lg text-gray-900">تفاصيل فاتورة شراء {selectedBillForView.purchaseId}</h3>
              </div>
              <button onClick={() => setSelectedBillForView(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                <div>
                  <span className="text-gray-500 block">المورد:</span>
                  <span className="font-bold text-gray-900 text-sm">{selectedBillForView.supplierName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">تاريخ التوريد:</span>
                  <span className="font-bold text-gray-900">{new Date(selectedBillForView.date).toLocaleString('ar-EG')}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">المستودع:</span>
                  <span className="font-bold text-gray-900">
                    {warehouses.find((w) => w.id === selectedBillForView.warehouseId)?.name || 'المستودع الرئيسي'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">سجل بواسطة:</span>
                  <span className="font-bold text-gray-900">{selectedBillForView.recordedBy}</span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-right">
                  <thead className="bg-gray-100 font-bold text-gray-700">
                    <tr>
                      <th className="py-2 px-3">الصنف</th>
                      <th className="py-2 px-3">الكمية</th>
                      <th className="py-2 px-3">سعر الوحدة</th>
                      <th className="py-2 px-3">التشغيلة</th>
                      <th className="py-2 px-3">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedBillForView.items.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-bold text-gray-900">{item.productName}</td>
                        <td className="py-2 px-3">{item.quantity}</td>
                        <td className="py-2 px-3">{item.unitPrice.toFixed(2)}</td>
                        <td className="py-2 px-3 text-gray-500 font-mono">{item.batchNumber || '—'}</td>
                        <td className="py-2 px-3 font-bold text-indigo-700">{item.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-indigo-50/50 p-4 rounded-xl space-y-1.5">
                <div className="flex justify-between font-bold text-sm">
                  <span>إجمالي الفاتورة:</span>
                  <span className="text-indigo-900">
                    {selectedBillForView.grandTotal.toFixed(2)} {settings.currencySymbol}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>المدفوع:</span>
                  <span>{selectedBillForView.paidAmount.toFixed(2)} {settings.currencySymbol}</span>
                </div>
                <div className="flex justify-between text-rose-800 font-bold">
                  <span>المتبقي آجل:</span>
                  <span>{selectedBillForView.remainingAmount.toFixed(2)} {settings.currencySymbol}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-gray-50"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة الفاتورة</span>
              </button>
              <button
                onClick={() => setSelectedBillForView(null)}
                className="px-5 py-2 bg-indigo-700 text-white rounded-xl text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
