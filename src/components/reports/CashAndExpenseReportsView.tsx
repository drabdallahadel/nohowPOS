import React, { useState } from 'react';
import {
  Coins,
  Receipt,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Trash2,
} from 'lucide-react';
import { CashMovementEntity, ExpenseEntity, UserEntity } from '../../types';
import { formatCurrency, formatDate } from './reportUtils';
import { storage } from '../../services/storage';

interface CashAndExpenseReportsViewProps {
  cashMovements: CashMovementEntity[];
  expenses: ExpenseEntity[];
  currentUser: UserEntity | null;
  onOpenAddExpenseModal: () => void;
  onRefreshData?: () => void;
}

type CashSubTab = 'REGISTER_DAILY' | 'EXPENSES_REPORT' | 'CASH_FLOW';

export const CashAndExpenseReportsView: React.FC<CashAndExpenseReportsViewProps> = ({
  cashMovements,
  expenses,
  currentUser,
  onOpenAddExpenseModal,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<CashSubTab>('REGISTER_DAILY');

  // Compute Cash Drawer Metrics
  const openingBalance = 5000; // Standard Register Float / Opening Cash
  const cashInflows = cashMovements
    .filter((m) => m.type === 'SALE_CASH' || m.type === 'CUSTOMER_PAYMENT' || m.type === 'OPENING_FLOAT')
    .reduce((sum, m) => sum + m.amount, 0);

  const cashOutflows = cashMovements
    .filter((m) => m.type === 'EXPENSE' || m.type === 'RETURN_CASH' || m.type === 'SUPPLIER_PAYMENT')
    .reduce((sum, m) => sum + m.amount, 0);

  const netCashInRegister = openingBalance + cashInflows - cashOutflows;

  // Expenses Grouping by Category
  const expCatMap = new Map<string, { category: string; count: number; total: number }>();
  expenses.forEach((e) => {
    const existing = expCatMap.get(e.category) || { category: e.category, count: 0, total: 0 };
    existing.count += 1;
    existing.total += e.amount;
    expCatMap.set(e.category, existing);
  });
  const expenseByCategory = Array.from(expCatMap.values()).sort((a, b) => b.total - a.total);
  const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      storage.deleteExpense(id);
      if (onRefreshData) onRefreshData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Cash KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#dce5df] text-right shadow-xs">
          <span className="text-xs text-gray-500 block">رصيد الصندوق الدفتري الحالي</span>
          <span className="text-xl font-black text-[#006C50] font-mono">{formatCurrency(netCashInRegister)}</span>
          <span className="text-[11px] text-gray-400 mt-0.5 block">شامل عهدة البداية ({formatCurrency(openingBalance)})</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#dce5df] text-right shadow-xs">
          <span className="text-xs text-gray-500 block">إجمالي المقبوضات النقدية (Inflows)</span>
          <span className="text-xl font-black text-emerald-800 font-mono">{formatCurrency(cashInflows)}</span>
          <span className="text-[11px] text-emerald-700 font-bold mt-0.5 block">مبيعات نقدية وتحصيلات</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#dce5df] text-right shadow-xs">
          <span className="text-xs text-gray-500 block">إجمالي المدفوعات والمصروفات (Outflows)</span>
          <span className="text-xl font-black text-red-600 font-mono">{formatCurrency(cashOutflows)}</span>
          <span className="text-[11px] text-red-600/80 mt-0.5 block">مصروفات ومرتجعات</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#dce5df] text-right shadow-xs">
          <span className="text-xs text-gray-500 block">صافي التدفق النقدي (Net Flow)</span>
          <span className={`text-xl font-black font-mono ${cashInflows - cashOutflows >= 0 ? 'text-blue-900' : 'text-red-600'}`}>
            {formatCurrency(cashInflows - cashOutflows)}
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5 block">فائض / عجز الفترة</span>
        </div>
      </div>

      {/* Subtabs and Quick Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('REGISTER_DAILY')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'REGISTER_DAILY'
                ? 'bg-[#006C50] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            سجل حركة الصندوق والخزينة
          </button>
          <button
            onClick={() => setActiveTab('EXPENSES_REPORT')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'EXPENSES_REPORT'
                ? 'bg-[#006C50] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            تقرير المصروفات حسب البنود
          </button>
          <button
            onClick={() => setActiveTab('CASH_FLOW')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'CASH_FLOW'
                ? 'bg-[#006C50] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            تحليل السيولة والتدفق النقدي
          </button>
        </div>

        <button
          onClick={onOpenAddExpenseModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#006C50] hover:bg-[#00543e] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>تسجيل مصروف جديد</span>
        </button>
      </div>

      {/* 1. REGISTER DAILY TAB */}
      {activeTab === 'REGISTER_DAILY' && (
        <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900">
              كشف حركات الصندوق النقدي التفصيلية ({cashMovements.length} حركة)
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">التاريخ والوقت</th>
                  <th className="py-3 px-4 font-bold">نوع الحركة</th>
                  <th className="py-3 px-4 font-bold">البيان / الوصف</th>
                  <th className="py-3 px-4 font-bold">المستخدم المسؤول</th>
                  <th className="py-3 px-4 font-bold">المقبوضات (+)</th>
                  <th className="py-3 px-4 font-bold">المدفوعات (-)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {cashMovements.map((m) => {
                  const isInflow = m.type === 'SALE_CASH' || m.type === 'CUSTOMER_PAYMENT' || m.type === 'OPENING_FLOAT';
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono">{formatDate(m.timestamp)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            isInflow ? 'bg-emerald-50 text-[#006C50]' : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {isInflow ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {m.type === 'SALE_CASH'
                            ? 'إيراد مبيعات'
                            : m.type === 'CUSTOMER_PAYMENT'
                            ? 'تحصيل عميل'
                            : m.type === 'OPENING_FLOAT'
                            ? 'رصيد افتتاحي'
                            : m.type === 'RETURN_CASH'
                            ? 'استرداد مرتجع'
                            : 'مصروفات عامة'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-800">{m.description}</td>
                      <td className="py-3 px-4 text-gray-600">{m.recordedBy}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#006C50]">
                        {isInflow ? formatCurrency(m.amount) : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-red-600">
                        {!isInflow ? formatCurrency(m.amount) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. EXPENSES REPORT TAB */}
      {activeTab === 'EXPENSES_REPORT' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {expenseByCategory.map((cat) => (
              <div key={cat.category} className="bg-white p-4 rounded-xl border border-[#dce5df] shadow-xs">
                <span className="text-xs text-gray-500 block">{cat.category}</span>
                <span className="text-lg font-black text-gray-900 font-mono mt-0.5 block">
                  {formatCurrency(cat.total)}
                </span>
                <span className="text-[11px] text-gray-400 mt-1 block">{cat.count} سندات صرف</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-900">جدول سندات المصروفات ({expenses.length} سند)</h4>
              <span className="text-xs font-mono font-bold text-red-600">
                الإجمالي: {formatCurrency(totalExpensesAmount)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 font-bold">التاريخ</th>
                    <th className="py-3 px-4 font-bold">بند المصروف</th>
                    <th className="py-3 px-4 font-bold">الوصف والتفاصيل</th>
                    <th className="py-3 px-4 font-bold">المسؤول عن الصرف</th>
                    <th className="py-3 px-4 font-bold">المبلغ</th>
                    <th className="py-3 px-4 font-bold text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono">{formatDate(e.timestamp)}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{e.category}</td>
                      <td className="py-3 px-4 text-gray-700">{e.description}</td>
                      <td className="py-3 px-4 text-gray-500">{e.recordedBy}</td>
                      <td className="py-3 px-4 font-mono font-bold text-red-600">{formatCurrency(e.amount)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteExpense(e.id)}
                          className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors cursor-pointer"
                          title="حذف سند المصروف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. CASH FLOW TAB */}
      {activeTab === 'CASH_FLOW' && (
        <div className="bg-white rounded-2xl border border-[#dce5df] p-6 shadow-xs max-w-3xl mx-auto space-y-4">
          <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
            <h4 className="text-base font-bold text-gray-900">تقرير التدفقات النقدية والسيولة (Cash Flow Statement)</h4>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2.5 bg-gray-50 px-3 rounded-lg font-bold text-gray-900">
              <span>رصيد أول المدة (Opening Float)</span>
              <span className="font-mono">{formatCurrency(openingBalance)}</span>
            </div>

            <div className="pt-2 font-bold text-[#006C50] text-sm">التدفقات النقدية الداخلة (+)</div>
            <div className="flex justify-between py-2 border-b border-gray-100 pr-4">
              <span>مبيعات الصندوق النقدية المحصلة</span>
              <span className="font-mono font-bold text-[#006C50]">{formatCurrency(cashInflows)}</span>
            </div>

            <div className="pt-2 font-bold text-red-600 text-sm">التدفقات النقدية الخارجة (-)</div>
            <div className="flex justify-between py-2 border-b border-gray-100 pr-4">
              <span>المصروفات التشغيلية والنثريات</span>
              <span className="font-mono font-bold text-red-600">-{formatCurrency(totalExpensesAmount)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 pr-4">
              <span>المبالغ المستردة للمرتجعات النقدية</span>
              <span className="font-mono font-bold text-red-600">
                -{formatCurrency(cashMovements.filter((m) => m.type === 'RETURN_CASH').reduce((s, m) => s + m.amount, 0))}
              </span>
            </div>

            <div className="flex justify-between py-4 bg-gray-900 text-white px-4 rounded-xl font-bold text-sm mt-4">
              <div>
                <span className="text-base">رصيد الإغلاق الدفتري للخزينة (Ending Cash)</span>
                <span className="text-xs font-normal block text-gray-300">السيولة المتاحة فعلياً بالصندوق</span>
              </div>
              <span className="font-mono font-black text-emerald-400 text-lg">{formatCurrency(netCashInRegister)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
