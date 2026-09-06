import React, { useState } from 'react';
import {
  Boxes,
  AlertTriangle,
  History,
  Calendar,
  Layers,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import { ProductEntity, StockMovementEntity, SaleItemEntity } from '../../types';
import { formatCurrency, formatDate } from './reportUtils';
import { storage } from '../../services/storage';

interface InventoryReportsViewProps {
  products: ProductEntity[];
  stockMovements: StockMovementEntity[];
  saleItems: SaleItemEntity[];
  onRefreshData?: () => void;
}

type InventorySubTab =
  | 'VALUATION'
  | 'LOW_STOCK'
  | 'FAST_SLOW'
  | 'ITEM_LEDGER'
  | 'ADJUSTMENTS'
  | 'EXPIRY_BATCH';

export const InventoryReportsView: React.FC<InventoryReportsViewProps> = ({
  products,
  stockMovements,
  saleItems,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<InventorySubTab>('VALUATION');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [adjustModalProduct, setAdjustModalProduct] = useState<ProductEntity | null>(null);
  const [adjustNewStock, setAdjustNewStock] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('جرد وتسوية مستودع');

  // Totals
  const totalItemsCount = products.length;
  const totalUnitsInStock = products.reduce((sum, p) => sum + p.currentStock, 0);
  const totalValuationCost = products.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);
  const totalValuationSale = products.reduce((sum, p) => sum + p.currentStock * p.salePrice, 0);
  const expectedProfit = totalValuationSale - totalValuationCost;

  // Low stock items
  const lowStockItems = products.filter((p) => p.currentStock <= p.minStockLimit);

  // Fast & Slow moving analysis
  const unitsSoldMap = new Map<string, number>();
  saleItems.forEach((i) => {
    unitsSoldMap.set(i.productId, (unitsSoldMap.get(i.productId) || 0) + i.quantity);
  });

  const productsWithSales = products.map((p) => {
    const sold = unitsSoldMap.get(p.id) || 0;
    return {
      ...p,
      unitsSold: sold,
      movementSpeed: sold >= 5 ? 'سريع الحركة' : sold > 0 ? 'متوسط الحركة' : 'راكد / بطيء الحركة',
    };
  }).sort((a, b) => b.unitsSold - a.unitsSold);

  // Expiry check (within 6 months or expired)
  const now = new Date();
  const sixMonthsAhead = new Date();
  sixMonthsAhead.setMonth(now.getMonth() + 6);

  const expiryReport = products.map((p) => {
    const expDate = p.expiryDate ? new Date(p.expiryDate) : null;
    let status: 'EXPIRED' | 'NEAR_EXPIRY' | 'GOOD' = 'GOOD';
    if (expDate) {
      if (expDate.getTime() < now.getTime()) {
        status = 'EXPIRED';
      } else if (expDate.getTime() <= sixMonthsAhead.getTime()) {
        status = 'NEAR_EXPIRY';
      }
    }
    return { ...p, status };
  });

  // Selected product movements for Item Ledger Card
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const itemMovements = stockMovements.filter((m) => m.productId === selectedProductId);

  // Stock adjustments
  const adjustmentMovements = stockMovements.filter((m) => m.changeType === 'ADJUSTMENT');

  const handleApplyAdjustment = () => {
    if (!adjustModalProduct) return;
    storage.adjustStock(adjustModalProduct.id, adjustNewStock, adjustReason);
    setAdjustModalProduct(null);
    if (onRefreshData) onRefreshData();
  };

  return (
    <div className="space-y-6">
      {/* Top Inventory Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#dce5df] text-right shadow-xs">
          <span className="text-xs text-gray-500 block">إجمالي الوحدات بالمخزن</span>
          <span className="text-xl font-black text-gray-900 font-mono">{totalUnitsInStock} وحدة</span>
          <span className="text-[11px] text-gray-400 mt-0.5 block">{totalItemsCount} أصناف مسجلة</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#dce5df] text-right shadow-xs">
          <span className="text-xs text-gray-500 block">تقييم المخزون (سعر الشراء)</span>
          <span className="text-xl font-black text-amber-800 font-mono">{formatCurrency(totalValuationCost)}</span>
          <span className="text-[11px] text-gray-400 mt-0.5 block">رأس المال المستثمر</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#dce5df] text-right shadow-xs">
          <span className="text-xs text-gray-500 block">تقييم المخزون (سعر البيع)</span>
          <span className="text-xl font-black text-[#006C50] font-mono">{formatCurrency(totalValuationSale)}</span>
          <span className="text-[11px] text-emerald-700 font-bold mt-0.5 block">
            ربح متوقع: {formatCurrency(expectedProfit)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#dce5df] text-right shadow-xs">
          <span className="text-xs text-gray-500 block">أصناف تحت حد الأمان</span>
          <span className="text-xl font-black text-red-600 font-mono">{lowStockItems.length} صنف</span>
          <span className="text-[11px] text-red-600/80 mt-0.5 block">بحاجة لطلبيات شراء</span>
        </div>
      </div>

      {/* Subtabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('VALUATION')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'VALUATION'
              ? 'bg-[#006C50] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          جرد وتقييم المخزون
        </button>
        <button
          onClick={() => setActiveTab('LOW_STOCK')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
            activeTab === 'LOW_STOCK'
              ? 'bg-[#006C50] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <span>نواقص المخزون</span>
          {lowStockItems.length > 0 && (
            <span className="bg-amber-400 text-gray-950 text-[10px] px-1.5 rounded-full font-bold">
              {lowStockItems.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('FAST_SLOW')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'FAST_SLOW'
              ? 'bg-[#006C50] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          حركة الأصناف (سريع / راكد)
        </button>
        <button
          onClick={() => setActiveTab('ITEM_LEDGER')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'ITEM_LEDGER'
              ? 'bg-[#006C50] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          كارت الصنف وسجل الحركات
        </button>
        <button
          onClick={() => setActiveTab('EXPIRY_BATCH')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'EXPIRY_BATCH'
              ? 'bg-[#006C50] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          التشغيلات والصلاحيات
        </button>
        <button
          onClick={() => setActiveTab('ADJUSTMENTS')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'ADJUSTMENTS'
              ? 'bg-[#006C50] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          تعديلات وتسويات الجرد
        </button>
      </div>

      {/* 1. VALUATION TAB */}
      {activeTab === 'VALUATION' && (
        <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-sm font-bold text-gray-900">تقرير جرد وتقييم المخزون الحالي</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">اسم الصنف</th>
                  <th className="py-3 px-4 font-bold">الباركود</th>
                  <th className="py-3 px-4 font-bold">القسم</th>
                  <th className="py-3 px-4 font-bold">الرصيد الحالي</th>
                  <th className="py-3 px-4 font-bold">سعر الشراء</th>
                  <th className="py-3 px-4 font-bold">إجمالي تكلفة الشراء</th>
                  <th className="py-3 px-4 font-bold">سعر البيع</th>
                  <th className="py-3 px-4 font-bold">إجمالي القيمة البيعية</th>
                  <th className="py-3 px-4 font-bold">الربح المتوقع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {products.map((p) => {
                  const costTotal = p.currentStock * p.purchasePrice;
                  const saleTotal = p.currentStock * p.salePrice;
                  const profitExp = saleTotal - costTotal;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-gray-900">{p.name}</td>
                      <td className="py-3 px-4 font-mono text-gray-500">{p.barcode}</td>
                      <td className="py-3 px-4 text-gray-500">{p.category}</td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">{p.currentStock}</td>
                      <td className="py-3 px-4 font-mono">{formatCurrency(p.purchasePrice)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-800">{formatCurrency(costTotal)}</td>
                      <td className="py-3 px-4 font-mono">{formatCurrency(p.salePrice)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">{formatCurrency(saleTotal)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#006C50]">{formatCurrency(profitExp)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-left">الإجمالي العام:</td>
                  <td className="py-3 px-4 font-mono">{totalUnitsInStock} وحدة</td>
                  <td></td>
                  <td className="py-3 px-4 font-mono text-amber-800 font-black">{formatCurrency(totalValuationCost)}</td>
                  <td></td>
                  <td className="py-3 px-4 font-mono text-gray-900 font-black">{formatCurrency(totalValuationSale)}</td>
                  <td className="py-3 px-4 font-mono text-[#006C50] font-black">{formatCurrency(expectedProfit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 2. LOW_STOCK TAB */}
      {activeTab === 'LOW_STOCK' && (
        <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900">
              تقرير نواقص المخزون والأصناف دون حد الأمان ({lowStockItems.length} صنف)
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">اسم الصنف</th>
                  <th className="py-3 px-4 font-bold">القسم</th>
                  <th className="py-3 px-4 font-bold">الرصيد الحالي</th>
                  <th className="py-3 px-4 font-bold">حد الأمان الأدنى</th>
                  <th className="py-3 px-4 font-bold">العجز المطلوب طلبه</th>
                  <th className="py-3 px-4 font-bold">تكلفة التوريد المقدرة</th>
                  <th className="py-3 px-4 font-bold text-center">إجراء تسوية سريعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-emerald-700 font-bold">
                      ممتاز! كافة الأصناف برصيد آمن أعلى من حد الطلب الأدنى.
                    </td>
                  </tr>
                ) : (
                  lowStockItems.map((p) => {
                    const deficit = Math.max(0, p.minStockLimit * 2 - p.currentStock);
                    const costToReorder = deficit * p.purchasePrice;
                    return (
                      <tr key={p.id} className="hover:bg-amber-50/40">
                        <td className="py-3 px-4 font-bold text-gray-900">{p.name}</td>
                        <td className="py-3 px-4 text-gray-500">{p.category}</td>
                        <td className="py-3 px-4 font-mono font-bold text-red-600">{p.currentStock}</td>
                        <td className="py-3 px-4 font-mono text-gray-700">{p.minStockLimit}</td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-700">{deficit} وحدة</td>
                        <td className="py-3 px-4 font-mono">{formatCurrency(costToReorder)}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setAdjustModalProduct(p);
                              setAdjustNewStock(p.currentStock);
                            }}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-[#006C50] text-gray-700 rounded-lg text-xs font-bold border border-gray-200 transition-colors cursor-pointer"
                          >
                            تعديل المخزون
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. FAST & SLOW MOVING TAB */}
      {activeTab === 'FAST_SLOW' && (
        <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-sm font-bold text-gray-900">تقرير حركة دوران الأصناف (الأسرع دوراناً والراكدة)</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">اسم الصنف</th>
                  <th className="py-3 px-4 font-bold">القسم</th>
                  <th className="py-3 px-4 font-bold">المخزون المتوفر</th>
                  <th className="py-3 px-4 font-bold">الكميات المباعة</th>
                  <th className="py-3 px-4 font-bold">تصنيف الحركة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {productsWithSales.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">{p.name}</td>
                    <td className="py-3 px-4 text-gray-500">{p.category}</td>
                    <td className="py-3 px-4 font-mono font-bold text-gray-800">{p.currentStock}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">{p.unitsSold} وحدة</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          p.movementSpeed === 'سريع الحركة'
                            ? 'bg-emerald-100 text-emerald-900'
                            : p.movementSpeed === 'متوسط الحركة'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {p.movementSpeed}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ITEM LEDGER TAB (كارت الصنف) */}
      {activeTab === 'ITEM_LEDGER' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-[#dce5df] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-gray-700 shrink-0">اختر الصنف:</span>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none w-full sm:w-80"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (رصيد: {p.currentStock})
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <span className="text-gray-400 block">الرصيد الحالي:</span>
                  <span className="font-mono font-black text-[#006C50] text-sm">{selectedProduct.currentStock} وحدة</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 block">سعر الشراء:</span>
                  <span className="font-mono font-bold text-gray-800">{formatCurrency(selectedProduct.purchasePrice)}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 block">سعر البيع:</span>
                  <span className="font-mono font-bold text-gray-800">{formatCurrency(selectedProduct.salePrice)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-900">
                سجل حركات كارت الصنف: {selectedProduct?.name} ({itemMovements.length} حركة)
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 font-bold">التاريخ والوقت</th>
                    <th className="py-3 px-4 font-bold">نوع الحركة</th>
                    <th className="py-3 px-4 font-bold">الكمية المتغيرة</th>
                    <th className="py-3 px-4 font-bold">الرصيد بعد الحركة</th>
                    <th className="py-3 px-4 font-bold">المرجع / البيان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {itemMovements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        لا توجد حركات مسجلة لهذا الصنف حتى الآن
                      </td>
                    </tr>
                  ) : (
                    itemMovements.map((m) => (
                      <tr key={m.movementId} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono">{formatDate(m.timestamp)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                              m.changeType === 'SALE'
                                ? 'bg-red-50 text-red-700'
                                : m.changeType === 'PURCHASE'
                                ? 'bg-emerald-50 text-[#006C50]'
                                : m.changeType === 'RETURN'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-amber-50 text-amber-900'
                            }`}
                          >
                            {m.changeType === 'SALE'
                              ? 'صرف بيع'
                              : m.changeType === 'PURCHASE'
                              ? 'إضافة توريد'
                              : m.changeType === 'RETURN'
                              ? 'مرتجع مبيعات'
                              : 'تسوية جرد'}
                          </span>
                        </td>
                        <td className={`py-3 px-4 font-mono font-bold ${m.quantityChanged < 0 ? 'text-red-600' : 'text-[#006C50]'}`}>
                          {m.quantityChanged > 0 ? `+${m.quantityChanged}` : m.quantityChanged}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-gray-900">{m.stockAfter}</td>
                        <td className="py-3 px-4 text-gray-600 font-mono text-[11px]">{m.referenceId}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. EXPIRY & BATCH TAB */}
      {activeTab === 'EXPIRY_BATCH' && (
        <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-sm font-bold text-gray-900">تقرير أرقام التشغيلات وتواريخ الصلاحية للأدوية والأعلاف</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">اسم الصنف</th>
                  <th className="py-3 px-4 font-bold">رقم التشغيلة (Batch)</th>
                  <th className="py-3 px-4 font-bold">تاريخ الصلاحية</th>
                  <th className="py-3 px-4 font-bold">الرصيد الحالي</th>
                  <th className="py-3 px-4 font-bold">حالة الصلاحية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {expiryReport.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">{p.name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-gray-600">{p.batchNumber || '—'}</td>
                    <td className="py-3 px-4 font-mono">{p.expiryDate || '—'}</td>
                    <td className="py-3 px-4 font-mono font-bold">{p.currentStock}</td>
                    <td className="py-3 px-4">
                      {p.status === 'EXPIRED' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded bg-red-100 text-red-900 font-bold text-[11px]">
                          منتهي الصلاحية
                        </span>
                      ) : p.status === 'NEAR_EXPIRY' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[11px]">
                          قريب الانتهاء (أقل من 6 أشهر)
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[11px]">
                          صالح وآمن
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. ADJUSTMENTS TAB */}
      {activeTab === 'ADJUSTMENTS' && (
        <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-sm font-bold text-gray-900">سجل تسويات الجرد والهالك والتالف ({adjustmentMovements.length} تسوية)</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">التاريخ</th>
                  <th className="py-3 px-4 font-bold">كود الحركة</th>
                  <th className="py-3 px-4 font-bold">كود الصنف</th>
                  <th className="py-3 px-4 font-bold">التغير في الكمية</th>
                  <th className="py-3 px-4 font-bold">الرصيد الفعلي بعد التعديل</th>
                  <th className="py-3 px-4 font-bold">سبب التسوية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {adjustmentMovements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      لا توجد حركات تسوية جرد يدوية مسجلة
                    </td>
                  </tr>
                ) : (
                  adjustmentMovements.map((adj) => (
                    <tr key={adj.movementId} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono">{formatDate(adj.timestamp)}</td>
                      <td className="py-3 px-4 font-mono text-gray-500">{adj.movementId}</td>
                      <td className="py-3 px-4 font-mono">{adj.productId}</td>
                      <td className={`py-3 px-4 font-mono font-bold ${adj.quantityChanged < 0 ? 'text-red-600' : 'text-[#006C50]'}`}>
                        {adj.quantityChanged > 0 ? `+${adj.quantityChanged}` : adj.quantityChanged}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">{adj.stockAfter}</td>
                      <td className="py-3 px-4 text-gray-600">{adj.referenceId}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Quick Modal */}
      {adjustModalProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl text-right">
            <h3 className="text-base font-bold text-gray-900">تسوية رصيد: {adjustModalProduct.name}</h3>
            <p className="text-xs text-gray-500">الرصيد الدفتري الحالي: {adjustModalProduct.currentStock}</p>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">الرصيد الفعلي الجديد:</label>
              <input
                type="number"
                value={adjustNewStock}
                onChange={(e) => setAdjustNewStock(parseFloat(e.target.value) || 0)}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">سبب التسوية:</label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setAdjustModalProduct(null)}
                className="px-3.5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                إلغاء
              </button>
              <button
                onClick={handleApplyAdjustment}
                className="px-4 py-2 bg-[#006C50] hover:bg-[#00543e] text-white text-xs font-bold rounded-xl"
              >
                حفظ التسوية
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
