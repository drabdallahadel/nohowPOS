import React, { useState } from 'react';
import { X, Receipt, DollarSign, FileText } from 'lucide-react';
import { ExpenseEntity, UserEntity } from '../../types';
import { storage } from '../../services/storage';

interface AddExpenseModalProps {
  onClose: () => void;
  onExpenseAdded: () => void;
  currentUser: UserEntity | null;
}

const EXPENSE_CATEGORIES = [
  'إيجار المحل والمستودع',
  'كهرباء ومياه ومرافق',
  'رواتب وأجور عاملين',
  'صيانة وتجهيزات',
  'نقل ومصاريف شحن',
  'أدوات مكتبية ومطبوعات',
  'دعاية وإعلانات',
  'نثريات وضيافة',
  'أخرى',
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  onClose,
  onExpenseAdded,
  currentUser,
}) => {
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }
    if (!description.trim()) {
      setError('يرجى إدخال بيان أو وصف للمصروف');
      return;
    }

    const newExpense: ExpenseEntity = {
      id: 'exp-' + Date.now(),
      category,
      amount: numAmount,
      description: description.trim(),
      timestamp: Date.now(),
      recordedBy: currentUser?.fullName || currentUser?.username || 'المسؤول',
    };

    storage.insertExpense(newExpense);
    onExpenseAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-right space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900">تسجيل سند صرف مصروف</h3>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006C50] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">بند المصروف:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 outline-none"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">المبلغ (ج.م):</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              placeholder="0.00"
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono font-bold text-gray-900 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">البيان والتفاصيل:</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError('');
              }}
              placeholder="وصف سبب المصروف وجهة الصرف..."
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-800 outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#006C50] hover:bg-[#00543e] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              تسجيل وصرف المبلغ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
