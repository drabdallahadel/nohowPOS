import React from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from './reportUtils';
import { UserEntity } from '../../types';

interface PrintReportModalProps {
  reportTitle: string;
  dateRangeLabel: string;
  currentUser: UserEntity | null;
  headers: string[];
  rows: (string | number)[][];
  summaryMetrics?: { label: string; value: string }[];
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  reportTitle,
  dateRangeLabel,
  currentUser,
  headers,
  rows,
  summaryMetrics,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-right">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#006C50] hover:bg-[#00543e] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الآن (Print)</span>
            </button>
            <span className="text-xs text-gray-500 mr-2">معاينة التقرير قبل الطباعة</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Area */}
        <div className="p-8 overflow-y-auto flex-1 space-y-6 text-gray-900 bg-white" id="printable-report">
          {/* Header */}
          <div className="border-b-2 border-gray-900 pb-4 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900 font-sans">ميكروبوز (MicroPOS)</h2>
              <p className="text-xs text-gray-600 mt-1">نظام إدارة الصيدلية البيطرية والأعلاف المتقدم</p>
              <p className="text-xs text-gray-500 font-mono">سجل ضريبي: 123-456-789 | هاتف: 01000000000</p>
            </div>
            <div className="text-left">
              <span className="inline-block px-3 py-1 bg-gray-100 border border-gray-300 rounded font-bold text-xs">
                تقرير رسمي
              </span>
              <p className="text-xs text-gray-500 mt-1 font-mono">تاريخ الطباعة: {formatDate(Date.now())}</p>
              <p className="text-xs text-gray-500">المستخدم: {currentUser?.fullName || currentUser?.username || 'المسؤول'}</p>
            </div>
          </div>

          {/* Title & Filter Context */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-black text-[#006C50]">{reportTitle}</h3>
              <p className="text-xs text-gray-600 mt-0.5">الفترة الزمنية: <span className="font-bold">{dateRangeLabel}</span></p>
            </div>
            <div className="text-xs text-gray-500 font-mono">
              إجمالي السجلات: <span className="font-bold text-gray-900">{rows.length}</span>
            </div>
          </div>

          {/* Optional Summary Metrics */}
          {summaryMetrics && summaryMetrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {summaryMetrics.map((metric, idx) => (
                <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-right">
                  <span className="text-[11px] text-gray-500 block">{metric.label}</span>
                  <span className="text-sm font-black font-mono text-gray-900 mt-0.5 block">{metric.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Report Table */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-100 text-gray-900 border-b border-gray-300">
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} className="py-2.5 px-3 font-bold border-l border-gray-300 last:border-l-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-800">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={headers.length} className="py-6 text-center text-gray-400">
                      لا توجد بيانات مسجلة في هذا التقرير
                    </td>
                  </tr>
                ) : (
                  rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-gray-50">
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="py-2 px-3 border-l border-gray-200 last:border-l-0 font-sans"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-8 pt-8 text-center text-xs text-gray-600 border-t border-gray-200">
            <div>
              <p className="font-bold text-gray-800">المسؤول / إعداد التقرير</p>
              <div className="h-12 border-b border-gray-300"></div>
            </div>
            <div>
              <p className="font-bold text-gray-800">المراجعة والتدقيق</p>
              <div className="h-12 border-b border-gray-300"></div>
            </div>
            <div>
              <p className="font-bold text-gray-800">اعتماد إدارة الحسابات</p>
              <div className="h-12 border-b border-gray-300"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
