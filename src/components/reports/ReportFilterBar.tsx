import React from 'react';
import {
  Calendar,
  Filter,
  RotateCcw,
  FileSpreadsheet,
  Printer,
  Search,
  Users,
  Layers,
  CreditCard,
} from 'lucide-react';
import { ReportFilterState } from '../../types';

interface ReportFilterBarProps {
  filters: ReportFilterState;
  onFilterChange: (filters: ReportFilterState) => void;
  cashiers: string[];
  categories: string[];
  onExportExcel: () => void;
  onPrint: () => void;
  reportTitle?: string;
}

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
  filters,
  onFilterChange,
  cashiers,
  categories,
  onExportExcel,
  onPrint,
}) => {
  const datePresets: { id: ReportFilterState['datePreset']; label: string }[] = [
    { id: 'TODAY', label: 'اليوم' },
    { id: 'YESTERDAY', label: 'أمس' },
    { id: 'LAST_7_DAYS', label: 'آخر 7 أيام' },
    { id: 'THIS_MONTH', label: 'هذا الشهر' },
    { id: 'LAST_MONTH', label: 'الشهر الماضي' },
    { id: 'THIS_YEAR', label: 'هذا العام' },
    { id: 'ALL', label: 'الكل' },
    { id: 'CUSTOM', label: 'مخصص' },
  ];

  const handleReset = () => {
    onFilterChange({
      datePreset: 'THIS_MONTH',
      startDate: '',
      endDate: '',
      cashier: 'ALL',
      category: 'ALL',
      paymentMethod: 'ALL',
      searchQuery: '',
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-[#dce5df] p-4 shadow-xs space-y-3.5 print:hidden">
      {/* Top Row: Date Presets and Export / Print Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Date Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-gray-500 flex items-center gap-1 ml-1">
            <Calendar className="w-3.5 h-3.5 text-[#006C50]" />
            <span>الفترة:</span>
          </span>
          {datePresets.map((preset) => {
            const isSelected = filters.datePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onFilterChange({ ...filters, datePreset: preset.id })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#006C50] text-white shadow-xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Export & Print actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            title="تصدير البيانات بتنسيق Excel (CSV داعم للعربية)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير Excel</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            title="معاينة وطباعة التقرير"
          >
            <Printer className="w-4 h-4 text-gray-600" />
            <span>طباعة التقرير</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-lg transition-colors cursor-pointer"
            title="إعادة ضبط الفلاتر"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Second Row: Detailed Dropdowns & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-gray-100">
        {/* Custom Dates if CUSTOM is selected */}
        {filters.datePreset === 'CUSTOM' && (
          <>
            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
              <span className="text-xs text-gray-500 shrink-0 font-medium">من:</span>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
                className="w-full text-xs bg-transparent outline-none font-mono"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
              <span className="text-xs text-gray-500 shrink-0 font-medium">إلى:</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
                className="w-full text-xs bg-transparent outline-none font-mono"
              />
            </div>
          </>
        )}

        {/* Cashier Dropdown */}
        <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
          <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <select
            value={filters.cashier}
            onChange={(e) => onFilterChange({ ...filters, cashier: e.target.value })}
            className="w-full text-xs bg-transparent outline-none text-gray-700 cursor-pointer"
          >
            <option value="ALL">جميع المستخدمين / الكاشير</option>
            {cashiers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
          <Layers className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            className="w-full text-xs bg-transparent outline-none text-gray-700 cursor-pointer"
          >
            <option value="ALL">جميع الأقسام / التصنيفات</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method Dropdown */}
        <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
          <CreditCard className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <select
            value={filters.paymentMethod}
            onChange={(e) => onFilterChange({ ...filters, paymentMethod: e.target.value })}
            className="w-full text-xs bg-transparent outline-none text-gray-700 cursor-pointer"
          >
            <option value="ALL">جميع طرق الدفع</option>
            <option value="CASH">نقداً (CASH)</option>
            <option value="CARD">بطاقة بنكية (CARD)</option>
            <option value="CREDIT">آجل / ذمم (CREDIT)</option>
          </select>
        </div>

        {/* Search Query */}
        <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 sm:col-span-2 lg:col-span-2">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            placeholder="بحث برقم الفاتورة، اسم الصنف، أو اسم العميل..."
            className="w-full text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>
    </div>
  );
};
