import React, { useState } from 'react';
import {
  Vault,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Lock,
  Calendar,
  User,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Printer,
  X,
} from 'lucide-react';
import { storage } from '../services/storage';
import { CashMovementEntity, DrawerClosingEntity } from '../types';

export const TreasuryScreen: React.FC = () => {
  const [cashMovements, setCashMovements] = useState<CashMovementEntity[]>(() => storage.getAllCashMovements());
  const [drawerClosings, setDrawerClosings] = useState<DrawerClosingEntity[]>(() => storage.getAllDrawerClosings());
  const settings = storage.getSettings();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MOVEMENTS' | 'CLOSINGS'>('OVERVIEW');
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [actualCashCounted, setActualCashCounted] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState('');
  const [selectedClosingForPrint, setSelectedClosingForPrint] = useState<DrawerClosingEntity | null>(null);

  // Quick Voucher Modal
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherType, setVoucherType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  const [voucherAmount, setVoucherAmount] = useState<number>(100);
  const [voucherDesc, setVoucherDesc] = useState('');

  const refreshData = () => {
    setCashMovements(storage.getAllCashMovements());
    setDrawerClosings(storage.getAllDrawerClosings());
  };

  // Calculations
  const salesCash = storage.getAllSales()
    .filter((s) => s.paymentMethod === 'CASH' && s.status === 'COMPLETED')
    .reduce((sum, s) => sum + s.grandTotal, 0);

  const returnsCash = storage.getAllReturns()
    .reduce((sum, r) => sum + r.grandTotal, 0);

  const expensesCash = storage.getAllExpenses()
    .reduce((sum, e) => sum + e.amount, 0);

  const customerPayments = cashMovements
    .filter((c) => c.type === 'CUSTOMER_PAYMENT')
    .reduce((sum, c) => sum + c.amount, 0);

  const supplierPayments = cashMovements
    .filter((c) => c.type === 'SUPPLIER_PAYMENT')
    .reduce((sum, c) => sum + c.amount, 0);

  const customDeposits = cashMovements
    .filter((c) => c.type === 'OPENING_FLOAT')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalReceipts = salesCash + customerPayments + customDeposits;
  const totalPayouts = expensesCash + supplierPayments + returnsCash;
  const expectedCashInDrawer = Math.max(0, totalReceipts - totalPayouts);

  const handleExecuteDrawerClosing = (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = storage.getCurrentUser();
    const cashierName = currentUser ? currentUser.fullName : 'الكاشير المسؤول';
    const difference = actualCashCounted - expectedCashInDrawer;

    const closing: DrawerClosingEntity = {
      closingId: 'CLS-' + (1000 + drawerClosings.length + 1),
      date: Date.now(),
      shiftName: 'الوردية الرئيسية',
      cashierId: currentUser ? (currentUser.id || currentUser.username) : 'usr-admin',
      cashierName,
      openingCash: settings.defaultOpeningFloat || 500,
      totalSalesCash: salesCash,
      totalReturnsCash: returnsCash,
      totalExpensesCash: expensesCash,
      totalCustomerPayments: customerPayments,
      totalSupplierPayments: supplierPayments,
      expectedCash: expectedCashInDrawer,
      actualCashCounted,
      difference,
      status: difference === 0 ? 'BALANCED' : difference < 0 ? 'DEFICIT' : 'SURPLUS',
      notes: closingNotes,
    };

    storage.executeDrawerClosing(closing);
    refreshData();
    setIsClosingModalOpen(false);
    setSelectedClosingForPrint(closing);
  };

  const handleSaveVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (voucherAmount <= 0) return;

    const currentUser = storage.getCurrentUser();
    storage.insertCashMovement({
      id: 'voucher-' + Date.now(),
      type: voucherType === 'DEPOSIT' ? 'CUSTOMER_PAYMENT' : 'EXPENSE_CASH',
      amount: voucherAmount,
      description: voucherDesc || (voucherType === 'DEPOSIT' ? 'إيداع نقدي بالخزينة' : 'سحب نقدي من الخزينة'),
      timestamp: Date.now(),
      recordedBy: currentUser ? currentUser.fullName : 'مسؤول الخزينة',
    });

    storage.logAudit(
      'CASH_VOUCHER',
      'TREASURY',
      'VOUCHER-' + Date.now(),
      `${voucherType === 'DEPOSIT' ? 'إيداع' : 'سحب'} نقدي بمبلغ ${voucherAmount} ج.م`
    );

    refreshData();
    setIsVoucherModalOpen(false);
    setVoucherAmount(100);
    setVoucherDesc('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
            <Vault className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الخزينة والصندوق وتقفيل الوردية (Treasury)</h1>
            <p className="text-sm text-gray-500">
              حركة النقدية اللحظية، الرصيد الفعلي، إغلاق اليومية وحساب العجز أو الزيادة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsVoucherModalOpen(true)}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-sm flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>سند قبض / صرف نقدية</span>
          </button>
          <button
            onClick={() => {
              setActualCashCounted(expectedCashInDrawer);
              setIsClosingModalOpen(true);
            }}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow-xs flex items-center gap-2 transition-colors"
          >
            <Lock className="w-4 h-4" />
            <span>تقفيل الوردية وإغلاق اليومية</span>
          </button>
        </div>
      </div>

      {/* Big Balance Banner */}
      <div className="my-6 bg-gradient-to-r from-amber-700 to-amber-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-amber-200 block mb-1">
              الرصيد الدفتري المتوقع في درج النقدية الآن
            </span>
            <div className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              {expectedCashInDrawer.toLocaleString()} <span className="text-2xl font-normal">{settings.currencySymbol}</span>
            </div>
            <p className="text-xs text-amber-100/80 mt-2">
              حساب فوري: (المبيعات النقدية + تحصيلات العملاء + الرصيد الافتتاحي) - (المصروفات + مستحقات الموردين + المرتجعات)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
            <div>
              <span className="text-xs text-amber-200 block">إجمالي المقبوضات النقدية</span>
              <span className="text-xl font-bold font-mono">+{totalReceipts.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-xs text-amber-200 block">إجمالي المدفوعات من الدرج</span>
              <span className="text-xl font-bold font-mono">-{totalPayouts.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdowns KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 block">مبيعات نقدية (POS)</span>
          <span className="text-lg font-bold text-emerald-700 font-mono mt-1 block">
            +{salesCash.toLocaleString()} {settings.currencySymbol}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 block">تحصيل ديون عملاء</span>
          <span className="text-lg font-bold text-blue-700 font-mono mt-1 block">
            +{customerPayments.toLocaleString()} {settings.currencySymbol}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 block">سداد مشتريات موردين</span>
          <span className="text-lg font-bold text-rose-700 font-mono mt-1 block">
            -{supplierPayments.toLocaleString()} {settings.currencySymbol}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 block">مصروفات تشغيلية ونثرية</span>
          <span className="text-lg font-bold text-amber-700 font-mono mt-1 block">
            -{expensesCash.toLocaleString()} {settings.currencySymbol}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 mb-6">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'OVERVIEW' ? 'bg-amber-700 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          دفتر حركة النقدية اليومية
        </button>
        <button
          onClick={() => setActiveTab('CLOSINGS')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'CLOSINGS' ? 'bg-amber-700 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          سجل تقفيل الورديات وإغلاق اليومية
        </button>
      </div>

      {/* Journal Table */}
      {activeTab === 'OVERVIEW' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600">
              <tr>
                <th className="py-3 px-4">رقم الحركة</th>
                <th className="py-3 px-4">التاريخ والوقت</th>
                <th className="py-3 px-4">نوع الحركة</th>
                <th className="py-3 px-4">البيان والتفاصيل</th>
                <th className="py-3 px-4">المبلغ</th>
                <th className="py-3 px-4">المسؤول</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cashMovements.map((m) => {
                const isPositive =
                  m.type === 'SALE_CASH' ||
                  m.type === 'CUSTOMER_PAYMENT' ||
                  m.type === 'OPENING_FLOAT';
                return (
                  <tr key={m.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-500 font-bold">{m.id}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      {new Date(m.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} - {new Date(m.timestamp).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          isPositive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {m.type === 'SALE_CASH'
                          ? 'مبيعات كاش'
                          : m.type === 'CUSTOMER_PAYMENT'
                          ? 'قبض من عميل'
                          : m.type === 'SUPPLIER_PAYMENT'
                          ? 'صرف لمورد'
                          : m.type === 'RETURN_CASH'
                          ? 'استرداد مرتجع'
                          : m.type === 'EXPENSE_CASH'
                          ? 'صرف مصروف'
                          : 'رصيد افتتاحي'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-800">{m.description}</td>
                    <td className="py-3.5 px-4 font-bold font-mono text-xs">
                      <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>
                        {isPositive ? '+' : '-'} {m.amount.toLocaleString()} {settings.currencySymbol}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">{m.recordedBy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Closings Table */}
      {activeTab === 'CLOSINGS' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600">
              <tr>
                <th className="py-3 px-4">رقم التقفيل</th>
                <th className="py-3 px-4">تاريخ الإغلاق</th>
                <th className="py-3 px-4">الكاشير</th>
                <th className="py-3 px-4">الرصيد الدفتري</th>
                <th className="py-3 px-4">العد الفعلي للدرج</th>
                <th className="py-3 px-4">الفارق (عجز / زيادة)</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4">طباعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drawerClosings.map((c) => (
                <tr key={c.closingId} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-700">{c.closingId}</td>
                  <td className="py-3.5 px-4 text-xs text-gray-600">
                    {new Date(c.date).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-gray-900">{c.cashierName}</td>
                  <td className="py-3.5 px-4 font-mono text-xs">{c.expectedCash.toLocaleString()} {settings.currencySymbol}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-xs">{c.actualCashCounted.toLocaleString()} {settings.currencySymbol}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-xs">
                    {c.difference === 0 ? (
                      <span className="text-emerald-700">0.00 (مطابق)</span>
                    ) : c.difference > 0 ? (
                      <span className="text-blue-700">+{c.difference.toLocaleString()} (زيادة)</span>
                    ) : (
                      <span className="text-rose-700">{c.difference.toLocaleString()} (عجز)</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        c.status === 'BALANCED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'SURPLUS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {c.status === 'BALANCED' ? 'مطابق' : c.status === 'SURPLUS' ? 'فائض نقدية' : 'عجز نقدية'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => setSelectedClosingForPrint(c)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>إيصال</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer Closing Modal */}
      {isClosingModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-lg text-gray-900">إغلاق اليومية وتقفيل الوردية (Z-Report)</h3>
              </div>
              <button onClick={() => setIsClosingModalOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteDrawerClosing} className="py-4 space-y-4">
              <div className="bg-amber-50 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">الرصيد الدفتري المتوقع في الصندوق:</span>
                  <span className="font-bold font-mono text-sm text-gray-900">
                    {expectedCashInDrawer.toLocaleString()} {settings.currencySymbol}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>مقبوضات كاش (+):</span>
                  <span className="font-mono">+{totalReceipts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>مدفوعات ومصروفات (-):</span>
                  <span className="font-mono">-{totalPayouts.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  العد الفعلي للنقدية الموجودة في الدرج (ج.م) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={actualCashCounted}
                  onChange={(e) => setActualCashCounted(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-lg font-bold text-gray-900 focus:ring-2 focus:ring-amber-600"
                  required
                />
              </div>

              {/* Difference Preview */}
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between ${
                  actualCashCounted === expectedCashInDrawer
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : actualCashCounted > expectedCashInDrawer
                    ? 'bg-blue-50 text-blue-800 border border-blue-300'
                    : 'bg-rose-50 text-rose-800 border border-rose-300'
                }`}
              >
                <span>فارق الإغلاق:</span>
                <span className="text-sm font-mono">
                  {actualCashCounted - expectedCashInDrawer === 0
                    ? '0.00 (الدرج مطابق تماماً)'
                    : actualCashCounted - expectedCashInDrawer > 0
                    ? `+${(actualCashCounted - expectedCashInDrawer).toFixed(2)} (زيادة فائض نقدية)`
                    : `${(actualCashCounted - expectedCashInDrawer).toFixed(2)} (عجز نقدي في الدرج)`}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ملاحظات الكاشير أو المشرف</label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="سبب العجز أو الزيادة إن وجد..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsClosingModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-sm shadow-xs"
                >
                  تأكيد وتقفيل الوردية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voucher Modal */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <h3 className="font-bold text-lg text-gray-900">إصدار سند حركة نقدية</h3>
              <button onClick={() => setIsVoucherModalOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVoucher} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">نوع السند</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVoucherType('DEPOSIT')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      voucherType === 'DEPOSIT'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    سند قبض (إيداع نقدية)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoucherType('WITHDRAWAL')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      voucherType === 'WITHDRAWAL'
                        ? 'bg-rose-50 border-rose-500 text-rose-800'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    سند صرف (سحب نقدية)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">المبلغ (ج.م) *</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={voucherAmount}
                  onChange={(e) => setVoucherAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base font-bold text-gray-900 focus:ring-2 focus:ring-amber-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">البيان والسبب *</label>
                <input
                  type="text"
                  placeholder="عهدة نقدية، سحب أرباح، إيداع شخصي..."
                  value={voucherDesc}
                  onChange={(e) => setVoucherDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-sm shadow-xs"
                >
                  حفظ السند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Closing Receipt Modal */}
      {selectedClosingForPrint && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <h3 className="font-bold text-base text-gray-900">تقرير تقفيل الوردية {selectedClosingForPrint.closingId}</h3>
              <button onClick={() => setSelectedClosingForPrint(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-2 text-xs font-mono">
              <div className="text-center pb-2 border-b border-gray-200">
                <h4 className="font-bold text-sm text-gray-900">{settings.storeName}</h4>
                <span className="text-gray-500">تقرير إغلاق الصندوق اليومي (Z-Report)</span>
                <p className="text-[11px] text-gray-400 mt-1">
                  {new Date(selectedClosingForPrint.date).toLocaleString('ar-EG')}
                </p>
              </div>

              <div className="flex justify-between">
                <span>الكاشير المسؤول:</span>
                <span className="font-bold">{selectedClosingForPrint.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>الرصيد الافتتاحي:</span>
                <span>{selectedClosingForPrint.openingCash.toFixed(2)} {settings.currencySymbol}</span>
              </div>
              <div className="flex justify-between">
                <span>مبيعات كاش:</span>
                <span>+{selectedClosingForPrint.totalSalesCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>تحصيل عملاء:</span>
                <span>+{selectedClosingForPrint.totalCustomerPayments.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>مصروفات ومشتريات:</span>
                <span>-{(selectedClosingForPrint.totalExpensesCash + selectedClosingForPrint.totalSupplierPayments).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 font-bold">
                <span>الرصيد الدفتري المتوقع:</span>
                <span>{selectedClosingForPrint.expectedCash.toFixed(2)} {settings.currencySymbol}</span>
              </div>
              <div className="flex justify-between font-bold text-blue-900">
                <span>العد الفعلي للصندوق:</span>
                <span>{selectedClosingForPrint.actualCashCounted.toFixed(2)} {settings.currencySymbol}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-gray-200">
                <span>فارق اليومية:</span>
                <span className={selectedClosingForPrint.difference === 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {selectedClosingForPrint.difference.toFixed(2)} {settings.currencySymbol}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة الإيصال الحراري</span>
              </button>
              <button
                onClick={() => setSelectedClosingForPrint(null)}
                className="px-5 py-2 bg-amber-700 text-white rounded-xl text-xs font-bold"
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
