import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Receipt,
  Boxes,
  Coins,
  Users,
  PieChart,
  FileSpreadsheet,
  Printer,
  Calendar,
} from 'lucide-react';
import {
  SaleEntity,
  SaleItemEntity,
  ProductEntity,
  StockMovementEntity,
  ExpenseEntity,
  CustomerEntity,
  SupplierEntity,
  ReturnEntity,
  CashMovementEntity,
  UserEntity,
  ReportFilterState,
} from '../types';
import { storage } from '../services/storage';
import { ReportFilterBar } from './reports/ReportFilterBar';
import { VisualAnalyticsView } from './reports/VisualAnalyticsView';
import { SalesReportsView } from './reports/SalesReportsView';
import { ProfitReportsView } from './reports/ProfitReportsView';
import { InventoryReportsView } from './reports/InventoryReportsView';
import { CashAndExpenseReportsView } from './reports/CashAndExpenseReportsView';
import { PartnersReportsView } from './reports/PartnersReportsView';
import { AddExpenseModal } from './reports/AddExpenseModal';
import { ProcessReturnModal } from './reports/ProcessReturnModal';
import { PrintReportModal } from './reports/PrintReportModal';
import {
  getDateRangeTimestamps,
  exportToCSV,
  formatCurrency,
  formatDate,
} from './reports/reportUtils';

interface ReportsScreenProps {
  currentUser: UserEntity | null;
}

type MainReportCategory =
  | 'VISUAL'
  | 'SALES'
  | 'PROFITS'
  | 'INVENTORY'
  | 'EXPENSES'
  | 'PARTNERS';

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ currentUser }) => {
  const [activeCategory, setActiveCategory] = useState<MainReportCategory>('VISUAL');

  // Filter State
  const [filters, setFilters] = useState<ReportFilterState>({
    datePreset: 'THIS_MONTH',
    startDate: '',
    endDate: '',
    cashier: 'ALL',
    category: 'ALL',
    paymentMethod: 'ALL',
    searchQuery: '',
  });

  // Raw Database Records
  const [sales, setSales] = useState<SaleEntity[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItemEntity[]>([]);
  const [products, setProducts] = useState<ProductEntity[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovementEntity[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntity[]>([]);
  const [customers, setCustomers] = useState<CustomerEntity[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierEntity[]>([]);
  const [returns, setReturns] = useState<ReturnEntity[]>([]);
  const [cashMovements, setCashMovements] = useState<CashMovementEntity[]>([]);

  // Modals
  const [showAddExpense, setShowAddExpense] = useState<boolean>(false);
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [printModalData, setPrintModalData] = useState<{
    title: string;
    headers: string[];
    rows: (string | number)[][];
    metrics?: { label: string; value: string }[];
  } | null>(null);

  // Load Data
  const loadAllData = () => {
    setSales(storage.getAllSales());
    setSaleItems(storage.getAllSaleItems());
    setProducts(storage.getAllProducts());
    setStockMovements(storage.getStockMovements());
    setExpenses(storage.getAllExpenses());
    setCustomers(storage.getAllCustomers());
    setSuppliers(storage.getAllSuppliers());
    setReturns(storage.getAllReturns());
    setCashMovements(storage.getAllCashMovements());
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Distinct Cashiers and Categories for Filter Dropdowns
  const distinctCashiers = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => s.cashierName && set.add(s.cashierName));
    return Array.from(set);
  }, [sales]);

  const distinctCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set);
  }, [products]);

  // Apply Date Range and Dropdown Filters
  const { start: startTs, end: endTs, label: dateRangeLabel } = useMemo(() => {
    return getDateRangeTimestamps(filters.datePreset, filters.startDate, filters.endDate);
  }, [filters.datePreset, filters.startDate, filters.endDate]);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      // Date filter
      if (s.timestamp < startTs || s.timestamp > endTs) return false;
      // Cashier filter
      if (filters.cashier !== 'ALL' && s.cashierName !== filters.cashier) return false;
      // Payment method filter
      if (filters.paymentMethod !== 'ALL' && s.paymentMethod !== filters.paymentMethod) return false;
      // Search query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchId = s.saleId.toLowerCase().includes(q);
        const matchCustomer = (s.customerName || '').toLowerCase().includes(q);
        if (!matchId && !matchCustomer) return false;
      }
      return true;
    });
  }, [sales, startTs, endTs, filters.cashier, filters.paymentMethod, filters.searchQuery]);

  const filteredSaleIds = useMemo(() => new Set(filteredSales.map((s) => s.saleId)), [filteredSales]);

  const filteredSaleItems = useMemo(() => {
    const productCatMap = new Map(products.map((p) => [p.id, p.category]));
    return saleItems.filter((item) => {
      if (!filteredSaleIds.has(item.saleId)) return false;
      if (filters.category !== 'ALL') {
        const cat = productCatMap.get(item.productId);
        if (cat !== filters.category) return false;
      }
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        if (!item.productName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [saleItems, filteredSaleIds, products, filters.category, filters.searchQuery]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (e.timestamp < startTs || e.timestamp > endTs) return false;
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        return (
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.recordedBy.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [expenses, startTs, endTs, filters.searchQuery]);

  const filteredReturns = useMemo(() => {
    return returns.filter((r) => {
      if (r.timestamp < startTs || r.timestamp > endTs) return false;
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        return (
          r.returnId.toLowerCase().includes(q) ||
          r.originalSaleId.toLowerCase().includes(q) ||
          (r.customerName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [returns, startTs, endTs, filters.searchQuery]);

  const filteredCashMovements = useMemo(() => {
    return cashMovements.filter((m) => {
      if (m.timestamp < startTs || m.timestamp > endTs) return false;
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        return m.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [cashMovements, startTs, endTs, filters.searchQuery]);

  // Export to Excel CSV Handler
  const handleExportCurrentView = () => {
    if (activeCategory === 'SALES' || activeCategory === 'VISUAL') {
      const headers = ['رقم الفاتورة', 'التاريخ والوقت', 'الكاشير', 'العميل', 'طريقة الدفع', 'الخصم', 'الضريبة', 'الإجمالي'];
      const rows = filteredSales.map((s) => [
        s.saleId,
        formatDate(s.timestamp),
        s.cashierName,
        s.customerName || 'عميل نقدي',
        s.paymentMethod,
        s.discountAmount,
        s.taxAmount,
        s.grandTotal,
      ]);
      exportToCSV(`تقرير_المبيعات_${dateRangeLabel}`, headers, rows);
    } else if (activeCategory === 'PROFITS') {
      const productMap = new Map<string, ProductEntity>(products.map((p) => [p.id, p]));
      const headers = ['اسم الصنف', 'القسم', 'سعر الشراء', 'سعر البيع', 'الكمية المباعة', 'إجمالي الإيراد', 'إجمالي الربح'];
      const rows = filteredSaleItems.map((item) => {
        const prod = productMap.get(item.productId);
        const cost = (prod?.purchasePrice || 0) * item.quantity;
        const profit = item.totalPrice - cost;
        return [
          item.productName,
          prod?.category || 'أخرى',
          prod?.purchasePrice || 0,
          item.unitPrice,
          item.quantity,
          item.totalPrice,
          profit,
        ];
      });
      exportToCSV(`تقرير_الأرباح_${dateRangeLabel}`, headers, rows);
    } else if (activeCategory === 'INVENTORY') {
      const headers = ['اسم الصنف', 'الباركود', 'القسم', 'الرصيد الحالي', 'حد الأمان', 'سعر الشراء', 'سعر البيع', 'قيمة التكلفة'];
      const rows = products.map((p) => [
        p.name,
        p.barcode,
        p.category,
        p.currentStock,
        p.minStockLimit,
        p.purchasePrice,
        p.salePrice,
        p.currentStock * p.purchasePrice,
      ]);
      exportToCSV('تقرير_جرد_المخزون', headers, rows);
    } else if (activeCategory === 'EXPENSES') {
      const headers = ['التاريخ', 'البند', 'الوصف', 'المسؤول', 'المبلغ'];
      const rows = filteredExpenses.map((e) => [
        formatDate(e.timestamp),
        e.category,
        e.description,
        e.recordedBy,
        e.amount,
      ]);
      exportToCSV(`تقرير_المصروفات_${dateRangeLabel}`, headers, rows);
    } else if (activeCategory === 'PARTNERS') {
      const headers = ['اسم العميل', 'رقم الهاتف', 'حد الائتمان', 'المديونية الحالية', 'آخر معاملة'];
      const rows = customers.map((c) => [
        c.name,
        c.phone,
        c.creditLimit,
        c.currentBalance,
        formatDate(c.lastTransactionDate),
      ]);
      exportToCSV('تقرير_أرصدة_العملاء', headers, rows);
    }
  };

  // Print Report Handler
  const handlePrintCurrentView = () => {
    if (activeCategory === 'SALES' || activeCategory === 'VISUAL') {
      const headers = ['رقم الفاتورة', 'التاريخ', 'الكاشير', 'العميل', 'طريقة الدفع', 'الضريبة', 'الإجمالي'];
      const rows = filteredSales.map((s) => [
        s.saleId,
        formatDate(s.timestamp),
        s.cashierName,
        s.customerName || 'عميل نقدي',
        s.paymentMethod === 'CASH' ? 'نقداً' : s.paymentMethod === 'CARD' ? 'بطاقة' : 'آجل',
        formatCurrency(s.taxAmount),
        formatCurrency(s.grandTotal),
      ]);
      const total = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
      setPrintModalData({
        title: 'تقرير مبيعات الفواتير التفصيلي',
        headers,
        rows,
        metrics: [
          { label: 'إجمالي المبيعات', value: formatCurrency(total) },
          { label: 'عدد الفواتير', value: `${filteredSales.length} فاتورة` },
        ],
      });
    } else if (activeCategory === 'PROFITS') {
      const headers = ['الصنف', 'سعر الشراء', 'سعر البيع', 'الكمية', 'إجمالي الإيراد', 'إجمالي الربح'];
      const productMap = new Map<string, ProductEntity>(products.map((p) => [p.id, p]));
      const rows = filteredSaleItems.slice(0, 30).map((item) => {
        const prod = productMap.get(item.productId);
        const profit = item.totalPrice - ((prod?.purchasePrice || 0) * item.quantity);
        return [
          item.productName,
          formatCurrency(prod?.purchasePrice || 0),
          formatCurrency(item.unitPrice),
          item.quantity,
          formatCurrency(item.totalPrice),
          formatCurrency(profit),
        ];
      });
      setPrintModalData({
        title: 'تقرير أرباح الأصناف وهوامش الربحية',
        headers,
        rows,
      });
    } else if (activeCategory === 'INVENTORY') {
      const headers = ['اسم الصنف', 'القسم', 'الرصيد', 'سعر الشراء', 'إجمالي التكلفة', 'سعر البيع'];
      const rows = products.map((p) => [
        p.name,
        p.category,
        p.currentStock,
        formatCurrency(p.purchasePrice),
        formatCurrency(p.currentStock * p.purchasePrice),
        formatCurrency(p.salePrice),
      ]);
      setPrintModalData({
        title: 'تقرير جرد وتقييم مخزون الصيدلية والأعلاف',
        headers,
        rows,
        metrics: [
          { label: 'إجمالي الأصناف', value: `${products.length} صنف` },
          { label: 'إجمالي الوحدات', value: `${products.reduce((s, p) => s + p.currentStock, 0)} وحدة` },
        ],
      });
    } else if (activeCategory === 'EXPENSES') {
      const headers = ['التاريخ', 'بند المصروف', 'البيان', 'المسؤول', 'المبلغ'];
      const rows = filteredExpenses.map((e) => [
        formatDate(e.timestamp),
        e.category,
        e.description,
        e.recordedBy,
        formatCurrency(e.amount),
      ]);
      const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
      setPrintModalData({
        title: 'تقرير المصروفات وسندات الصرف',
        headers,
        rows,
        metrics: [{ label: 'إجمالي المصروفات', value: formatCurrency(total) }],
      });
    } else if (activeCategory === 'PARTNERS') {
      const headers = ['اسم العميل', 'رقم الهاتف', 'حد الائتمان', 'المديونية الحالية'];
      const rows = customers.map((c) => [
        c.name,
        c.phone,
        formatCurrency(c.creditLimit),
        formatCurrency(c.currentBalance),
      ]);
      const totalDebt = customers.reduce((s, c) => s + c.currentBalance, 0);
      setPrintModalData({
        title: 'كشف مديونيات وأرصدة العملاء',
        headers,
        rows,
        metrics: [{ label: 'إجمالي مديونيات العملاء', value: formatCurrency(totalDebt) }],
      });
    }
  };

  const mainCategories: { id: MainReportCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'VISUAL', label: 'اللوحة التحليلية والرسوم البيانية', icon: <PieChart className="w-4 h-4" /> },
    { id: 'SALES', label: 'تقارير المبيعات والمرتجعات', icon: <Receipt className="w-4 h-4" /> },
    { id: 'PROFITS', label: 'الأرباح وقائمة الدخل (P&L)', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'INVENTORY', label: 'تقارير المخزون والجرد', icon: <Boxes className="w-4 h-4" /> },
    { id: 'EXPENSES', label: 'المصروفات وحركة الصندوق', icon: <Coins className="w-4 h-4" /> },
    { id: 'PARTNERS', label: 'العملاء والموردين والديون', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[#f7f9f8] space-y-5">
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-[#dce5df] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006C50] flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">مركز التقارير والتحليلات المالية</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                تحليل شامل ومتكامل للمبيعات، الأرباح، التكاليف، المخزون، والمصروفات مع تصدير وطباعة
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Quick Badges */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-mono font-bold bg-emerald-50 text-[#006C50] px-3 py-1.5 rounded-xl border border-emerald-200">
            {filteredSales.length} فاتورة مسجلة
          </span>
        </div>
      </div>

      {/* Main Categories Switcher Tabs */}
      <div className="bg-white rounded-2xl border border-[#dce5df] p-2 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {mainCategories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#006C50] text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Global Filter Bar */}
      <ReportFilterBar
        filters={filters}
        onFilterChange={setFilters}
        cashiers={distinctCashiers}
        categories={distinctCategories}
        onExportExcel={handleExportCurrentView}
        onPrint={handlePrintCurrentView}
      />

      {/* Active Tab View */}
      {activeCategory === 'VISUAL' && (
        <VisualAnalyticsView
          sales={filteredSales}
          saleItems={filteredSaleItems}
          products={products}
          returns={filteredReturns}
          expenses={filteredExpenses}
          dateRangeLabel={dateRangeLabel}
        />
      )}

      {activeCategory === 'SALES' && (
        <SalesReportsView
          sales={filteredSales}
          saleItems={filteredSaleItems}
          products={products}
          returns={filteredReturns}
          onOpenReturnModal={() => setShowReturnModal(true)}
        />
      )}

      {activeCategory === 'PROFITS' && (
        <ProfitReportsView
          sales={filteredSales}
          saleItems={filteredSaleItems}
          products={products}
          expenses={filteredExpenses}
          currentUser={currentUser}
        />
      )}

      {activeCategory === 'INVENTORY' && (
        <InventoryReportsView
          products={products}
          stockMovements={stockMovements}
          saleItems={saleItems}
          onRefreshData={loadAllData}
        />
      )}

      {activeCategory === 'EXPENSES' && (
        <CashAndExpenseReportsView
          cashMovements={filteredCashMovements}
          expenses={filteredExpenses}
          currentUser={currentUser}
          onOpenAddExpenseModal={() => setShowAddExpense(true)}
          onRefreshData={loadAllData}
        />
      )}

      {activeCategory === 'PARTNERS' && (
        <PartnersReportsView
          customers={customers}
          suppliers={suppliers}
          sales={sales}
          onRefreshData={loadAllData}
        />
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <AddExpenseModal
          onClose={() => setShowAddExpense(false)}
          onExpenseAdded={loadAllData}
          currentUser={currentUser}
        />
      )}

      {/* Process Return Modal */}
      {showReturnModal && (
        <ProcessReturnModal
          onClose={() => setShowReturnModal(false)}
          onReturnProcessed={loadAllData}
          currentUser={currentUser}
        />
      )}

      {/* Print Report Preview Modal */}
      {printModalData && (
        <PrintReportModal
          reportTitle={printModalData.title}
          dateRangeLabel={dateRangeLabel}
          currentUser={currentUser}
          headers={printModalData.headers}
          rows={printModalData.rows}
          summaryMetrics={printModalData.metrics}
          onClose={() => setPrintModalData(null)}
        />
      )}
    </div>
  );
};
