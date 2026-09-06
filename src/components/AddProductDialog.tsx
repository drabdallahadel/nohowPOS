import React, { useState } from 'react';
import { X, PackagePlus, AlertCircle } from 'lucide-react';
import { ProductEntity } from '../types';

interface AddProductDialogProps {
  onDismiss: () => void;
  onConfirm: (product: Omit<ProductEntity, 'id'>) => void;
}

export const AddProductDialog: React.FC<AddProductDialogProps> = ({
  onDismiss,
  onConfirm,
}) => {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('أدوية بيطرية');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [minStockLimit, setMinStockLimit] = useState('5');
  const [batchNumber, setBatchNumber] = useState('BATCH-' + Math.floor(1000 + Math.random() * 9000));
  const [expiryDate, setExpiryDate] = useState('2028-12-31');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم الصنف');
      return;
    }
    if (!barcode.trim()) {
      setError('يرجى إدخال كود الباركود');
      return;
    }

    const costNum = parseFloat(purchasePrice) || 0;
    const priceNum = parseFloat(salePrice) || 0;
    const stockNum = parseFloat(currentStock) || 0;
    const minStockNum = parseFloat(minStockLimit) || 5;

    if (priceNum <= 0) {
      setError('يرجى تحديد سعر بيع صحيح أكبر من الصفر');
      return;
    }

    onConfirm({
      name: name.trim(),
      barcode: barcode.trim(),
      category: category.trim() || 'عام',
      purchasePrice: costNum,
      salePrice: priceNum,
      currentStock: stockNum,
      minStockLimit: minStockNum,
      batchNumber: batchNumber.trim() || 'BATCH-001',
      expiryDate: expiryDate || '2028-12-31',
    });
  };

  const categoriesList = [
    'أدوية بيطرية',
    'فيتامينات ومكملات',
    'أعلاف',
    'لقاحات وأمصال',
    'مطهرات ومستلزمات',
    'عام',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="bg-[#006C50] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-emerald-300" />
            <span className="font-bold text-base">إضافة صنف جديد للمخزون</span>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-right">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">اسم الصنف التجاري والعلمي *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: مضاد حيوي إنروفلوكساسين 10%"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006C50]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">كود الباركود الدولي *</label>
              <input
                type="text"
                required
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="6221006"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#006C50]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">التصنيف</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006C50]"
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">سعر الشراء (التكلفة) ج.م</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="100.00"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#006C50]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">سعر البيع للجمهور * ج.م</label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="140.00"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#006C50]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">الكمية الافتتاحية بالمخزن</label>
              <input
                type="number"
                step="1"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                placeholder="25"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#006C50]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">حد الأمان الأدنى للتنبيه</label>
              <input
                type="number"
                step="1"
                min="1"
                value={minStockLimit}
                onChange={(e) => setMinStockLimit(e.target.value)}
                placeholder="5"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#006C50]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">رقم التشغيلة (Batch No)</label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#006C50]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">تاريخ الانتهاء</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#006C50]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex gap-3">
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-[#006C50] hover:bg-[#00543e] text-white font-bold text-sm rounded-xl shadow-sm transition-all cursor-pointer"
            >
              حفظ الصنف في قاعدة البيانات
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-all cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
