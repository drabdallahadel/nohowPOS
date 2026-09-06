import React, { useState } from 'react';
import {
  FileText,
  RotateCcw,
  Percent,
  Clock,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { SaleEntity, SaleItemEntity, ProductEntity, ReturnEntity } from '../../types';
import { formatCurrency, formatDate } from './reportUtils';
import { ReceiptModal } from '../ReceiptModal';
import { storage } from '../../services/storage';

interface SalesReportsViewProps {
  sales: SaleEntity[];
  saleItems: SaleItemEntity[];
  products: ProductEntity[];
  returns: ReturnEntity[];
  onOpenReturnModal: () => void;
}

type SalesSubTab =
  | 'INVOICES'
  | 'BY_ITEM'
  | 'BY_CATEGORY'
  | 'BY_CASHIER'
  | 'BY_CUSTOMER'
  | 'BY_PAYMENT'
  | 'RETURNS'
  | 'TAX_DISCOUNTS'
  | 'HOURLY';

export const SalesReportsView: React.FC<SalesReportsViewProps> = ({
  sales,
  saleItems,
  products,
  returns,
  onOpenReturnModal,
}) => {
  const [activeTab, setActiveTab] = useState<SalesSubTab>('INVOICES');
  const [selectedReceipt, setSelectedReceipt] = useState<{ sale: SaleEntity; items: SaleItemEntity[] } | null>(null);

  // Computed Totals
  const totalGrossSales = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalNetSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalTax = sales.reduce((sum, s) => sum + s.taxAmount, 0);
  const totalDiscount = sales.reduce((sum, s) => sum + s.discountAmount, 0);
  const totalReturns = returns.reduce((sum, r) => sum + r.grandTotal, 0);

  const productMap = new Map<string, ProductEntity>(products.map((p) => [p.id, p]));

  // 1. Group by Item
  const itemsSummaryMap = new Map<
    string,
    { id: string; name: string; category: string; qty: number; totalRevenue: number; avgPrice: number }
  >();
  saleItems.forEach((item) => {
    const prod = productMap.get(item.productId);
    const existing = itemsSummaryMap.get(item.productId) || {
      id: item.productId,
      name: item.productName,
      category: prod?.category || 'أخرى',
      qty: 0,
      totalRevenue: 0,
      avgPrice: item.unitPrice,
    };
    existing.qty += item.quantity;
    existing.totalRevenue += item.totalPrice;
    itemsSummaryMap.set(item.productId, existing);
  });
  const itemsReport = Array.from(itemsSummaryMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);

  // 2. Group by Category
  const catSummaryMap = new Map<string, { category: string; itemsCount: number; unitsSold: number; totalRevenue: number }>();
  itemsReport.forEach((item) => {
    const existing = catSummaryMap.get(item.category) || {
      category: item.category,
      itemsCount: 0,
      unitsSold: 0,
      totalRevenue: 0,
    };
    existing.itemsCount += 1;
    existing.unitsSold += item.qty;
    existing.totalRevenue += item.totalRevenue;
    catSummaryMap.set(item.category, existing);
  });
  const categoryReport = Array.from(catSummaryMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);

  // 3. Group by Cashier
  const cashierSummaryMap = new Map<
    string,
    { name: string; invoicesCount: number; totalSales: number; totalTax: number; totalDiscount: number }
  >();
  sales.forEach((s) => {
    const existing = cashierSummaryMap.get(s.cashierName) || {
      name: s.cashierName,
      invoicesCount: 0,
      totalSales: 0,
      totalTax: 0,
      totalDiscount: 0,
    };
    existing.invoicesCount += 1;
    existing.totalSales += s.grandTotal;
    existing.totalTax += s.taxAmount;
    existing.totalDiscount += s.discountAmount;
    cashierSummaryMap.set(s.cashierName, existing);
  });
  const cashierReport = Array.from(cashierSummaryMap.values()).sort((a, b) => b.totalSales - a.totalSales);

  // 4. Group by Customer
  const customerSummaryMap = new Map<string, { name: string; count: number; totalSpent: number; lastDate: number }>();
  sales.forEach((s) => {
    const custName = s.customerName || 'عميل نقدي عام';
    const existing = customerSummaryMap.get(custName) || {
      name: custName,
      count: 0,
      totalSpent: 0,
      lastDate: 0,
    };
    existing.count += 1;
    existing.totalSpent += s.grandTotal;
    if (s.timestamp > existing.lastDate) existing.lastDate = s.timestamp;
    customerSummaryMap.set(custName, existing);
  });
  const customerReport = Array.from(customerSummaryMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);

  // 5. Group by Payment Method
  const paymentSummaryMap = new Map<string, { method: string; count: number; totalAmount: number }>();
  ['CASH', 'CARD', 'CREDIT'].forEach((m) => {
    paymentSummaryMap.set(m, {
      method: m === 'CASH' ? 'نقداً (CASH)' : m === 'CARD' ? 'بطاقة بنكية (CARD)' : 'آجل / ذمم (CREDIT)',
      count: 0,
      totalAmount: 0,
    });
  });
  sales.forEach((s) => {
    const entry = paymentSummaryMap.get(s.paymentMethod);
    if (entry) {
      entry.count += 1;
      entry.totalAmount += s.grandTotal;
    }
  });
  const paymentReport = Array.from(paymentSummaryMap.values());

  // 6. Hourly breakdown
  const hourlySummaryMap = new Map<number, { hour: number; label: string; count: number; total: number }>();
  for (let i = 0; i < 24; i++) {
    hourlySummaryMap.set(i, {
      hour: i,
      label: `${i}:00 - ${i + 1}:00`,
      count: 0,
      total: 0,
    });
  }
  sales.forEach((s) => {
    const h = new Date(s.timestamp).getHours();
    const entry = hourlySummaryMap.get(h);
    if (entry) {
      entry.count += 1;
      entry.total += s.grandTotal;
    }
  });
  const hourlyReport = Array.from(hourlySummaryMap.values()).filter((h) => h.count > 0 || (h.hour >= 8 && h.hour <= 22));

  const tabs: { id: SalesSubTab; label: string }[] = [
    { id: 'INVOICES', label: 'فواتير المبيعات' },
    { id: 'BY_ITEM', label: 'حسب الصنف' },
    { id: 'BY_CATEGORY', label: 'حسب القسم' },
    { id: 'BY_CASHIER', label: 'حسب الكاشير' },
    { id: 'BY_CUSTOMER', label: 'حسب العميل' },
    { id: 'BY_PAYMENT', label: 'طرق الدفع' },
    { id: 'RETURNS', label: 'تقرير المرتجعات' },
    { id: 'TAX_DISCOUNTS', label: 'الخصومات والضرائب' },
    { id: 'HOURLY', label: 'مبيعات الساعات' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Sales Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#dce5df] text-right shadow-xs">
          <span className="text-xs text-gray-500 block">إجمالي المبيعات (شامل)</span>
          <span className="text-base font-black text-[#006C50] font-mono">{formatCurrency(totalGrossSales)}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#dce5df] text-right shadow-xs">
          <span className="text-xs text-gray-500 block">الصافي قبل الضريبة</span>
          <span className="text-base font-black text-gray-900 font-mono">{formatCurrency(totalNetSales)}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#dce5df] text-right shadow-xs">
          <span className="text-xs text-gray-500 block">ضريبة 14% المحصلة</span>
          <span className="text-base font-black text-blue-900 font-mono">{formatCurrency(totalTax)}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#dce5df] text-right shadow-xs">
          <span className="text-xs text-gray-500 block">إجمالي الخصومات الممنوحة</span>
          <span className="text-base font-black text-amber-700 font-mono">{formatCurrency(totalDiscount)}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#dce5df] text-right shadow-xs col-span-2 sm:col-span-1">
          <span className="text-xs text-gray-500 block">إجمالي المرتجعات</span>
          <span className="text-base font-black text-red-600 font-mono">{formatCurrency(totalReturns)}</span>
        </div>
      </div>

      {/* Subtabs Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#006C50] text-white shadow-xs'
                  : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'RETURNS' && (
          <button
            onClick={onOpenReturnModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تسجيل مرتجع فاتورة</span>
          </button>
        )}
      </div>

      {/* Subtab Content: 1. INVOICES */}
      {activeTab === 'INVOICES' && (
        <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900">سجل فواتير المبيعات التفصيلية ({sales.length} فاتورة)</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">رقم الفاتورة</th>
                  <th className="py-3 px-4 font-bold">التاريخ والوقت</th>
                  <th className="py-3 px-4 font-bold">الكاشير</th>
                  <th className="py-3 px-4 font-bold">العميل</th>
                  <th className="py-3 px-4 font-bold">طريقة الدفع</th>
                  <th className="py-3 px-4 font-bold">الخصم</th>
                  <th className="py-3 px-4 font-bold">الضريبة 14%</th>
                  <th className="py-3 px-4 font-bold">الإجمالي الكلي</th>
                  <th className="py-3 px-4 font-bold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-400">
                      لا توجد فواتير مطابقة لمعايير البحث
                    </td>
                  </tr>
                ) : (
                  sales.map((s) => (
                    <tr key={s.saleId} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">{s.saleId}</td>
                      <td className="py-3 px-4 font-mono">{formatDate(s.timestamp)}</td>
                      <td className="py-3 px-4">{s.cashierName}</td>
                      <td className="py-3 px-4">{s.customerName || 'عميل نقدي عام'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            s.paymentMethod === 'CASH'
                              ? 'bg-emerald-50 text-emerald-800'
                              : s.paymentMethod === 'CARD'
                              ? 'bg-blue-50 text-blue-800'
                              : 'bg-amber-50 text-amber-900'
                          }`}
                        >
                          {s.paymentMethod === 'CASH' ? 'نقداً' : s.paymentMethod === 'CARD' ? 'بطاقة' : 'آجل'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">{s.discountAmount > 0 ? formatCurrency(s.discountAmount) : '—'}</td>
                      <td className="py-3 px-4 font-mono">{formatCurrency(s.taxAmount)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#006C50]">{formatCurrency(s.grandTotal)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            const items = storage.getSaleItems(s.saleId);
                            setSelectedReceipt({ sale: s, items });
                          }}
                          className="p-1.5 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors cursor-pointer"
                          title="عرض وطباعة الإيصال"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200 font-bold text-gray-900">
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-left">الإجمالي:</td>
                  <td className="py-3 px-4 font-mono">{formatCurrency(totalDiscount)}</td>
                  <td className="py-3 px-4 font-mono">{formatCurrency(totalTax)}</td>
                  <td className="py-3 px-4 font-mono text-[#006C50] font-black">{formatCurrency(totalGrossSales)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Subtab Content: 2. BY_ITEM */}
      {activeTab === 'BY_ITEM' && (
        <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-sm font-bold text-gray-900">تقرير مبيعات الأصناف والكميات المباعة</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">اسم الصنف</th>
                  <th className="py-3 px-4 font-bold">القسم</th>
                  <th className="py-3 px-4 font-bold">الكمية المباعة</th>
                  <th className="py-3 px-4 font-bold">سعر الوحدة</th>
                  <th className="py-3 px-4 font-bold">إجمالي المبيعات</th>
                  <th className="py-3 px-4 font-bold">النسبة من المبيعات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {itemsReport.map((item) => {
                  const share = totalNetSales > 0 ? (item.totalRevenue / totalNetSales) * 100 : 0;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-gray-900">{item.name}</td>
                      <td className="py-3 px-4 text-gray-500">{item.category}</td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-800">{item.qty} وحدة</td>
                      <td className="py-3 px-4 font-mono">{formatCurrency(item.avgPrice)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#006C50]">{formatCurrency(item.totalRevenue)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#006C50] h-full" style={{ width: `${Math.min(100, share)}%` }}></div>
                          </div>
                          <span className="font-mono text-[11px] text-gray-500">{share.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab Content: 3. BY_CATEGORY */}
      {activeTab === 'BY_CATEGORY' && (
        <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-sm font-bold text-gray-900">تقرير المبيعات حسب الأقسام والتصنيفات</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">القسم / التصنيف</th>
                  <th className="py-3 px-4 font-bold">عدد الأصناف المسجلة</th>
                  <th className="py-3 px-4 font-bold">إجمالي الوحدات المباعة</th>
                  <th className="py-3 px-4 font-bold">إجمالي الإيرادات</th>
                  <th className="py-3 px-4 font-bold">نسبة المساهمة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {categoryReport.map((cat) => {
                  const share = totalNetSales > 0 ? (cat.totalRevenue / totalNetSales) * 100 : 0;
                  return (
                    <tr key={cat.category} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-gray-900">{cat.category}</td>
                      <td className="py-3 px-4 font-mono">{cat.itemsCount} صنف</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">{cat.unitsSold} وحدة</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#006C50]">{formatCurrency(cat.totalRevenue)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">{share.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab Content: 4. BY_CASHIER */}
      {activeTab === 'BY_CASHIER' && (
        <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-sm font-bold text-gray-900">تقرير مبيعات المستخدمين والكاشير</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">اسم المستخدم / الكاشير</th>
                  <th className="py-3 px-4 font-bold">عدد الفواتير الصادرة</th>
                  <th className="py-3 px-4 font-bold">متوسط الفاتورة</th>
                  <th className="py-3 px-4 font-bold">الخصومات الممنوحة</th>
                  <th className="py-3 px-4 font-bold">الضرائب المحصلة</th>
                  <th className="py-3 px-4 font-bold">إجمالي المبيعات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {cashierReport.map((c) => {
                  const avg = c.invoicesCount > 0 ? c.totalSales / c.invoicesCount : 0;
                  return (
                    <tr key={c.name} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-gray-900">{c.name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">{c.invoicesCount} فاتورة</td>
                      <td className="py-3 px-4 font-mono">{formatCurrency(avg)}</td>
                      <td className="py-3 px-4 font-mono text-amber-700">{formatCurrency(c.totalDiscount)}</td>
                      <td className="py-3 px-4 font-mono text-gray-600">{formatCurrency(c.totalTax)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#006C50]">{formatCurrency(c.totalSales)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab Content: 5. BY_CUSTOMER */}
      {activeTab === 'BY_CUSTOMER' && (
        <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-sm font-bold text-gray-900">تقرير المبيعات حسب العميل</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">اسم العميل</th>
                  <th className="py-3 px-4 font-bold">عدد الفواتير</th>
                  <th className="py-3 px-4 font-bold">آخر معاملة</th>
                  <th className="py-3 px-4 font-bold">إجمالي المشتريات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {customerReport.map((cust) => (
                  <tr key={cust.name} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">{cust.name}</td>
                    <td className="py-3 px-4 font-mono">{cust.count} فاتورة</td>
                    <td className="py-3 px-4 font-mono text-gray-500">{formatDate(cust.lastDate)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#006C50]">{formatCurrency(cust.totalSpent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab Content: 6. BY_PAYMENT */}
      {activeTab === 'BY_PAYMENT' && (
        <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-sm font-bold text-gray-900">تقرير المبيعات حسب طرق الدفع والتحصيل</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">طريقة الدفع</th>
                  <th className="py-3 px-4 font-bold">عدد المعاملات</th>
                  <th className="py-3 px-4 font-bold">إجمالي المبلغ المحصل</th>
                  <th className="py-3 px-4 font-bold">النسبة المئوية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {paymentReport.map((p) => {
                  const share = totalGrossSales > 0 ? (p.totalAmount / totalGrossSales) * 100 : 0;
                  return (
                    <tr key={p.method} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-gray-900">{p.method}</td>
                      <td className="py-3 px-4 font-mono font-bold">{p.count} عملية</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#006C50]">{formatCurrency(p.totalAmount)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-700">{share.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab Content: 7. RETURNS */}
      {activeTab === 'RETURNS' && (
        <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900">سجل عمليات المرتجعات والاسترداد ({returns.length} عملية)</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">رقم المرتجع</th>
                  <th className="py-3 px-4 font-bold">الفاتورة الأصلية</th>
                  <th className="py-3 px-4 font-bold">التاريخ</th>
                  <th className="py-3 px-4 font-bold">الكاشير</th>
                  <th className="py-3 px-4 font-bold">العميل</th>
                  <th className="py-3 px-4 font-bold">سبب الإرجاع</th>
                  <th className="py-3 px-4 font-bold">الأصناف المستردة</th>
                  <th className="py-3 px-4 font-bold">إجمالي المبلغ المسترد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {returns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      لا توجد عمليات مرتجعات مسجلة في هذه الفترة
                    </td>
                  </tr>
                ) : (
                  returns.map((ret) => (
                    <tr key={ret.returnId} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono font-bold text-red-600">{ret.returnId}</td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-800">{ret.originalSaleId}</td>
                      <td className="py-3 px-4 font-mono">{formatDate(ret.timestamp)}</td>
                      <td className="py-3 px-4">{ret.cashierName}</td>
                      <td className="py-3 px-4">{ret.customerName || 'عميل نقدي'}</td>
                      <td className="py-3 px-4 text-gray-600">{ret.reason}</td>
                      <td className="py-3 px-4">
                        {ret.items.map((i) => (
                          <div key={i.productId} className="text-[11px] text-gray-700">
                            • {i.productName} ({i.quantity} قطعة)
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-red-600">{formatCurrency(ret.grandTotal)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab Content: 8. TAX & DISCOUNTS */}
      {activeTab === 'TAX_DISCOUNTS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#dce5df] shadow-xs">
              <div className="flex items-center gap-2 text-blue-900 font-bold mb-2">
                <Percent className="w-5 h-5 text-blue-600" />
                <span>إقرار القيمة المضافة 14% المحصلة</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                إجمالي الضريبة المحصلة من العملاء والواجب توريدها طبقاً لمنظومة الضرائب المصرية.
              </p>
              <div className="text-2xl font-black text-blue-900 font-mono">{formatCurrency(totalTax)}</div>
              <div className="text-xs text-gray-500 mt-2">من إجمالي وعاء ضريبي {formatCurrency(totalNetSales)}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#dce5df] shadow-xs">
              <div className="flex items-center gap-2 text-amber-900 font-bold mb-2">
                <Percent className="w-5 h-5 text-amber-600" />
                <span>إجمالي الخصومات والتخفيضات التجارية</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                مجموع الخصومات الممنوحة للعملاء خلال عروض البيع الترويجية.
              </p>
              <div className="text-2xl font-black text-amber-900 font-mono">{formatCurrency(totalDiscount)}</div>
              <div className="text-xs text-gray-500 mt-2">
                تم تطبيق خصم في {sales.filter((s) => s.discountAmount > 0).length} فاتورة
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab Content: 9. HOURLY */}
      {activeTab === 'HOURLY' && (
        <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-gray-900">تقرير المبيعات بالساعة (أوقات الذروة)</h4>
              <p className="text-xs text-gray-400 mt-0.5">تحليل الإقبال والمبيعات عبر ساعات اليوم</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">الساعة / الفترة</th>
                  <th className="py-3 px-4 font-bold">عدد الفواتير الصادرة</th>
                  <th className="py-3 px-4 font-bold">إجمالي مبيعات الساعة</th>
                  <th className="py-3 px-4 font-bold">مستوى النشاط</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {hourlyReport.map((h) => {
                  const isPeak = h.count >= 2 || h.total >= 1000;
                  return (
                    <tr key={h.hour} className={`hover:bg-gray-50 ${isPeak ? 'bg-emerald-50/30' : ''}`}>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">{h.label}</td>
                      <td className="py-3 px-4 font-mono">{h.count} فاتورة</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#006C50]">{formatCurrency(h.total)}</td>
                      <td className="py-3 px-4">
                        {isPeak ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                            ذروة نشاط
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px]">
                            عادي
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

      {/* Receipt Modal for Invoices */}
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
