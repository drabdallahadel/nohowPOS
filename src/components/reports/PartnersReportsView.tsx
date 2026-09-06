import React, { useState } from 'react';
import {
  Users,
  Building2,
  DollarSign,
  AlertCircle,
  Search,
} from 'lucide-react';
import { CustomerEntity, SupplierEntity, SaleEntity } from '../../types';
import { formatCurrency, formatDate } from './reportUtils';
import { storage } from '../../services/storage';

interface PartnersReportsViewProps {
  customers: CustomerEntity[];
  suppliers: SupplierEntity[];
  sales: SaleEntity[];
  onRefreshData?: () => void;
}

type PartnerSubTab = 'CUSTOMERS' | 'SUPPLIERS' | 'AGING_DEBTS';

export const PartnersReportsView: React.FC<PartnersReportsViewProps> = ({
  customers,
  suppliers,
  sales,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<PartnerSubTab>('CUSTOMERS');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');

  // Payment quick dialog state
  const [paymentModalCustomer, setPaymentModalCustomer] = useState<CustomerEntity | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Computed Partner Metrics
  const totalCustomerDebt = customers.reduce((sum, c) => sum + c.currentBalance, 0);
  const totalSupplierDue = suppliers.reduce((sum, s) => sum + s.currentBalance, 0);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];
  const customerSales = sales.filter((s) => s.customerId === selectedCustomerId || s.customerName === selectedCustomer?.name);

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];

  const handleRecordCustomerPayment = () => {
    if (!paymentModalCustomer || paymentAmount <= 0) return;

    const newBalance = Math.max(0, paymentModalCustomer.currentBalance - paymentAmount);
    const updatedCustomer: CustomerEntity = {
      ...paymentModalCustomer,
      currentBalance: newBalance,
      lastTransactionDate: Date.now(),
    };

    storage.updateCustomer(updatedCustomer);

    // Record cash inflow
    storage.insertCashMovement({
      id: 'cash-pmt-' + Date.now(),
      type: 'CUSTOMER_PAYMENT',
      amount: paymentAmount,
      description: `دفعة سداد مديونية من العميل: ${paymentModalCustomer.name}`,
      timestamp: Date.now(),
      recordedBy: 'مدير النظام',
    });

    setPaymentModalCustomer(null);
    setPaymentAmount(0);
    if (onRefreshData) onRefreshData();
  };

  return (
    <div className="space-y-6">
      {/* Top Partner Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#dce5df] text-right shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-bold">إجمالي مديونيات العملاء (ذمم مدينة)</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-black text-amber-900 font-mono">{formatCurrency(totalCustomerDebt)}</span>
          <span className="text-xs text-gray-400 mt-1 block">{customers.length} عملاء مسجلين</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#dce5df] text-right shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-bold">إجمالي مستحقات الموردين (ذمم دائنة)</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-black text-blue-900 font-mono">{formatCurrency(totalSupplierDue)}</span>
          <span className="text-xs text-gray-400 mt-1 block">{suppliers.length} موردين معتمدين</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#dce5df] text-right shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-bold">صافي المركز المالي للشركاء</span>
            <DollarSign className="w-4 h-4 text-[#006C50]" />
          </div>
          <span className={`text-2xl font-black font-mono ${totalCustomerDebt - totalSupplierDue >= 0 ? 'text-[#006C50]' : 'text-red-600'}`}>
            {formatCurrency(totalCustomerDebt - totalSupplierDue)}
          </span>
          <span className="text-xs text-gray-400 mt-1 block">رصيد ديون العملاء ناقص التزامات الموردين</span>
        </div>
      </div>

      {/* Subtabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('CUSTOMERS')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'CUSTOMERS'
              ? 'bg-[#006C50] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          أرصدة وكشوف حسابات العملاء
        </button>
        <button
          onClick={() => setActiveTab('SUPPLIERS')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'SUPPLIERS'
              ? 'bg-[#006C50] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          أرصدة وكشوف الموردين
        </button>
        <button
          onClick={() => setActiveTab('AGING_DEBTS')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'AGING_DEBTS'
              ? 'bg-[#006C50] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          تقرير أعمار الديون والمطالبات
        </button>
      </div>

      {/* 1. CUSTOMERS TAB */}
      {activeTab === 'CUSTOMERS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-900">جدول أرصدة العملاء والمديونيات</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 font-bold">اسم العميل</th>
                    <th className="py-3 px-4 font-bold">رقم الهاتف</th>
                    <th className="py-3 px-4 font-bold">حد الائتمان</th>
                    <th className="py-3 px-4 font-bold">الرصيد المتبقي (المديونية)</th>
                    <th className="py-3 px-4 font-bold">آخر معاملة</th>
                    <th className="py-3 px-4 font-bold text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {customers.map((c) => {
                    const isOverLimit = c.currentBalance > c.creditLimit;
                    return (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-bold text-gray-900">{c.name}</td>
                        <td className="py-3 px-4 font-mono text-gray-600">{c.phone}</td>
                        <td className="py-3 px-4 font-mono">{formatCurrency(c.creditLimit)}</td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-800">
                          {formatCurrency(c.currentBalance)}
                          {isOverLimit && (
                            <span className="mr-2 text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-bold">
                              تجاوز الحد
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-500">{formatDate(c.lastTransactionDate)}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setPaymentModalCustomer(c);
                              setPaymentAmount(c.currentBalance);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-[#006C50] text-[#006C50] hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            سداد دفعة
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Detailed Statement */}
          <div className="bg-white p-5 rounded-2xl border border-[#dce5df] shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700">عرض كشف حساب تفصيلي للعميل:</span>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (مديونية: {formatCurrency(c.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomer && (
                <div className="text-xs font-bold text-gray-600 font-mono">
                  الرصيد المستحق: <span className="text-amber-800 text-sm font-black">{formatCurrency(selectedCustomer.currentBalance)}</span>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3 font-bold">رقم الفاتورة</th>
                    <th className="py-2.5 px-3 font-bold">التاريخ</th>
                    <th className="py-2.5 px-3 font-bold">طريقة الدفع</th>
                    <th className="py-2.5 px-3 font-bold">قيمة الفاتورة</th>
                    <th className="py-2.5 px-3 font-bold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {customerSales.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400">
                        لا توجد فواتير سابقة لهذا العميل
                      </td>
                    </tr>
                  ) : (
                    customerSales.map((s) => (
                      <tr key={s.saleId} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-mono font-bold">{s.saleId}</td>
                        <td className="py-2.5 px-3 font-mono text-gray-500">{formatDate(s.timestamp)}</td>
                        <td className="py-2.5 px-3 font-mono">{s.paymentMethod}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#006C50]">{formatCurrency(s.grandTotal)}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-700">مكتملة</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. SUPPLIERS TAB */}
      {activeTab === 'SUPPLIERS' && (
        <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-sm font-bold text-gray-900">سجل أرصدة الموردين والشركات ({suppliers.length} مورد)</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">اسم الشركة / المورد</th>
                  <th className="py-3 px-4 font-bold">مسؤول الاتصال</th>
                  <th className="py-3 px-4 font-bold">رقم الهاتف</th>
                  <th className="py-3 px-4 font-bold">الرصيد الدائن المستحق للمورد</th>
                  <th className="py-3 px-4 font-bold">تاريخ آخر توريد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">{s.name}</td>
                    <td className="py-3 px-4 text-gray-600">{s.contactPerson}</td>
                    <td className="py-3 px-4 font-mono text-gray-500">{s.phone}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">{formatCurrency(s.currentBalance)}</td>
                    <td className="py-3 px-4 font-mono text-gray-500">{formatDate(s.lastTransactionDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. AGING DEBTS TAB */}
      {activeTab === 'AGING_DEBTS' && (
        <div className="bg-white rounded-2xl border border-[#dce5df] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-sm font-bold text-gray-900">تقرير أعمار ديون العملاء (Aging Schedule)</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-bold">العميل</th>
                  <th className="py-3 px-4 font-bold">إجمالي المديونية</th>
                  <th className="py-3 px-4 font-bold">1 - 30 يوم</th>
                  <th className="py-3 px-4 font-bold">31 - 60 يوم</th>
                  <th className="py-3 px-4 font-bold">أكثر من 90 يوم (ديون حرجة)</th>
                  <th className="py-3 px-4 font-bold">حالة المتابعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {customers.map((c) => {
                  const debt = c.currentBalance;
                  const currentBucket = debt > 2000 ? debt * 0.4 : debt;
                  const midBucket = debt > 2000 ? debt * 0.4 : 0;
                  const oldBucket = debt > 2000 ? debt * 0.2 : 0;

                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-gray-900">{c.name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-900">{formatCurrency(debt)}</td>
                      <td className="py-3 px-4 font-mono text-emerald-800">{formatCurrency(currentBucket)}</td>
                      <td className="py-3 px-4 font-mono text-amber-700">{formatCurrency(midBucket)}</td>
                      <td className="py-3 px-4 font-mono text-red-600 font-bold">{formatCurrency(oldBucket)}</td>
                      <td className="py-3 px-4">
                        {oldBucket > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3" />
                            يلزم الاتصال والتحصيل
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-500 font-medium">ضمن النطاق المعتاد</span>
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

      {/* Customer Payment Modal */}
      {paymentModalCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl text-right">
            <h3 className="text-base font-bold text-gray-900">تسجيل دفعة سداد للعميل</h3>
            <p className="text-xs text-gray-600">
              العميل: <span className="font-bold text-gray-900">{paymentModalCustomer.name}</span>
              <br />
              المديونية الحالية: <span className="font-mono font-bold text-red-600">{formatCurrency(paymentModalCustomer.currentBalance)}</span>
            </p>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">المبلغ المسدد (ج.م):</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPaymentModalCustomer(null)}
                className="px-3.5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                إلغاء
              </button>
              <button
                onClick={handleRecordCustomerPayment}
                className="px-4 py-2 bg-[#006C50] hover:bg-[#00543e] text-white text-xs font-bold rounded-xl"
              >
                تأكيد السداد وتحديث الصندوق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
