import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  ArrowRight,
  Package,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  RotateCcw,
  Tag,
  Calendar,
  Layers,
} from 'lucide-react';
import { ProductEntity } from '../types';
import { storage } from '../services/storage';
import { AddProductDialog } from './AddProductDialog';

interface ProductsScreenProps {
  onBackToDashboard: () => void;
}

export const ProductsScreen: React.FC<ProductsScreenProps> = ({ onBackToDashboard }) => {
  const [products, setProducts] = useState<ProductEntity[]>(() => storage.getAllProducts());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [adjustingProduct, setAdjustingProduct] = useState<ProductEntity | null>(null);
  const [newStockValue, setNewStockValue] = useState('');
  const [adjustReason, setAdjustReason] = useState('جرد دوري بالمخزن');
  const [notification, setNotification] = useState<string | null>(null);

  const refreshProducts = () => {
    setProducts(storage.getAllProducts());
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ['ALL', ...cats];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matches =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.batchNumber.toLowerCase().includes(q);
      const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      return matches && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleAddProduct = (newProdData: Omit<ProductEntity, 'id'>) => {
    const newProduct: ProductEntity = {
      ...newProdData,
      id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    };
    storage.insertProduct(newProduct);
    refreshProducts();
    setShowAddDialog(false);
    showNotification(`تمت إضافة الصنف "${newProduct.name}" بنجاح وجدولته للمزامنة.`);
  };

  const handleApplyStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    const qty = parseFloat(newStockValue);
    if (isNaN(qty) || qty < 0) return;

    storage.adjustStock(adjustingProduct.id, qty, adjustReason);
    refreshProducts();
    setAdjustingProduct(null);
    showNotification(`تم تعديل رصيد المخزن للصنف "${adjustingProduct.name}" إلى ${qty} وحدة.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#006C50] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-200" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#dce5df]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRight className="w-5 h-5" />
            <span className="text-xs font-bold hidden sm:inline">العودة للوحة التحكم</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">إدارة المنتجات والمخزون</h1>
            <p className="text-xs text-gray-500 mt-0.5">كتالوج الأصناف، الأسعار، التشغيلات ومراقبة الأرصدة</p>
          </div>
        </div>

        <button
          id="btn-add-product"
          onClick={() => setShowAddDialog(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#006C50] hover:bg-[#00543e] text-white font-bold text-sm rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة صنف جديد</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#dce5df] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، الباركود أو رقم التشغيلة..."
            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#006C50]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#006C50] text-white shadow-xs'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat === 'ALL' ? 'جميع الأصناف' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards Grid (Matching the Kotlin Card layout specifications) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((prod) => {
          const isLowStock = prod.currentStock <= prod.minStockLimit;
          const isOut = prod.currentStock <= 0;
          const profitMargin = prod.salePrice - prod.purchasePrice;
          const profitPercent = prod.purchasePrice > 0 ? (profitMargin / prod.purchasePrice) * 100 : 0;

          return (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-[#dce5df] shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between text-right relative overflow-hidden"
            >
              {/* Top Accent line if low stock */}
              {isLowStock && (
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${isOut ? 'bg-red-500' : 'bg-amber-500'}`} />
              )}

              <div>
                {/* Header: Name and Category */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-base font-bold text-gray-900 leading-snug">{prod.name}</h3>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-[#006C50] border border-emerald-200 shrink-0">
                    {prod.category}
                  </span>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline justify-between mt-3 mb-4 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                  <div>
                    <span className="text-xs text-gray-500 block">سعر البيع للجمهور:</span>
                    <span className="text-xl font-black text-[#006C50] font-mono">
                      {prod.salePrice.toFixed(2)} <span className="text-xs font-sans text-gray-600">ج.م</span>
                    </span>
                  </div>

                  <div className="text-left">
                    <span className="text-xs text-gray-500 block">سعر الشراء (التكلفة):</span>
                    <span className="text-sm font-mono font-bold text-gray-700">
                      {prod.purchasePrice.toFixed(2)} ج.م
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold block">
                      ربح: +{profitMargin.toFixed(2)} ({profitPercent.toFixed(0)}%)
                    </span>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <Tag className="w-3.5 h-3.5" />
                      الباركود:
                    </span>
                    <span className="font-mono font-bold text-gray-900">{prod.barcode}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <Layers className="w-3.5 h-3.5" />
                      رقم التشغيلة (Batch):
                    </span>
                    <span className="font-mono text-gray-800">{prod.batchNumber}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      تاريخ الصلاحية:
                    </span>
                    <span className="font-mono text-gray-800">{prod.expiryDate}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="font-bold text-gray-900">الرصيد الفعلي بالمخزن:</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-sm font-black font-mono px-2 py-0.5 rounded-lg ${
                          isOut
                            ? 'bg-red-100 text-red-700'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-[#006C50]'
                        }`}
                      >
                        {prod.currentStock} وحدة
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustingProduct(prod);
                    setNewStockValue(prod.currentStock.toString());
                  }}
                  className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>تعديل الجرد / المخزون</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-base font-bold text-gray-600">لا توجد منتجات مسجلة تطابق البحث</p>
          <button
            onClick={() => setShowAddDialog(true)}
            className="mt-4 px-4 py-2 bg-[#006C50] text-white text-xs font-bold rounded-xl"
          >
            إضافة صنف جديد الآن
          </button>
        </div>
      )}

      {/* Floating Action Button (Matches Compose FloatingActionButton) */}
      <button
        id="fab-add-product"
        onClick={() => setShowAddDialog(true)}
        title="إضافة منتج جديد"
        className="fixed bottom-6 left-6 z-30 w-14 h-14 bg-[#006C50] hover:bg-[#00543e] text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-emerald-50"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Add Product Modal */}
      {showAddDialog && (
        <AddProductDialog
          onDismiss={() => setShowAddDialog(false)}
          onConfirm={handleAddProduct}
        />
      )}

      {/* Adjust Stock Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 text-right">
            <h3 className="text-base font-bold text-gray-900 mb-1">تعديل جرد المخزون</h3>
            <p className="text-xs text-gray-500 mb-4">{adjustingProduct.name}</p>

            <form onSubmit={handleApplyStockAdjustment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">الرصيد الجديد بعد الجرد</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={newStockValue}
                  onChange={(e) => setNewStockValue(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#006C50] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">سبب التعديل / الحركة</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="جرد دوري / هالك / توريد يدوي"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#006C50] outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#006C50] text-white text-xs font-bold rounded-xl hover:bg-[#00543e] cursor-pointer"
                >
                  حفظ الحركة
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="py-2.5 px-4 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
