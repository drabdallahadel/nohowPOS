import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  RotateCcw,
  ShoppingBag,
  Percent,
  Clock,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { SaleEntity, SaleItemEntity, ProductEntity, ReturnEntity, ExpenseEntity } from '../../types';
import { formatCurrency } from './reportUtils';

interface VisualAnalyticsViewProps {
  sales: SaleEntity[];
  saleItems: SaleItemEntity[];
  products: ProductEntity[];
  returns: ReturnEntity[];
  expenses: ExpenseEntity[];
  dateRangeLabel: string;
}

const CATEGORY_COLORS = ['#006C50', '#2563EB', '#D97706', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];
const PAYMENT_COLORS: Record<string, string> = {
  'نقداً (CASH)': '#006C50',
  'بطاقة (CARD)': '#2563EB',
  'آجل (CREDIT)': '#D97706',
};

export const VisualAnalyticsView: React.FC<VisualAnalyticsViewProps> = ({
  sales,
  saleItems,
  products,
  returns,
  expenses,
  dateRangeLabel,
}) => {
  // Aggregate KPI Metrics
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalInvoicesCount = sales.length;
  const averageTicket = totalInvoicesCount > 0 ? totalSalesRevenue / totalInvoicesCount : 0;
  const totalReturnsAmount = returns.reduce((sum, r) => sum + r.grandTotal, 0);
  const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Compute Cost of Goods Sold (COGS) for sales
  const productMap = new Map<string, ProductEntity>(products.map((p) => [p.id, p]));
  const totalCost = saleItems.reduce((sum, item) => {
    const prod = productMap.get(item.productId);
    const purchasePrice = prod ? prod.purchasePrice : 0;
    return sum + purchasePrice * item.quantity;
  }, 0);

  const totalGrossProfit = totalSalesRevenue - totalCost - (sales.reduce((sum, s) => sum + s.taxAmount, 0));
  const profitMargin = totalSalesRevenue > 0 ? (totalGrossProfit / totalSalesRevenue) * 100 : 0;
  const netProfit = totalGrossProfit - totalExpensesAmount;

  // Chart 1: Daily Revenue Trend
  const dailyDataMap = new Map<string, { date: string; sales: number; count: number }>();
  sales.forEach((s) => {
    const dateStr = new Date(s.timestamp).toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' });
    const existing = dailyDataMap.get(dateStr) || { date: dateStr, sales: 0, count: 0 };
    existing.sales += s.grandTotal;
    existing.count += 1;
    dailyDataMap.set(dateStr, existing);
  });
  const dailyTrendData = Array.from(dailyDataMap.values()).slice(-10);

  // Chart 2: Sales by Category
  const catSalesMap = new Map<string, number>();
  saleItems.forEach((item) => {
    const prod = productMap.get(item.productId);
    const cat = prod?.category || 'أخرى';
    catSalesMap.set(cat, (catSalesMap.get(cat) || 0) + item.totalPrice);
  });
  const categoryData = Array.from(catSalesMap.entries()).map(([name, value]) => ({
    name,
    value: Math.round(value),
  }));

  // Chart 3: Top 5 Best Selling Items
  const itemQtyMap = new Map<string, { name: string; qty: number; revenue: number }>();
  saleItems.forEach((item) => {
    const existing = itemQtyMap.get(item.productId) || { name: item.productName, qty: 0, revenue: 0 };
    existing.qty += item.quantity;
    existing.revenue += item.totalPrice;
    itemQtyMap.set(item.productId, existing);
  });
  const topProductsData = Array.from(itemQtyMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Chart 4: Payment Methods Breakdown
  const paymentMap: Record<string, number> = {
    'نقداً (CASH)': 0,
    'بطاقة (CARD)': 0,
    'آجل (CREDIT)': 0,
  };
  sales.forEach((s) => {
    if (s.paymentMethod === 'CASH') paymentMap['نقداً (CASH)'] += s.grandTotal;
    else if (s.paymentMethod === 'CARD') paymentMap['بطاقة (CARD)'] += s.grandTotal;
    else paymentMap['آجل (CREDIT)'] += s.grandTotal;
  });
  const paymentData = Object.entries(paymentMap).map(([name, value]) => ({
    name,
    value: Math.round(value),
  }));

  // Chart 5: Peak Hours Distribution (00 to 23)
  const hoursMap = new Array(24).fill(0);
  sales.forEach((s) => {
    const h = new Date(s.timestamp).getHours();
    hoursMap[h] += s.grandTotal;
  });
  const peakHoursData = hoursMap
    .map((amount, hour) => ({
      hour: `${hour}:00`,
      amount: Math.round(amount),
    }))
    .filter((_, idx) => idx >= 8 && idx <= 23); // Standard business hours

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#dce5df] shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold">إجمالي المبيعات ({dateRangeLabel})</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006C50] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 font-mono">
            {formatCurrency(totalSalesRevenue)}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
            <span>{totalInvoicesCount} فاتورة</span>
            <span>•</span>
            <span>متوسط: {formatCurrency(averageTicket)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#dce5df] shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold">إجمالي الأرباح التقديرية</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-900 font-mono">
            {formatCurrency(totalGrossProfit)}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
            <span className="text-emerald-700 font-bold">هامش الربح: {profitMargin.toFixed(1)}%</span>
            <span>•</span>
            <span>تكلفة: {formatCurrency(totalCost)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#dce5df] shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold">صافي الربح بعد المصروفات</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black font-mono ${netProfit >= 0 ? 'text-[#006C50]' : 'text-red-600'}`}>
            {formatCurrency(netProfit)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            المصروفات: {formatCurrency(totalExpensesAmount)}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#dce5df] shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold">إجمالي المرتجعات</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono">
            {formatCurrency(totalReturnsAmount)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {returns.length} عمليات استرداد مسجلة
          </div>
        </div>
      </div>

      {/* Row 1: Revenue Timeline & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#dce5df] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#006C50]" />
                <span>حركة المبيعات اليومية (ج.م)</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">تطور حجم المبيعات الإجمالي خلال الفترة</p>
            </div>
            <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
              {dailyTrendData.length} أيام مسجلة
            </span>
          </div>

          <div className="h-64 w-full">
            {dailyTrendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                لا توجد مبيعات في الفترة المحددة
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#006C50" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#006C50" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#6B7280" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#6B7280" />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString()} ج.م`, 'المبيعات']}
                    labelFormatter={(label) => `التاريخ: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#006C50"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Donut/Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-[#dce5df] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-emerald-600" />
                <span>المبيعات حسب القسم</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">نسبة مشاركة الأقسام في الإيراد</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                لا توجد بيانات أصناف
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value.toLocaleString()} ج.م`, 'المبيعات']} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Top Selling Products & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Products Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#dce5df] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>أعلى 5 أصناف تحقيقاً للإيرادات</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">الأصناف الأكثر مبيعاً وقيمة خلال الفترة</p>
            </div>
            <ShoppingBag className="w-4 h-4 text-gray-400" />
          </div>

          <div className="h-64 w-full">
            {topProductsData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                لا توجد مبيعات أصناف
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#6B7280" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 10 }}
                    width={140}
                    stroke="#6B7280"
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString()} ج.م`, 'إجمالي الإيراد']}
                  />
                  <Bar dataKey="revenue" fill="#006C50" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-5 rounded-2xl border border-[#dce5df] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-amber-600" />
                <span>طرق التحصيل والدفع</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">توزيع النقد والبطاقات والآجل</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="value"
                  label={({ name, percent }) => `${name.split(' ')[0]} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {paymentData.map((entry) => (
                    <Cell key={entry.name} fill={PAYMENT_COLORS[entry.name] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value.toLocaleString()} ج.م`, 'القيمة']} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Peak Hours */}
      <div className="bg-white p-5 rounded-2xl border border-[#dce5df] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#006C50]" />
              <span>أوقات الذروة والمبيعات بالساعة</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">توزيع حجم المبيعات على مدار ساعات العمل اليومية لمعرفة فترات الإقبال الأكبر</p>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={peakHoursData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#6B7280" />
              <YAxis tick={{ fontSize: 10 }} stroke="#6B7280" />
              <Tooltip formatter={(value: number) => [`${value.toLocaleString()} ج.م`, 'مبيعات الساعة']} />
              <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
