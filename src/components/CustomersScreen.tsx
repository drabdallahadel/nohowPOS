import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  DollarSign,
  AlertTriangle,
  Phone,
  MapPin,
  FileText,
  X,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  Receipt,
} from 'lucide-react';
import { storage } from '../services/storage';
import { CustomerEntity, SaleEntity } from '../types';

export const CustomersScreen: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerEntity[]>(() => storage.getAllCustomers());
  const [sales] = useState<SaleEntity[]>(() => storage.getAllSales());
  const settings = storage.getSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomerForStatement, setSelectedCustomerForStatement] = useState<CustomerEntity | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<CustomerEntity | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState('');

  // New Customer State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newTaxNumber, setNewTaxNumber] = useState('');
  const [newCreditLimit, setNewCreditLimit] = useState<number>(5000);

  const refreshData = () => {
    setCustomers(storage.getAllCustomers());
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newCust: CustomerEntity = {
      id: 'cust-' + (customers.length + 101),
      name: newName.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim(),
      taxNumber: newTaxNumber.trim(),
      balance: 0,
      creditLimit: newCreditLimit,
      totalPurchases: 0,
      lastTransactionDate: Date.now(),
    };

    const currentList = storage.getAllCustomers();
    currentList.push(newCust);
    storage.setItem('micropos_customers', currentList);
    storage.logAudit('ADD_CUSTOMER', 'CUSTOMER', newCust.id, `إضافة عميل جديد: ${newCust.name} بحد ائتماني ${newCust.creditLimit} ج.م`);

    refreshData();
    setIsAddModalOpen(false);
    setNewName('');
    setNewPhone('');
    setNewAddress('');
    setNewTaxNumber('');
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer || paymentAmount <= 0) return;

    const currentList = storage.getAllCustomers();
    const idx = currentList.findIndex((c) => c.id === paymentCustomer.id);
    if (idx >= 0) {
      currentList[idx].balance = Math.max(0, currentList[idx].balance - paymentAmount);
      currentList[idx].lastTransactionDate = Date.now();
      storage.setItem('micropos_customers', currentList);

      // Record in Treasury (Cash Movement)
      const currentUser = storage.getCurrentUser();
      storage.insertCashMovement({
        id: 'cash-cust-pay-' + Date.now(),
        type: 'CUSTOMER_PAYMENT',
        amount: paymentAmount,
        description: `سند قبض نقدية من العميل: ${paymentCustomer.name} (${paymentNotes || 'سداد مديونية'})`,
        timestamp: Date.now(),
        recordedBy: currentUser ? currentUser.fullName : 'مسؤول الخزينة',
      });

      storage.logAudit(
        'CUSTOMER_PAYMENT',
        'CUSTOMER',
        paymentCustomer.id,
        `تحصيل مبلغ ${paymentAmount} ج.م من العميل ${paymentCustomer.name} وتوريده للخزينة`
      );

      refreshData();
      setIsPaymentModalOpen(false);
      setPaymentCustomer(null);
      setPaymentAmount(0);
      setPaymentNotes('');
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const totalDebts = customers.reduce((sum, c) => sum + c.balance, 0);
  const overLimitCount = customers.filter((c) => c.creditLimit > 0 && c.balance > c.creditLimit).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-700 text-white flex items-center justify-center shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة العملاء والحسابات المدينة (CRM)</h1>
            <p className="text-sm text-gray-500">
              ملفات العملاء، كشوفات الحساب، الحدود الائتمانية، وتحصيل المديونيات
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 block">إجمالي عدد العملاء</span>
          <div className="mt-2 text-2xl font-bold text-gray-900">{customers.length} عميل</div>
          <span className="text-xs text-blue-600 mt-1 block">نشطين في النظام</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 block">إجمالي مديونيات العملاء</span>
          <div className="mt-2 text-2xl font-bold text-rose-700">
            {totalDebts.toLocaleString()} {settings.currencySymbol}
          </div>
          <span className="text-xs text-rose-600 mt-1 block">حسابات آجلة مستحقة القبض</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 block">تجاوز الحد الائتماني</span>
          <div className="mt-2 text-2xl font-bold text-amber-700">{overLimitCount} عميل</div>
          <span className="text-xs text-amber-600 mt-1 block">يتطلب متابعة التحصيل فوراً</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3.5" />
          <input
            type="text"
            placeholder="بحث باسم العميل أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600">
              <tr>
                <th className="py-3 px-4">اسم العميل</th>
                <th className="py-3 px-4">الهاتف</th>
                <th className="py-3 px-4">العنوان</th>
                <th className="py-3 px-4">الحد الائتماني</th>
                <th className="py-3 px-4">الرصيد المدين (المستحق)</th>
                <th className="py-3 px-4">إجمالي المشتريات</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.map((cust) => {
                const isOverLimit = cust.creditLimit > 0 && cust.balance > cust.creditLimit;
                return (
                  <tr key={cust.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{cust.name}</span>
                        {isOverLimit && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>تجاوز الحد</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-gray-600">{cust.phone}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">{cust.address || '—'}</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-gray-700">
                      {cust.creditLimit.toLocaleString()} {settings.currencySymbol}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-xs font-mono">
                      <span className={cust.balance > 0 ? 'text-rose-700' : 'text-gray-500'}>
                        {cust.balance.toLocaleString()} {settings.currencySymbol}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600 font-mono">
                      {cust.totalPurchases.toLocaleString()} {settings.currencySymbol}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {cust.balance > 0 && (
                          <button
                            onClick={() => {
                              setPaymentCustomer(cust);
                              setPaymentAmount(cust.balance);
                              setIsPaymentModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>تحصيل</span>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedCustomerForStatement(cust)}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>كشف حساب</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <h3 className="font-bold text-lg text-gray-900">إضافة عميل جديد</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">اسم العميل / الشركة *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الحد الائتماني (أقصى دين)</label>
                  <input
                    type="number"
                    min="0"
                    value={newCreditLimit}
                    onChange={(e) => setNewCreditLimit(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">العنوان</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الرقم الضريبي (إن وجد)</label>
                <input
                  type="text"
                  value={newTaxNumber}
                  onChange={(e) => setNewTaxNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-sm shadow-xs"
                >
                  حفظ العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {isPaymentModalOpen && paymentCustomer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <h3 className="font-bold text-lg text-gray-900">سند قبض نقدية من العميل</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="py-4 space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl">
                <span className="text-xs text-blue-700 block">العميل:</span>
                <span className="font-bold text-gray-900 text-base">{paymentCustomer.name}</span>
                <div className="mt-1 text-xs text-gray-600">
                  الرصيد المدين الحالي: <span className="font-bold text-rose-700">{paymentCustomer.balance.toLocaleString()} {settings.currencySymbol}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">المبلغ المحصل (ج.م) *</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max={paymentCustomer.balance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ملاحظات التحصيل</label>
                <input
                  type="text"
                  placeholder="سداد دفعة تحت الحساب، رقم الشيك..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-xs"
                >
                  تأكيد القبض وإيداع بالخزينة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Statement Modal */}
      {selectedCustomerForStatement && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <h3 className="font-bold text-lg text-gray-900">كشف حساب العميل التفصيلي</h3>
                <span className="text-xs text-gray-500">{selectedCustomerForStatement.name} - {selectedCustomerForStatement.phone}</span>
              </div>
              <button onClick={() => setSelectedCustomerForStatement(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-gray-500 block">الحد الائتماني:</span>
                  <span className="font-bold text-gray-900">{selectedCustomerForStatement.creditLimit.toLocaleString()} {settings.currencySymbol}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">إجمالي المشتريات:</span>
                  <span className="font-bold text-gray-900">{selectedCustomerForStatement.totalPurchases.toLocaleString()} {settings.currencySymbol}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">الرصيد المتبقي:</span>
                  <span className="font-bold text-rose-700">{selectedCustomerForStatement.balance.toLocaleString()} {settings.currencySymbol}</span>
                </div>
              </div>

              <h4 className="text-xs font-bold text-gray-700">حركات المبيعات والتعاملات:</h4>
              <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-gray-100 font-bold text-gray-700">
                    <tr>
                      <th className="py-2 px-3">رقم الفاتورة</th>
                      <th className="py-2 px-3">التاريخ</th>
                      <th className="py-2 px-3">طريقة الدفع</th>
                      <th className="py-2 px-3">القيمة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sales
                      .filter((s) => s.customerId === selectedCustomerForStatement.id)
                      .map((sale) => (
                        <tr key={sale.saleId}>
                          <td className="py-2 px-3 font-mono font-bold text-blue-700">{sale.saleId}</td>
                          <td className="py-2 px-3">{new Date(sale.timestamp).toLocaleDateString('ar-EG')}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100">
                              {sale.paymentMethod}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-bold text-gray-900">
                            {sale.grandTotal.toLocaleString()} {settings.currencySymbol}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold hover:bg-gray-50"
              >
                طباعة كشف الحساب
              </button>
              <button
                onClick={() => setSelectedCustomerForStatement(null)}
                className="px-5 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold"
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
