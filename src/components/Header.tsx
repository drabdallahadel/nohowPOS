import React, { useState, useRef, useEffect } from 'react';
import {
  Store,
  LogOut,
  LayoutDashboard,
  ShoppingCart,
  Package,
  CloudUpload,
  ReceiptText,
  Wifi,
  WifiOff,
  BarChart3,
  User,
  Truck,
  Warehouse,
  Users,
  Building2,
  Vault,
  Sparkles,
  Settings,
  ChevronDown,
  FileCheck2,
  ShieldAlert,
} from 'lucide-react';
import { ScreenState, UserEntity } from '../types';
import { storage } from '../services/storage';

interface HeaderProps {
  currentScreen: ScreenState;
  onNavigate: (screen: ScreenState) => void;
  currentUser: UserEntity | null;
  onLogout: () => void;
  pendingSyncCount: number;
  isOnline: boolean;
  onToggleOnline: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  currentUser,
  onLogout,
  pendingSyncCount,
  isOnline,
  onToggleOnline,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const settings = storage.getSettings();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (currentScreen === 'LOGIN' || !currentUser) {
    return null;
  }

  // Primary navigation tabs
  const primaryNavItems: { id: ScreenState; label: string; icon: any; badge?: number }[] = [
    { id: 'DASHBOARD', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'POS', label: 'نقطة البيع', icon: ShoppingCart },
    { id: 'PURCHASES', label: 'المشتريات', icon: Truck },
    { id: 'INVENTORY_HUB', label: 'المستودعات', icon: Warehouse },
    { id: 'TREASURY', label: 'الخزينة والوردية', icon: Vault },
    { id: 'REPORTS', label: 'التقارير', icon: BarChart3 },
    { id: 'AI_ASSISTANT', label: 'المساعد الذكي', icon: Sparkles },
  ];

  // Secondary modules under "المزيد"
  const moreNavItems: { id: ScreenState; label: string; desc: string; icon: any; badge?: number }[] = [
    { id: 'QUOTATIONS', label: 'عروض الأسعار', desc: 'إصدار العروض وتحويلها لفواتير', icon: FileCheck2 },
    { id: 'CUSTOMERS', label: 'العملاء والتحصيل', desc: 'الحسابات المدينة والحد الائتماني', icon: Users },
    { id: 'SUPPLIERS', label: 'الموردين والشركات', desc: 'الحسابات الدائنة وسندات الصرف', icon: Building2 },
    { id: 'PRODUCTS', label: 'كتالوج الأصناف والأسعار', desc: 'تعديل المنتجات والباركود', icon: Package },
    { id: 'INVOICES', label: 'سجل فواتير المبيعات', desc: 'الفواتير السابقة والطباعة', icon: ReceiptText },
    { id: 'SYNC_QUEUE', label: 'طابور المزامنة السحابية', desc: 'متابعة العمليات المعلقة', icon: CloudUpload, badge: pendingSyncCount },
    { id: 'SETTINGS', label: 'الإعدادات والنسخ والرقابة', desc: 'التخصيص، النسخ، وسجل الأمان', icon: Settings },
  ];

  const isMoreActive = moreNavItems.some((m) => m.id === currentScreen);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none shrink-0"
            onClick={() => onNavigate('DASHBOARD')}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                {settings.storeName || 'نظام MicroPOS ERP'}
              </h1>
              <span className="text-[11px] text-emerald-700 font-bold">
                ERP Enterprise • Multi-Warehouse
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id.toLowerCase()}`}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* "More Modules" Dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isMoreActive
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>المزيد من الوحدات</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
                {pendingSyncCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                )}
              </button>

              {isMoreOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 border-b border-gray-100">
                    الوحدات المتقدمة والإعدادات
                  </div>
                  {moreNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentScreen === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          setIsMoreOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 flex items-start gap-2.5 text-right transition-colors ${
                          isActive ? 'bg-emerald-50 text-emerald-900' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5 text-gray-600">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-gray-900">{item.label}</span>
                            {item.badge !== undefined && item.badge > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500 block leading-tight mt-0.5">{item.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Status & Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Settings Icon */}
            <button
              onClick={() => onNavigate('SETTINGS')}
              title="إعدادات النظام والنسخ الاحتياطي"
              className={`p-2 rounded-xl transition-colors ${
                currentScreen === 'SETTINGS'
                  ? 'bg-emerald-700 text-white'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Online/Offline Toggle */}
            <button
              onClick={onToggleOnline}
              title={isOnline ? 'النظام متصل بالسحابة' : 'وضع عدم الاتصال (Offline-First)'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600" />}
              <span className="hidden sm:inline">{isOnline ? 'متصل سحابياً' : 'محلي (Offline)'}</span>
            </button>

            {/* User Info */}
            <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-gray-200 mr-1">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-gray-900 leading-tight">{currentUser.fullName}</div>
                <div className="text-[10px] text-gray-500 font-mono">
                  {currentUser.role === 'OWNER' ? 'مالك النظام' : currentUser.role === 'ADMIN' ? 'مدير عام' : 'كاشير'}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              title="تسجيل الخروج"
              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Responsive Mobile / Tablet Navigation Row */}
        <div className="flex xl:hidden items-center py-2 border-t border-gray-100 overflow-x-auto gap-1.5 no-scrollbar">
          {[...primaryNavItems, ...moreNavItems].map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-amber-400 text-gray-950 text-[10px] px-1.5 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
