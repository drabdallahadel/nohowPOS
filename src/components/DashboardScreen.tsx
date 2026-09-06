import React, { useState } from 'react';
import {
  ShoppingCart,
  Package,
  CloudUpload,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Boxes,
  Database,
  CheckCircle2,
  ArrowUpLeft,
  BarChart3,
  FileCheck2,
  Truck,
  Warehouse,
  Users,
  Building2,
  Vault,
  Sparkles,
  Settings,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
} from 'lucide-react';
import { ScreenState, UserEntity } from '../types';
import { storage } from '../services/storage';

interface DashboardScreenProps {
  currentUser: UserEntity | null;
  onNavigate: (screen: ScreenState) => void;
  isOnline: boolean;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  currentUser,
  onNavigate,
  isOnline,
}) => {
  const settings = storage.getSettings();
  const products = storage.getAllProducts();
  const sales = storage.getAllSales();
  const purchases = storage.getAllPurchases();
  const customers = storage.getAllCustomers();
  const suppliers = storage.getAllSuppliers();
  const quotations = storage.getAllQuotations();
  const cashMovements = storage.getAllCashMovements();
  const syncQueue = storage.getSyncQueue();
  const pendingSyncs = syncQueue.filter((item) => !item.synced);

  // Financial aggregates
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalPurchasesCost = purchases.reduce((sum, p) => sum + p.grandTotal, 0);
  const totalCustomerDebts = customers.reduce((sum, c) => sum + c.balance, 0);
  const totalSupplierDebts = suppliers.reduce((sum, s) => sum + s.balance, 0);
  const totalStockCost = products.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);

  // Today calculations
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todaySales = sales.filter((s) => s.timestamp >= startOfToday && s.status === 'COMPLETED');
  const todaySalesTotal = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);

  // Low stock & near expiry
  const lowStockItems = products.filter((p) => p.currentStock <= (p.minStockLimit || 10));
  const nearExpiryItems = products.filter((p) => {
    if (!p.expiryDate) return false;
    const diff = (new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
    return diff >= 0 && diff <= 90;
  });

  // Treasury quick balance
  const cashSales = sales.filter((s) => s.paymentMethod === 'CASH').reduce((sum, s) => sum + s.grandTotal, 0);
  const customerPayments = cashMovements.filter((c) => c.type === 'CUSTOMER_PAYMENT').reduce((sum, c) => sum + c.amount, 0);
  const expensesAndPurchases = cashMovements.filter((c) => c.type === 'EXPENSE' || c.type === 'EXPENSE_CASH' || c.type === 'SUPPLIER_PAYMENT').reduce((sum, c) => sum + c.amount, 0);
  const estimatedCash = Math.max(0, cashSales + customerPayments - expensesAndPurchases);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              نظام تخطيط الموارد المتكامل (ERP Enterprise)
            </span>
            <span className="text-xs text-gray-500 font-mono">
              {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-2">
            لوحة الإدارة والتحكم الشاملة — {currentUser?.fullName || 'مدير النظام'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            متابعة فورية للمبيعات، المشتريات، المستودعات، أرصدة الخزينة، ومديونيات العملاء والموردين
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('AI_ASSISTANT')}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-sm rounded-xl transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-700" />
            <span>المساعد الذكي</span>
          </button>

          <button
            id="btn-quick-pos"
            onClick={() => onNavigate('POS')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>نقطة البيع (POS)</span>
            <ArrowUpLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Offline-First & Sync Bar */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50/70 border border-emerald-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-emerald-950">
                حالة قاعدة البيانات: {isOnline ? 'متصل ومزامن لحظياً مع السحابة' : 'يعمل دون إنترنت (Offline-First)'}
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                نشط وآمن
              </span>
            </div>
            <p className="text-xs text-emerald-800 mt-0.5">
              كافة الفواتير وحركات الخزينة والمخزون محفوظة بأمان في التخزين المحلي مع مزامنة ذرية تلقائية.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {pendingSyncs.length > 0 ? (
            <button
              onClick={() => onNavigate('SYNC_QUEUE')}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <CloudUpload className="w-4 h-4" />
              <span>{pendingSyncs.length} حركة بانتظار المزامنة</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-white/90 px-3 py-2 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>جميع البيانات متزامنة محلياً وسحابياً</span>
            </div>
          )}
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold text-gray-600">إجمالي المبيعات المحققة</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 font-mono">
            {totalSalesRevenue.toLocaleString()} <span className="text-xs font-sans font-normal text-gray-500">{settings.currencySymbol}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>مبيعات اليوم:</span>
            <span className="font-bold text-emerald-700 font-mono">+{todaySalesTotal.toLocaleString()} {settings.currencySymbol}</span>
          </div>
        </div>

        {/* Purchases Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold text-gray-600">إجمالي المشتريات والتوريد</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-900 font-mono">
            {totalPurchasesCost.toLocaleString()} <span className="text-xs font-sans font-normal text-gray-500">{settings.currencySymbol}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>فواتير الشراء:</span>
            <span className="font-bold text-indigo-700 font-mono">{purchases.length} فاتورة</span>
          </div>
        </div>

        {/* Treasury Cash Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold text-gray-600">نقدية الخزينة والصندوق</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Vault className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-800 font-mono">
            {estimatedCash.toLocaleString()} <span className="text-xs font-sans font-normal text-gray-500">{settings.currencySymbol}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>الدرج اليومي:</span>
            <span className="font-bold text-amber-700 font-mono">جاهز للإغلاق</span>
          </div>
        </div>

        {/* Inventory Value Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold text-gray-600">قيمة المخزون (سعر التكلفة)</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-900 font-mono">
            {totalStockCost.toLocaleString()} <span className="text-xs font-sans font-normal text-gray-500">{settings.currencySymbol}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>الأصناف المسجلة:</span>
            <span className="font-bold text-cyan-800 font-mono">{products.length} صنف</span>
          </div>
        </div>
      </div>

      {/* Secondary Financial Indicators (Debts & Suppliers) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500">مديونيات العملاء (حسابات مدينة)</span>
            <div className="text-xl font-bold text-rose-700 font-mono mt-1">
              {totalCustomerDebts.toLocaleString()} {settings.currencySymbol}
            </div>
          </div>
          <button
            onClick={() => onNavigate('CUSTOMERS')}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-bold transition-colors"
          >
            متابعة CRM
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500">مستحقات الموردين (حسابات دائنة)</span>
            <div className="text-xl font-bold text-amber-700 font-mono mt-1">
              {totalSupplierDebts.toLocaleString()} {settings.currencySymbol}
            </div>
          </div>
          <button
            onClick={() => onNavigate('SUPPLIERS')}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition-colors"
          >
            سجل الموردين
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500">عروض الأسعار النشطة</span>
            <div className="text-xl font-bold text-blue-700 font-mono mt-1">
              {quotations.filter((q) => q.status === 'SENT' || q.status === 'DRAFT').length} عرض سعر
            </div>
          </div>
          <button
            onClick={() => onNavigate('QUOTATIONS')}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold transition-colors"
          >
            إدارة العروض
          </button>
        </div>
      </div>

      {/* Fast Navigation Grid - All ERP Modules */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-4">بوابة الأنظمة والوحدات التشغيلية (ERP Hub)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { id: 'POS', label: 'نقطة البيع الكاشير', desc: 'إصدار الفواتير الفورية والباركود', icon: ShoppingCart, color: 'text-emerald-700 bg-emerald-50 hover:border-emerald-500' },
            { id: 'QUOTATIONS', label: 'عروض الأسعار', desc: 'إنشاء عروض أسعار وتحويلها لمبيعات', icon: FileCheck2, color: 'text-blue-700 bg-blue-50 hover:border-blue-500' },
            { id: 'PURCHASES', label: 'المشتريات والتوريد', desc: 'إدارة فواتير التوريد من الشركات', icon: Truck, color: 'text-indigo-700 bg-indigo-50 hover:border-indigo-500' },
            { id: 'INVENTORY_HUB', label: 'المستودعات والتحويلات', desc: 'المخازن المتعددة وإذن التحويل والصلاحية', icon: Warehouse, color: 'text-cyan-700 bg-cyan-50 hover:border-cyan-500' },
            { id: 'CUSTOMERS', label: 'العملاء والتحصيل', desc: 'كشوف الحساب والحد الائتماني', icon: Users, color: 'text-rose-700 bg-rose-50 hover:border-rose-500' },
            { id: 'SUPPLIERS', label: 'الموردين والشركات', desc: 'سندات الصرف والديون الدائنة', icon: Building2, color: 'text-amber-700 bg-amber-50 hover:border-amber-500' },
            { id: 'TREASURY', label: 'الخزينة والوردية', desc: 'حركة النقدية وإغلاق اليومية Z-Report', icon: Vault, color: 'text-yellow-700 bg-yellow-50 hover:border-yellow-500' },
            { id: 'REPORTS', label: 'مركز التقارير المتقدمة', desc: 'تحليل الأرباح والمبيعات والجرد', icon: BarChart3, color: 'text-teal-700 bg-teal-50 hover:border-teal-500' },
            { id: 'AI_ASSISTANT', label: 'المساعد الذكي (AI)', desc: 'استفسارات وتحليلات لغوية فورية', icon: Sparkles, color: 'text-purple-700 bg-purple-50 hover:border-purple-500' },
            { id: 'SETTINGS', label: 'إعدادات النظام والنسخ', desc: 'التخصيص والنسخ الاحتياطي والرقابة', icon: Settings, color: 'text-slate-700 bg-slate-50 hover:border-slate-500' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as ScreenState)}
                className={`p-4 bg-white rounded-2xl border border-gray-200 transition-all text-right flex flex-col justify-between group shadow-2xs hover:shadow-xs cursor-pointer ${item.color}`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 group-hover:text-current transition-colors">
                    {item.label}
                  </h3>
                </div>
                <p className="text-[11px] text-gray-500 mt-2 line-clamp-1">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Critical Stock & Expiry Warnings */}
      {(lowStockItems.length > 0 || nearExpiryItems.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowStockItems.length > 0 && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>نواقص المخزون: {lowStockItems.length} أصناف وصلت لحد الأمان الأدنى</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {lowStockItems.slice(0, 5).map((p) => (
                  <div key={p.id} className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-900 block">{p.name}</span>
                      <span className="text-[11px] text-gray-500">الباركود: {p.barcode}</span>
                    </div>
                    <div className="text-left font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                        {p.currentStock} وحدة
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nearExpiryItems.length > 0 && (
            <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-sm mb-3">
                <Clock className="w-4 h-4 text-rose-600 shrink-0" />
                <span>تنبيه الصلاحية: {nearExpiryItems.length} أصناف تقترب من تاريخ الانتهاء</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {nearExpiryItems.slice(0, 5).map((p) => (
                  <div key={p.id} className="bg-white p-2.5 rounded-xl border border-rose-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-900 block">{p.name}</span>
                      <span className="text-[11px] text-gray-500">تشغيلة: {p.batchNumber}</span>
                    </div>
                    <div className="text-left font-mono text-rose-700 font-bold text-[11px]">
                      تنتهي: {p.expiryDate}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
