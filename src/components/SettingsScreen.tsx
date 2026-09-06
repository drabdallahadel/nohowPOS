import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  Receipt,
  ShieldAlert,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Layers,
  Barcode,
  Clock,
  User,
  Search,
  Check,
} from 'lucide-react';
import { storage } from '../services/storage';
import { AppSettingsEntity, AuditLogEntity } from '../types';

export const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<AppSettingsEntity>(() => storage.getSettings());
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'INVOICE' | 'INVENTORY' | 'BACKUP' | 'AUDIT'>('GENERAL');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntity[]>(() => storage.getAllAuditLogs());
  const [auditSearch, setAuditSearch] = useState('');
  const [restoreStatus, setRestoreStatus] = useState<{ success: boolean; msg: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setAuditLogs(storage.getAllAuditLogs());
  }, [activeTab]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = storage.updateSettings(settings);
    setSettings(updated);
    setSaveMessage('تم حفظ وتطبيق جميع الإعدادات بنجاح!');
    setTimeout(() => setSaveMessage(null), 3500);
  };

  const handleExportBackup = () => {
    const json = storage.exportBackupJson();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `micropos_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const res = storage.restoreBackupJson(text);
        if (res.success) {
          setRestoreStatus({ success: true, msg: 'تمت استعادة البيانات بنجاح! يتم الآن تحديث النظام.' });
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else {
          setRestoreStatus({ success: false, msg: res.error || 'فشلت عملية الاستعادة.' });
        }
      } catch (err) {
        setRestoreStatus({ success: false, msg: 'ملف غير صالح.' });
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    storage.resetAllData();
    setShowResetConfirm(false);
    setSaveMessage('تمت إعادة تعيين البيانات إلى الحالة الافتراضية بنجاح.');
    setTimeout(() => window.location.reload(), 1000);
  };

  const filteredLogs = auditLogs.filter(
    (l) =>
      l.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.username.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-sm">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إعدادات النظام والتخصيص الشامل</h1>
            <p className="text-sm text-gray-500">
              تخصيص بيانات المنشأة، الضرائب، قوالب الفواتير، سياسات المخزون، والنسخ الاحتياطي
            </p>
          </div>
        </div>

        {saveMessage && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{saveMessage}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 border-b border-gray-200">
        {[
          { id: 'GENERAL', label: 'البيانات والنشاط والضرائب', icon: Store },
          { id: 'INVOICE', label: 'تخصيص الفواتير والطباعة', icon: Receipt },
          { id: 'INVENTORY', label: 'المخزون ونقاط البيع والفروع', icon: Layers },
          { id: 'BACKUP', label: 'النسخ الاحتياطي والأمان', icon: Database },
          { id: 'AUDIT', label: 'سجل العمليات والرقابة (Audit Log)', icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                active
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Form */}
      <div className="mt-6">
        {activeTab === 'GENERAL' && (
          <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-700" />
              بيانات المنشأة والهوية التجارية والضرائب
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">اسم المنشأة / الصيدلية</label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">نوع النشاط التجاري</label>
                <input
                  type="text"
                  value={settings.activityName}
                  onChange={(e) => setSettings({ ...settings, activityName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">رقم الهاتف والتواصل</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">العنوان والمقر الرئيسي</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الرقم الضريبي (Tax ID)</label>
                <input
                  type="text"
                  value={settings.taxNumber}
                  onChange={(e) => setSettings({ ...settings, taxNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">رقم السجل التجاري</label>
                <input
                  type="text"
                  value={settings.commercialReg}
                  onChange={(e) => setSettings({ ...settings, commercialReg: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">نسبة ضريبة القيمة المضافة (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">رمز العملة الافتراضية</label>
                <input
                  type="text"
                  value={settings.currencySymbol}
                  onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                حفظ بيانات المنشأة
              </button>
            </div>
          </form>
        )}

        {activeTab === 'INVOICE' && (
          <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-700" />
              تخصيص نموذج الفواتير وإعدادات الطباعة
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                {
                  id: 'THERMAL_80MM',
                  title: 'إيصال حراري (80 مم POS)',
                  desc: 'النموذج القياسي لطابعات الإيصالات النقطية السريعة والباركود في الكاشير.',
                },
                {
                  id: 'A4_STANDARD',
                  title: 'فاتورة ضريبية رسمية (A4)',
                  desc: 'تصميم A4 متكامل يحتوي على جدول ضريبي مفصل وتوقيعات الاستلام والمخزن.',
                },
                {
                  id: 'MODERN_CLEAN',
                  title: 'نموذج إلكتروني حديث (Modern)',
                  desc: 'تصميم عصري موجز مناسب للإرسال عبر واتساب أو البريد الإلكتروني.',
                },
              ].map((template) => {
                const selected = settings.invoiceTemplate === template.id;
                return (
                  <div
                    key={template.id}
                    onClick={() => setSettings({ ...settings, invoiceTemplate: template.id as any })}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      selected
                        ? 'border-emerald-700 bg-emerald-50/50 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900 text-base">{template.title}</span>
                      {selected && <Check className="w-5 h-5 text-emerald-700" />}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{template.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  نص تذييل الفاتورة (ملاحظات وسياسة الاسترجاع والضمان)
                </label>
                <textarea
                  rows={3}
                  value={settings.invoiceFooter}
                  onChange={(e) => setSettings({ ...settings, invoiceFooter: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={settings.qrCodeOnInvoice}
                    onChange={(e) => setSettings({ ...settings, qrCodeOnInvoice: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <div>
                    <span className="text-sm font-bold text-gray-900 block">طباعة رمز الاستجابة السريع (QR Code)</span>
                    <span className="text-xs text-gray-500">متوافق مع متطلبات الفوترة الإلكترونية الضريبية</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={settings.autoFocusBarcode}
                    onChange={(e) => setSettings({ ...settings, autoFocusBarcode: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <div>
                    <span className="text-sm font-bold text-gray-900 block">التركيز التلقائي على قارئ الباركود</span>
                    <span className="text-xs text-gray-500">جاهزية فورية للمسح الضوئي بعد كل عملية بيع</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                حفظ إعدادات الفواتير
              </button>
            </div>
          </form>
        )}

        {activeTab === 'INVENTORY' && (
          <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-700" />
              سياسات المخزون والجرد وتعدد الفروع
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">سياسة صرف وتقييم المخزون</label>
                <select
                  value={settings.inventoryValuationPolicy}
                  onChange={(e) => setSettings({ ...settings, inventoryValuationPolicy: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                >
                  <option value="FIFO">الوارد أولاً يصرف أولاً (FIFO) - الأفضل للأدوية والصلاحية</option>
                  <option value="WEIGHTED_AVG">متوسط التكلفة المرجح (Weighted Average)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">تحديد الترتيب المفضل لصرف التشغيلات وتحديد الأرباح</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  الحد الأدنى الافتراضي لنواقص المخزون (تنبيه حد الأمان)
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.defaultLowStockThreshold}
                  onChange={(e) => setSettings({ ...settings, defaultLowStockThreshold: parseInt(e.target.value) || 5 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">تنبيه تلقائي عند هبوط رصيد الصنف لهذا الرقم</p>
              </div>

              <div className="sm:col-span-2 space-y-4 pt-4 border-t border-gray-100">
                <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={settings.enableMultiBranch}
                    onChange={(e) => setSettings({ ...settings, enableMultiBranch: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <div>
                    <span className="text-sm font-bold text-gray-900 block">تفعيل ميزة تعدد الفروع والمستودعات</span>
                    <span className="text-xs text-gray-500">إتاحة التنقل بين الفروع وإجراء التحويلات المخزنية</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={settings.allowNegativeStock}
                    onChange={(e) => setSettings({ ...settings, allowNegativeStock: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <div>
                    <span className="text-sm font-bold text-gray-900 block">السماح بالبيع بالسالب عند نفاد الرصيد</span>
                    <span className="text-xs text-gray-500">
                      (غير مستحسن) يتيح إتمام الفاتورة حتى في حال عدم تسجيل استلام البضاعة في النظام بعد
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                حفظ سياسات المخزون
              </button>
            </div>
          </form>
        )}

        {activeTab === 'BACKUP' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-8">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-700" />
                النسخ الاحتياطي واستعادة البيانات
              </h2>
              <p className="text-sm text-gray-500">
                حماية بيانات المنشأة بالكامل عن طريق تصدير نسخة مشفرة ومنظمة بتنسيق JSON، مع إمكانية استعادتها بأمان في أي وقت
              </p>
            </div>

            {restoreStatus && (
              <div
                className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                  restoreStatus.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border border-rose-300'
                }`}
              >
                {restoreStatus.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                <span>{restoreStatus.msg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export */}
              <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                    <Download className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-1">تصدير نسخة احتياطية كاملة (Backup)</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    تحميل ملف شامل لجميع المبيعات، المشتريات، المخزون، العملاء، الموردين، الصندوق، والإعدادات.
                  </p>
                </div>
                <button
                  onClick={handleExportBackup}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل ملف النسخة الاحتياطية (.JSON)</span>
                </button>
              </div>

              {/* Import */}
              <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-1">استعادة نسخة احتياطية سابقة (Restore)</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    رفع ملف نسخة احتياطية بصيغة JSON لإرجاع كافة السجلات والفواتير بأمان تام.
                  </p>
                </div>
                <label className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-sm shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer text-center">
                  <Upload className="w-4 h-4" />
                  <span>تحديد ملف النسخة الاحتياطية واستعادته</span>
                  <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                </label>
              </div>
            </div>

            {/* Reset Factory */}
            <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-rose-800 text-sm flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  منطقة الخطر: إعادة تعيين البيانات
                </h4>
                <p className="text-xs text-gray-500">
                  إعادة ضبط النظام وإرجاع البيانات الافتراضية التجريبية (احرص على أخذ نسخة احتياطية أولاً)
                </p>
              </div>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط المصنع</span>
              </button>
            </div>

            {/* Confirmation Modal */}
            {showResetConfirm && (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">تأكيد إعادة تعيين النظام</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    هل أنت متأكد من رغبتك في مسح كافة التعديلات وإرجاع قاعدة البيانات للحالة الافتراضية؟ لا يمكن التراجع عن هذا الإجراء إلا بوجود نسخة احتياطية.
                  </p>
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleResetData}
                      className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-sm font-bold"
                    >
                      نعم، إعادة التعيين
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'AUDIT' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-emerald-700" />
                  سجل العمليات والرقابة الأمنية (Audit Trail)
                </h2>
                <p className="text-sm text-gray-500">
                  توثيق لحظي لكل عملية حساسة تتم في النظام تشمل البيع، المرتجع، التعديل، التحويل، والمستخدم المسؤول
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                <input
                  type="text"
                  placeholder="بحث في سجل العمليات..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pr-9 pl-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600">
                  <tr>
                    <th className="py-3 px-4">رقم العملية</th>
                    <th className="py-3 px-4">التاريخ والوقت</th>
                    <th className="py-3 px-4">المستخدم</th>
                    <th className="py-3 px-4">نوع الإجراء</th>
                    <th className="py-3 px-4">تفاصيل العملية</th>
                    <th className="py-3 px-4">الجهاز / المنفذ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        لا توجد سجلات مطابقة
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.logId} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-gray-500 font-bold">{log.logId}</td>
                        <td className="py-3 px-4 text-gray-700 text-xs whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('ar-EG', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900 text-xs flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{log.username}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 font-mono">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-800 text-xs max-w-md truncate">{log.details}</td>
                        <td className="py-3 px-4 text-gray-400 text-xs font-mono">{log.ipOrDevice || 'MicroPOS Terminal'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
