import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  DollarSign,
  Phone,
  Mail,
  User,
  X,
  FileText,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { storage } from '../services/storage';
import { SupplierEntity, PurchaseBillEntity } from '../types';

export const SuppliersScreen: React.FC = () => {
  const [suppliers, setSuppliers] = useState<SupplierEntity[]>(() => storage.getAllSuppliers());
  const [purchases] = useState<PurchaseBillEntity[]>(() => storage.getAllPurchases());
  const settings = storage.getSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSupplierForStatement, setSelectedSupplierForStatement] = useState<SupplierEntity | null>(null);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutSupplier, setPayoutSupplier] = useState<SupplierEntity | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutNotes, setPayoutNotes] = useState('');

  // New Supplier Form
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCreditLimit, setNewCreditLimit] = useState<number>(20000);

  const refreshData = () => {
    setSuppliers(storage.getAllSuppliers());
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newSup: SupplierEntity = {
      id: 'sup-' + (suppliers.length + 101),
      name: newName.trim(),
      companyName: newCompany.trim() || newName.trim(),
      contactPerson: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim(),
      balance: 0,
      currentBalance: 0,
      creditLimit: newCreditLimit,
      lastTransactionDate: Date.now(),
    };

    const currentList = storage.getAllSuppliers();
    currentList.push(newSup);
    storage.setItem('micropos_suppliers', currentList);
    storage.logAudit('ADD_SUPPLIER', 'SUPPLIER', newSup.id, `إضافة مورد جديد: ${newSup.name} (${newSup.companyName})`);

    refreshData();
    setIsAddModalOpen(false);
    setNewName('');
    setNewCompany('');
    setNewPhone('');
    setNewEmail('');
  };

  const handleRecordPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutSupplier || payoutAmount <= 0) return;

    const currentList = storage.getAllSuppliers();
    const idx = currentList.findIndex((s) => s.id === payoutSupplier.id);
    if (idx >= 0) {
      currentList[idx].balance = Math.max(0, currentList[idx].balance - payoutAmount);
      currentList[idx].currentBalance = currentList[idx].balance;
      currentList[idx].lastTransactionDate = Date.now();
      storage.setItem('micropos_suppliers', currentList);

      // Record cash payout in Treasury
      const currentUser = storage.getCurrentUser();
      storage.insertCashMovement({
        id: 'cash-sup-payout-' + Date.now(),
        type: 'SUPPLIER_PAYMENT',
        amount: payoutAmount,
        description: `سند صرف نقدية للمورد: ${payoutSupplier.name} (${payoutNotes || 'سداد مستحقات'})`,
        timestamp: Date.now(),
        recordedBy: currentUser ? currentUser.fullName : 'مسؤول الخزينة',
      });

      storage.logAudit(
        'SUPPLIER_PAYMENT',
        'SUPPLIER',
        payoutSupplier.id,
        `صرف مبلغ ${payoutAmount} ج.م للمورد ${payoutSupplier.name} من الخزينة`
      );

      refreshData();
      setIsPayoutModalOpen(false);
      setPayoutSupplier(null);
      setPayoutAmount(0);
      setPayoutNotes('');
    }
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery)
  );

  const totalDues = suppliers.reduce((sum, s) => sum + s.balance, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-700 text-white flex items-center justify-center shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">سجل الموردين والشركات (Suppliers)</h1>
            <p className="text-sm text-gray-500">
              متابعة الشركات والموردين، كشوفات الحساب، وسندات صرف المستحقات
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مورد جديد</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 block">عدد الموردين والشركات</span>
          <div className="mt-2 text-2xl font-bold text-gray-900">{suppliers.length} مورد</div>
          <span className="text-xs text-amber-600 mt-1 block">شركات أدوية ومستلزمات</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 block">إجمالي المستحقات للموردين</span>
          <div className="mt-2 text-2xl font-bold text-rose-700">
            {totalDues.toLocaleString()} {settings.currencySymbol}
          </div>
          <span className="text-xs text-rose-600 mt-1 block">ديون آجلة واجبة السداد</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 block">فواتير التوريد المسجلة</span>
          <div className="mt-2 text-2xl font-bold text-indigo-700">{purchases.length} فاتورة</div>
          <span className="text-xs text-indigo-600 mt-1 block">مشتريات واردة للمخازن</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3.5" />
          <input
            type="text"
            placeholder="بحث باسم المورد أو الشركة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-amber-600 focus:border-transparent"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600">
              <tr>
                <th className="py-3 px-4">اسم المورد / الشركة</th>
                <th className="py-3 px-4">الهاتف والتواصل</th>
                <th className="py-3 px-4">مسؤول الاتصال</th>
                <th className="py-3 px-4">المستحق له (الرصيد الدائن)</th>
                <th className="py-3 px-4">الحد الائتماني</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSuppliers.map((sup) => (
                <tr key={sup.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div>
                      <span className="font-bold text-gray-900 block">{sup.name}</span>
                      <span className="text-xs text-gray-500">{sup.companyName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-gray-600">{sup.phone}</td>
                  <td className="py-3.5 px-4 text-xs text-gray-700">{sup.contactPerson || '—'}</td>
                  <td className="py-3.5 px-4 font-bold text-xs font-mono">
                    <span className={sup.balance > 0 ? 'text-rose-700' : 'text-gray-500'}>
                      {sup.balance.toLocaleString()} {settings.currencySymbol}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-gray-600">
                    {sup.creditLimit.toLocaleString()} {settings.currencySymbol}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-center gap-2">
                      {sup.balance > 0 && (
                        <button
                          onClick={() => {
                            setPayoutSupplier(sup);
                            setPayoutAmount(sup.balance);
                            setIsPayoutModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>صرف دفعة</span>
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedSupplierForStatement(sup)}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>كشف حساب</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <h3 className="font-bold text-lg text-gray-900">إضافة مورد أو شركة توريد جديدة</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">اسم المورد / الشهرة *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">اسم الشركة التجارية</label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">رقم الهاتف *</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">سقف الائتمان المتوقع</label>
                  <input
                    type="number"
                    min="0"
                    value={newCreditLimit}
                    onChange={(e) => setNewCreditLimit(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-amber-600"
                  />
                </div>
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
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-sm shadow-xs"
                >
                  حفظ المورد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {isPayoutModalOpen && payoutSupplier && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <h3 className="font-bold text-lg text-gray-900">سند صرف نقدية للمورد</h3>
              <button onClick={() => setIsPayoutModalOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayout} className="py-4 space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl">
                <span className="text-xs text-amber-700 block">المورد المستلم:</span>
                <span className="font-bold text-gray-900 text-base">{payoutSupplier.name}</span>
                <div className="mt-1 text-xs text-gray-600">
                  إجمالي المستحق له: <span className="font-bold text-rose-700">{payoutSupplier.balance.toLocaleString()} {settings.currencySymbol}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">المبلغ المنصرف (ج.م) *</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max={payoutSupplier.balance}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base font-bold text-amber-900 focus:ring-2 focus:ring-amber-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ملاحظات الصرف والتحويل</label>
                <input
                  type="text"
                  placeholder="دفعة شيك، تحويل بنكي، إيصال استلام..."
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-sm shadow-xs"
                >
                  تأكيد الصرف من الخزينة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Statement Modal */}
      {selectedSupplierForStatement && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <h3 className="font-bold text-lg text-gray-900">كشف حساب المورد التفصيلي</h3>
                <span className="text-xs text-gray-500">{selectedSupplierForStatement.name} ({selectedSupplierForStatement.companyName})</span>
              </div>
              <button onClick={() => setSelectedSupplierForStatement(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-gray-500 block">الهاتف:</span>
                  <span className="font-bold text-gray-900">{selectedSupplierForStatement.phone}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">الرصيد المستحق الحالي:</span>
                  <span className="font-bold text-rose-700 text-sm">{selectedSupplierForStatement.balance.toLocaleString()} {settings.currencySymbol}</span>
                </div>
              </div>

              <h4 className="text-xs font-bold text-gray-700">سجل فواتير التوريد من المورد:</h4>
              <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-gray-100 font-bold text-gray-700">
                    <tr>
                      <th className="py-2 px-3">رقم الفاتورة</th>
                      <th className="py-2 px-3">التاريخ</th>
                      <th className="py-2 px-3">إجمالي الفاتورة</th>
                      <th className="py-2 px-3">المدفوع</th>
                      <th className="py-2 px-3">المتبقي دائن</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {purchases
                      .filter((p) => p.supplierId === selectedSupplierForStatement.id)
                      .map((pur) => (
                        <tr key={pur.purchaseId}>
                          <td className="py-2 px-3 font-mono font-bold text-amber-700">{pur.purchaseId}</td>
                          <td className="py-2 px-3">{new Date(pur.date).toLocaleDateString('ar-EG')}</td>
                          <td className="py-2 px-3 font-bold">{pur.grandTotal.toLocaleString()} {settings.currencySymbol}</td>
                          <td className="py-2 px-3 text-emerald-700 font-semibold">{pur.paidAmount.toLocaleString()}</td>
                          <td className="py-2 px-3 text-rose-700 font-bold">{pur.remainingAmount.toLocaleString()}</td>
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
                onClick={() => setSelectedSupplierForStatement(null)}
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
