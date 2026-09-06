import React, { useState } from 'react';
import {
  Layers,
  ArrowLeftRight,
  AlertTriangle,
  Clock,
  Warehouse,
  Search,
  Plus,
  CheckCircle2,
  Package,
  Calendar,
  X,
  FileSpreadsheet,
  Filter,
} from 'lucide-react';
import { storage } from '../services/storage';
import { ProductEntity, WarehouseEntity, StockTransferEntity, StockMovementEntity } from '../types';

export const InventoryHubScreen: React.FC = () => {
  const [products, setProducts] = useState<ProductEntity[]>(() => storage.getAllProducts());
  const [warehouses, setWarehouses] = useState<WarehouseEntity[]>(() => storage.getAllWarehouses());
  const [transfers, setTransfers] = useState<StockTransferEntity[]>(() => storage.getAllStockTransfers());
  const settings = storage.getSettings();

  const [activeTab, setActiveTab] = useState<'WAREHOUSES' | 'TRANSFERS' | 'BATCHES' | 'MOVEMENTS'>('WAREHOUSES');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('ALL');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Transfer Form State
  const [transferProdId, setTransferProdId] = useState(products[0]?.id || '');
  const [fromWhId, setFromWhId] = useState('wh-01');
  const [toWhId, setToWhId] = useState('wh-02');
  const [transferQty, setTransferQty] = useState(5);
  const [transferNotes, setTransferNotes] = useState('');

  const refreshData = () => {
    setProducts(storage.getAllProducts());
    setTransfers(storage.getAllStockTransfers());
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromWhId === toWhId) {
      alert('لا يمكن التحويل لنفس المستودع.');
      return;
    }
    const prod = products.find((p) => p.id === transferProdId);
    if (!prod || transferQty <= 0) return;

    if (transferQty > prod.currentStock && !settings.allowNegativeStock) {
      alert(`الكمية المطلوبة للتحويل (${transferQty}) أكبر من الرصيد المتوفر (${prod.currentStock}).`);
      return;
    }

    const fromWh = warehouses.find((w) => w.id === fromWhId);
    const toWh = warehouses.find((w) => w.id === toWhId);
    const currentUser = storage.getCurrentUser();

    const newTransfer: StockTransferEntity = {
      transferId: 'TR-' + (1000 + transfers.length + 1),
      date: Date.now(),
      fromWarehouseId: fromWhId,
      fromWarehouseName: fromWh ? fromWh.name : 'مستودع 1',
      toWarehouseId: toWhId,
      toWarehouseName: toWh ? toWh.name : 'مستودع 2',
      productId: prod.id,
      productName: prod.name,
      quantity: transferQty,
      status: 'COMPLETED',
      recordedBy: currentUser ? currentUser.fullName : 'أمين المستودع',
      notes: transferNotes,
    };

    storage.executeStockTransfer(newTransfer);
    refreshData();
    setIsTransferModalOpen(false);
    setTransferNotes('');
  };

  // Batches classification
  const now = Date.now();
  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return { label: 'غير محدد', color: 'text-gray-400 bg-gray-50' };
    const expTime = new Date(expiryDate).getTime();
    const diffDays = Math.ceil((expTime - now) / (1000 * 3600 * 24));
    if (diffDays < 0) {
      return { label: `منتهي (${Math.abs(diffDays)} يوم مضت)`, color: 'text-rose-800 bg-rose-100 border border-rose-300' };
    }
    if (diffDays <= 90) {
      return { label: `قريب الانتهاء (${diffDays} يوم)`, color: 'text-amber-800 bg-amber-100 border border-amber-300' };
    }
    return { label: `سليم (${diffDays} يوم متبقي)`, color: 'text-emerald-800 bg-emerald-100 border border-emerald-300' };
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      (p.batchNumber && p.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalInventoryValue = products.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);
  const totalSellingValue = products.reduce((sum, p) => sum + p.currentStock * p.sellingPrice, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-700 text-white flex items-center justify-center shadow-sm">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">مركز المستودعات والتحويلات المخزنية (Inventory Hub)</h1>
            <p className="text-sm text-gray-500">
              إدارة المخازن المتعددة، أذونات التحويل، تتبع التشغيلات (Batches)، وتواريخ الصلاحية
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsTransferModalOpen(true)}
          className="px-5 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>إذن تحويل بين المستودعات</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 my-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 block">قيمة المخزون بسعر التكلفة</span>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {totalInventoryValue.toLocaleString()} {settings.currencySymbol}
          </div>
          <span className="text-xs text-cyan-700 mt-1 block">رأس المال المستثمر</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 block">قيمة المخزون بسعر البيع</span>
          <div className="mt-2 text-2xl font-bold text-emerald-700">
            {totalSellingValue.toLocaleString()} {settings.currencySymbol}
          </div>
          <span className="text-xs text-emerald-600 mt-1 block">العائد المتوقع عند التصريف</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 block">عدد المستودعات النشطة</span>
          <div className="mt-2 text-2xl font-bold text-indigo-700">{warehouses.length} مستودعات</div>
          <span className="text-xs text-indigo-600 mt-1 block">رئيسي وفرعي وتبريد</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 block">أذونات التحويل المنفذة</span>
          <div className="mt-2 text-2xl font-bold text-purple-700">{transfers.length} إذن</div>
          <span className="text-xs text-purple-600 mt-1 block">حركات نقل داخلية موثقة</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 mb-6">
        {[
          { id: 'WAREHOUSES', label: 'أرصدة المستودعات والأصناف', icon: Layers },
          { id: 'BATCHES', label: 'التشغيلات والصلاحية (Batches & Expiry)', icon: Clock },
          { id: 'TRANSFERS', label: 'سجل التحويلات المخزنية', icon: ArrowLeftRight },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                active
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'WAREHOUSES' && (
        <div className="space-y-6">
          {/* Warehouses list */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {warehouses.map((wh) => (
              <div key={wh.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900 text-base">{wh.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-cyan-50 text-cyan-800 font-bold">
                      {wh.code}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">الموقع: {wh.location}</p>
                  <p className="text-xs text-gray-600">الأمين المسؤول: <span className="font-bold text-gray-800">{wh.managerName}</span></p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>مستودع فعال</span>
                  </span>
                  <span className="text-gray-400">سعة قياسية</span>
                </div>
              </div>
            ))}
          </div>

          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3.5" />
              <input
                type="text"
                placeholder="بحث باسم الصنف أو الباركود..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-cyan-600"
              />
            </div>
          </div>

          {/* Products Stock Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600">
                <tr>
                  <th className="py-3 px-4">الصنف</th>
                  <th className="py-3 px-4">القسم</th>
                  <th className="py-3 px-4">الباركود</th>
                  <th className="py-3 px-4">الرصيد الإجمالي</th>
                  <th className="py-3 px-4">تكلفة الوحدة</th>
                  <th className="py-3 px-4">سعر البيع</th>
                  <th className="py-3 px-4">إجمالي قيمة التكلفة</th>
                  <th className="py-3 px-4">حالة الرصيد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const isOut = p.currentStock <= 0;
                  const isLow = p.currentStock <= (p.minStockLimit || 10);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-900">{p.name}</td>
                      <td className="py-3 px-4 text-xs text-gray-600">{p.category}</td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-500">{p.barcode}</td>
                      <td className="py-3 px-4 font-bold font-mono text-base text-gray-900">{p.currentStock}</td>
                      <td className="py-3 px-4 text-xs font-mono">{p.purchasePrice} {settings.currencySymbol}</td>
                      <td className="py-3 px-4 text-xs font-mono font-bold text-emerald-700">{p.sellingPrice} {settings.currencySymbol}</td>
                      <td className="py-3 px-4 font-mono font-bold text-xs text-cyan-900">
                        {(p.currentStock * p.purchasePrice).toLocaleString()} {settings.currencySymbol}
                      </td>
                      <td className="py-3 px-4">
                        {isOut ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            نفد المخزون
                          </span>
                        ) : isLow ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            منخفض (حد الأمان)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            متوفر ومستقر
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'BATCHES' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-700" />
              مراقبة تشغيلات الأدوية وتواريخ الصلاحية (FIFO & Expiry)
            </h3>
            <span className="text-xs text-gray-500">تساعد على تصريف الأدوية ذات الصلاحية الأقرب أولاً</span>
          </div>

          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600">
              <tr>
                <th className="py-3 px-4">الصنف</th>
                <th className="py-3 px-4">رقم التشغيلة (Batch Number)</th>
                <th className="py-3 px-4">تاريخ انتهاء الصلاحية</th>
                <th className="py-3 px-4">الرصيد المتبقي</th>
                <th className="py-3 px-4">حالة الصلاحية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => {
                const status = getExpiryStatus(p.expiryDate);
                return (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900">{p.name}</td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-cyan-800">
                      {p.batchNumber || 'BATCH-STD'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-700">
                      {p.expiryDate || '2026-12-31'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{p.currentStock}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'TRANSFERS' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-cyan-700" />
              سجل التحويلات بين المستودعات
            </h3>
            <span className="text-xs text-gray-500">توثيق أذونات الصرف والاستلام بين المخازن</span>
          </div>

          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600">
              <tr>
                <th className="py-3 px-4">رقم الإذن</th>
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">من مستودع</th>
                <th className="py-3 px-4">إلى مستودع</th>
                <th className="py-3 px-4">الصنف المحول</th>
                <th className="py-3 px-4">الكمية</th>
                <th className="py-3 px-4">المسؤول</th>
                <th className="py-3 px-4">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    لا توجد تحويلات سابقة
                  </td>
                </tr>
              ) : (
                transfers.map((tr) => (
                  <tr key={tr.transferId} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-700">{tr.transferId}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      {new Date(tr.date).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 font-medium">{tr.fromWarehouseName}</td>
                    <td className="py-3.5 px-4 text-gray-700 font-medium">{tr.toWarehouseName}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">{tr.productName}</td>
                    <td className="py-3.5 px-4 font-bold font-mono text-cyan-800">{tr.quantity}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">{tr.recordedBy}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        مكتمل
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-cyan-700" />
                <h3 className="font-bold text-lg text-gray-900">إذن تحويل بضاعة بين المستودعات</h3>
              </div>
              <button onClick={() => setIsTransferModalOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الصنف المطلوب تحويله *</label>
                <select
                  value={transferProdId}
                  onChange={(e) => setTransferProdId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-cyan-600"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (الرصيد الكلي: {p.currentStock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">من مستودع (المصدر) *</label>
                  <select
                    value={fromWhId}
                    onChange={(e) => setFromWhId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-cyan-600"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">إلى مستودع (الوجهة) *</label>
                  <select
                    value={toWhId}
                    onChange={(e) => setToWhId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-cyan-600"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الكمية المحولة *</label>
                <input
                  type="number"
                  min="1"
                  value={transferQty}
                  onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:ring-2 focus:ring-cyan-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">سبب التحويل أو ملاحظات</label>
                <input
                  type="text"
                  placeholder="تغذية مخزن الصرف اليومي، طلب فرع..."
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-xl text-sm shadow-xs"
                >
                  تنفيذ التحويل المخزني
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
