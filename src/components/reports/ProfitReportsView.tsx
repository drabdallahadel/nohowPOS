import React, { useState } from 'react';
import {
  TrendingUp,
  Percent,
  Lock,
  Boxes,
  HelpCircle,
} from 'lucide-react';
import { SaleEntity, SaleItemEntity, ProductEntity, ExpenseEntity, UserEntity } from '../../types';
import { formatCurrency, formatDate } from './reportUtils';

interface ProfitReportsViewProps {
  sales: SaleEntity[];
  saleItems: SaleItemEntity[];
  products: ProductEntity[];
  expenses: ExpenseEntity[];
  currentUser: UserEntity | null;
}

type ProfitSubTab = 'SUMMARY' | 'BY_ITEM' | 'BY_INVOICE' | 'BY_CATEGORY';

export const ProfitReportsView: React.FC<ProfitReportsViewProps> = ({
  sales,
  saleItems,
  products,
  expenses,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<ProfitSubTab>('SUMMARY');

  // Role Protection: Only OWNER or ADMIN can view financial profit margins
  const hasAccess = currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN';

  if (!hasAccess) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center max-w-lg mx-auto shadow-xs my-12">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">صلاحية محجوبة</h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          تقارير الأرباح وتكاليف البضاعة المباعة (COGS) وهوامش الربحية وصافي الدخل مقتصرة حصرياً على{' '}
          <span className="font-bold text-emerald-800">مدير النظام والمالك (OWNER / ADMIN)</span>.
        </p>
        <div className="mt-4 text-xs text-gray-400 font-mono">حسابك الحالي: {currentUser?.role}</div>
      </div>
    );
  }

  const productMap = new Map<string, ProductEntity>(products.map((p) => [p.id, p]));

  // 1. Total Financial Calculations
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0); // Net sales without VAT
  const totalTax = sales.reduce((sum, s) => sum + s.taxAmount, 0);
  const totalGrossRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);

  // COGS Calculation (Cost of Goods Sold)
  const totalCOGS = saleItems.reduce((sum, item) => {
    const prod = productMap.get(item.productId);
    const purchasePrice = prod ? prod.purchasePrice : 0;
    return sum + purchasePrice * item.quantity;
  }, 0);

  const totalGrossProfit = totalRevenue - totalCOGS;
  const grossMarginPercent = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalGrossProfit - totalExpenses;
  const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // 2. Profit by Item
  const itemProfitMap = new Map<
    string,
    {
      id: string;
      name: string;
      category: string;
      unitsSold: number;
      purchasePrice: number;
      salePrice: number;
      revenue: number;
      cogs: number;
      grossProfit: number;
      marginPercent: number;
    }
  >();

  saleItems.forEach((item) => {
    const prod = productMap.get(item.productId);
    const purchasePrice = prod ? prod.purchasePrice : 0;
    const salePrice = item.unitPrice;
    const existing = itemProfitMap.get(item.productId) || {
      id: item.productId,
      name: item.productName,
      category: prod?.category || 'أخرى',
      unitsSold: 0,
      purchasePrice,
      salePrice,
      revenue: 0,
      cogs: 0,
      grossProfit: 0,
      marginPercent: 0,
    };

    existing.unitsSold += item.quantity;
    existing.revenue += item.totalPrice;
    existing.cogs += purchasePrice * item.quantity;
    existing.grossProfit = existing.revenue - existing.cogs;
    existing.marginPercent = existing.revenue > 0 ? (existing.grossProfit / existing.revenue) * 100 : 0;

    itemProfitMap.set(item.productId, existing);
  });

  const itemProfitReport = Array.from(itemProfitMap.values()).sort((a, b) => b.grossProfit - a.grossProfit);

  // 3. Profit by Invoice
  const invoiceProfitReport = sales.map((sale) => {
    const items = saleItems.filter((i) => i.saleId === sale.saleId);
    const cost = items.reduce((sum, i) => {
      const prod = productMap.get(i.productId);
      return sum + (prod ? prod.purchasePrice * i.quantity : 0);
    }, 0);
    const profit = sale.totalAmount - cost;
    const margin = sale.totalAmount > 0 ? (profit / sale.totalAmount) * 100 : 0;
    return {
      saleId: sale.saleId,
      timestamp: sale.timestamp,
      cashier: sale.cashierName,
      customer: sale.customerName || 'عميل نقدي',
      revenue: sale.totalAmount,
      cost,
      profit,
      margin,
    };
  }).sort((a, b) => b.profit - a.profit);

  // 4. Profit by Category
  const catProfitMap = new Map<string, { category: string; revenue: number; cogs: number; profit: number }>();
  itemProfitReport.forEach((item) => {
    const existing = catProfitMap.get(item.category) || {
      category: item.category,
      revenue: 0,
      cogs: 0,
      profit: 0,
    };
    existing.revenue += item.revenue;
    existing.cogs += item.cogs;
    existing.profit += item.grossProfit;
    catProfitMap.set(item.category, existing);
  });
  const categoryProfitReport = Array.from(catProfitMap.values()).map((c) => ({
    ...c,
    margin: c.revenue > 0 ? (c.profit / c.revenue) * 100 : 0,
  })).sort((a, b) => b.profit - a.profit);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#dce5df] shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold">صافي المبيعات (بدون ضريبة)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006C50] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 font-mono">{formatCurrency(totalRevenue)}</div>
          <span className="text-xs text-gray-400 mt-1 block">شامل الضريبة: {formatCurrency(totalGrossRevenue)}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#dce5df] shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold">تكلفة البضاعة المباعة (COGS)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-800 font-mono">{formatCurrency(totalCOGS)}</div>
          <span className="text-xs text-gray-400 mt-1 block">تكلفة شراء الأصناف المباعة</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#dce5df] shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold">إجمالي الربح التجاري (Gross)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-900 font-mono">{formatCurrency(totalGrossProfit)}</div>
          <span className="text-xs text-emerald-700 font-bold mt-1 block">
            هامش ربح إجمالي: {grossMarginPercent.toFixed(1)}%
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#dce5df] shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold">صافي الربح بعد المصروفات (Net)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black font-mono ${netProfit >= 0 ? 'text-[#006C50]' : 'text-red-600'}`}>
            {formatCurrency(netProfit)}
          </div>
          <span className="text-xs text-gray-500 mt-1 block">
            بعد خصم المصروفات ({formatCurrency(totalExpenses)})
          </span>
        </div>
      </div>

      {/* Subtabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('SUMMARY')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'SUMMARY'
              ? 'bg-[#006C50] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          قائمة الدخل والأرباح (P&L)
        </button>
        <button
          onClick={() => setActiveTab('BY_ITEM')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'BY_ITEM'
              ? 'bg-[#006C50] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          ربحية الأصناف
        </button>
        <button
          onClick={() => setActiveTab('BY_INVOICE')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'BY_INVOICE'
              ? 'bg-[#006C50] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          ربحية الفواتير
        </button>
        <button
          onClick={() => setActiveTab('BY_CATEGORY')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'BY_CATEGORY'
              ? 'bg-[#006C50] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          ربحية الأقسام
        </button>
      </div>

      {/* Subtab 1: SUMMARY (Income Statement / P&L) */}
      {activeTab === 'SUMMARY' && (
        <div className="bg-white rounded-2xl border border-[#dce5df] p-6 shadow-xs max-w-3xl mx-auto space-y-4">
          <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
            <h4 className="text-base font-bold text-gray-900">بيان الأرباح والخسائر التقديري (Income Statement)</h4>
            <span className="text-xs text-gray-400 font-mono">العملة: جنيه مصري (EGP)</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="font-bold text-gray-800">إجمالي المبيعات (شامل الضريبة)</span>
              <span className="font-mono font-bold">{formatCurrency(totalGrossRevenue)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100 text-gray-600">
              <span>(يخصم) ضريبة القيمة المضافة 14%</span>
              <span className="font-mono font-bold text-blue-800">-{formatCurrency(totalTax)}</span>
            </div>

            <div className="flex justify-between py-2.5 bg-gray-50 px-3 rounded-lg font-bold text-gray-900">
              <span>صافي الإيرادات التجارية</span>
              <span className="font-mono">{formatCurrency(totalRevenue)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100 text-amber-900">
              <span>(يخصم) تكلفة البضاعة المباعة (تكلفة الشراء)</span>
              <span className="font-mono font-bold text-amber-800">-{formatCurrency(totalCOGS)}</span>
            </div>

            <div className="flex justify-between py-3 bg-emerald-50/70 border border-emerald-200 px-3 rounded-xl font-bold text-emerald-950 text-sm">
              <div>
                <span>إجمالي الربح التجاري (Gross Profit)</span>
                <span className="text-[11px] font-normal block text-emerald-700">هامش الربح التجاري: {grossMarginPercent.toFixed(1)}%</span>
              </div>
              <span className="font-mono font-black text-[#006C50] text-base">{formatCurrency(totalGrossProfit)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100 text-gray-600">
              <span>(يخصم) إجمالي المصروفات التشغيلية والعمومية</span>
              <span className="font-mono font-bold text-red-600">-{formatCurrency(totalExpenses)}</span>
            </div>

            <div className="flex justify-between py-4 bg-gray-900 text-white px-4 rounded-xl font-bold text-sm">
              <div>
                <span className="text-base">صافي الربح التشغيلي (Net Profit)</span>
                <span className="text-xs font-normal block text-gray-300">هامش الربح الصافي: {netMarginPercent.toFixed(1)}%</span>
              </div>
              <span className="font-mono font-black text-emerald-400 text-lg">{formatCurrency(netProfit)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: BY_ITEM */}
      {activeTab === 'BY_ITEM' && (
        <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-sm font-bold text-gray-900">تحليل ربحية الأصناف المباعة بالتفصيل</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">اسم الصنف</th>
                  <th className="py-3 px-4 font-bold">القسم</th>
                  <th className="py-3 px-4 font-bold">سعر الشراء</th>
                  <th className="py-3 px-4 font-bold">سعر البيع</th>
                  <th className="py-3 px-4 font-bold">ربح القطعة</th>
                  <th className="py-3 px-4 font-bold">الكمية المباعة</th>
                  <th className="py-3 px-4 font-bold">إجمالي الربح</th>
                  <th className="py-3 px-4 font-bold">هامش الربح %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {itemProfitReport.map((item) => {
                  const unitProfit = item.salePrice - item.purchasePrice;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-gray-900">{item.name}</td>
                      <td className="py-3 px-4 text-gray-500">{item.category}</td>
                      <td className="py-3 px-4 font-mono">{formatCurrency(item.purchasePrice)}</td>
                      <td className="py-3 px-4 font-mono">{formatCurrency(item.salePrice)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">{formatCurrency(unitProfit)}</td>
                      <td className="py-3 px-4 font-mono">{item.unitsSold} وحدة</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#006C50]">{formatCurrency(item.grossProfit)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">{item.marginPercent.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 3: BY_INVOICE */}
      {activeTab === 'BY_INVOICE' && (
        <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-sm font-bold text-gray-900">تقرير أرباح كل فاتورة مبيعات على حدة</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">رقم الفاتورة</th>
                  <th className="py-3 px-4 font-bold">التاريخ</th>
                  <th className="py-3 px-4 font-bold">العميل</th>
                  <th className="py-3 px-4 font-bold">الكاشير</th>
                  <th className="py-3 px-4 font-bold">قيمة الفاتورة</th>
                  <th className="py-3 px-4 font-bold">تكلفة الأصناف</th>
                  <th className="py-3 px-4 font-bold">صافي ربح الفاتورة</th>
                  <th className="py-3 px-4 font-bold">نسبة الربح %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {invoiceProfitReport.map((inv) => (
                  <tr key={inv.saleId} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">{inv.saleId}</td>
                    <td className="py-3 px-4 font-mono text-gray-500">{formatDate(inv.timestamp)}</td>
                    <td className="py-3 px-4">{inv.customer}</td>
                    <td className="py-3 px-4">{inv.cashier}</td>
                    <td className="py-3 px-4 font-mono">{formatCurrency(inv.revenue)}</td>
                    <td className="py-3 px-4 font-mono text-amber-800">{formatCurrency(inv.cost)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#006C50]">{formatCurrency(inv.profit)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">{inv.margin.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 4: BY_CATEGORY */}
      {activeTab === 'BY_CATEGORY' && (
        <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-sm font-bold text-gray-900">تقرير ربحية الأقسام والتصنيفات</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">القسم / التصنيف</th>
                  <th className="py-3 px-4 font-bold">إجمالي الإيرادات</th>
                  <th className="py-3 px-4 font-bold">تكلفة الشراء (COGS)</th>
                  <th className="py-3 px-4 font-bold">إجمالي الأرباح</th>
                  <th className="py-3 px-4 font-bold">هامش الربح %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {categoryProfitReport.map((cat) => (
                  <tr key={cat.category} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">{cat.category}</td>
                    <td className="py-3 px-4 font-mono">{formatCurrency(cat.revenue)}</td>
                    <td className="py-3 px-4 font-mono text-amber-800">{formatCurrency(cat.cogs)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#006C50]">{formatCurrency(cat.profit)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">{cat.margin.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
