import React, { useState, useMemo } from 'react';
import {
  Search,
  QrCode,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Package,
  FileCheck2,
  Users,
  Warehouse,
  FileDown,
  Building,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  ProductEntity,
  CartItem,
  SaleEntity,
  SaleItemEntity,
  UserEntity,
  CustomerEntity,
  PaymentMethodType,
  QuotationEntity,
  WarehouseEntity,
} from '../types';
import { storage } from '../services/storage';
import { ReceiptModal } from './ReceiptModal';

interface SalesScreenProps {
  currentUser: UserEntity | null;
  onBackToDashboard: () => void;
  onSaleCompleted?: () => void;
}

export const SalesScreen: React.FC<SalesScreenProps> = ({
  currentUser,
  onBackToDashboard,
  onSaleCompleted,
}) => {
  const settings = storage.getSettings();
  const [products, setProducts] = useState<ProductEntity[]>(() => storage.getAllProducts());
  const [customers, setCustomers] = useState<CustomerEntity[]>(() => storage.getAllCustomers());
  const [warehouses, setWarehouses] = useState<WarehouseEntity[]>(() => storage.getAllWarehouses());
  const [quotations, setQuotations] = useState<QuotationEntity[]>(() => storage.getAllQuotations());

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchBarcode, setSearchBarcode] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses[0]?.id || 'wh-01');

  const [completedSale, setCompletedSale] = useState<{ sale: SaleEntity; items: SaleItemEntity[] } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isImportQuotationOpen, setIsImportQuotationOpen] = useState(false);
  const [isQuotationSavedModalOpen, setIsQuotationSavedModalOpen] = useState(false);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  const refreshData = () => {
    setProducts(storage.getAllProducts());
    setCustomers(storage.getAllCustomers());
    setQuotations(storage.getAllQuotations());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Extract categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ['ALL', ...cats];
  }, [products]);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    const query = searchBarcode.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.barcode.toLowerCase().includes(query) ||
        (p.batchNumber && p.batchNumber.toLowerCase().includes(query));

      const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [products, searchBarcode, selectedCategory]);

  // Handle Barcode auto-match on Enter
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchBarcode.trim()) return;
    const match = products.find(
      (p) => p.barcode.trim().toLowerCase() === searchBarcode.trim().toLowerCase()
    );
    if (match) {
      handleAddToCart(match);
      setSearchBarcode('');
    } else {
      showToast('لم يتم العثور على صنف بهذا الباركود.');
    }
  };

  // Add to cart with stock validation
  const handleAddToCart = (product: ProductEntity) => {
    if (product.currentStock <= 0 && !settings.allowNegativeStock) {
      showToast(`عذرًا، الصنف "${product.name}" نفد من المخزون.`);
      return;
    }

    setCart((prev) => {
      const index = prev.findIndex((item) => item.product.id === product.id);
      if (index >= 0) {
        const item = prev[index];
        if (item.quantity + 1 <= product.currentStock || settings.allowNegativeStock) {
          const updated = [...prev];
          updated[index] = { ...item, quantity: item.quantity + 1 };
          return updated;
        } else {
          showToast(`تم الوصول لأقصى كمية متاحة في المخزن (${product.currentStock}).`);
          return prev;
        }
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
  };

  // Update item quantity
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.currentStock && !settings.allowNegativeStock) {
              showToast(`الكمية المطلوبة تتجاوز المخزون المتاح (${item.product.currentStock}).`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Remove from cart
  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Financial calculations
  const taxRate = settings.taxRate || 14;
  const subtotal = cart.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
  const tax = settings.enableTax ? subtotal * (taxRate / 100) : 0;
  const grandTotal = subtotal + tax;

  // Save Cart as a Quotation (عرض سعر)
  const handleSaveAsQuotation = () => {
    if (cart.length === 0) return;
    const qId = 'QT-' + (1000 + quotations.length + 1);
    const custName = selectedCustomer ? selectedCustomer.name : 'عميل نقدي';

    const quotation: QuotationEntity = {
      quotationId: qId,
      date: Date.now(),
      validUntil: Date.now() + 14 * 24 * 3600 * 1000,
      customerId: selectedCustomerId || undefined,
      customerName: custName,
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.salePrice,
        totalPrice: item.product.salePrice * item.quantity,
      })),
      totalAmount: subtotal,
      taxAmount: tax,
      discountAmount: 0,
      grandTotal,
      status: 'SENT',
      notes: 'تم الإنشاء مباشرة من شاشة الكاشير POS',
      createdBy: currentUser ? currentUser.fullName : 'الكاشير',
    };

    const currentQts = storage.getAllQuotations();
    currentQts.push(quotation);
    storage.setItem('micropos_quotations', currentQts);
    storage.logAudit('CREATE_QUOTATION', 'QUOTATION', qId, `حفظ عرض سعر ${qId} بقيمة ${grandTotal} ج.م`);

    refreshData();
    setIsQuotationSavedModalOpen(true);
  };

  // Load items from Quotation into cart
  const handleImportQuotation = (qt: QuotationEntity) => {
    const newCart: CartItem[] = [];
    for (const it of qt.items) {
      const prod = products.find((p) => p.id === it.productId);
      if (prod) {
        newCart.push({ product: prod, quantity: it.quantity });
      }
    }
    setCart(newCart);
    if (qt.customerId) {
      setSelectedCustomerId(qt.customerId);
    }
    setIsImportQuotationOpen(false);
    showToast(`تم استيراد ${newCart.length} أصناف من عرض السعر ${qt.quotationId}`);
  };

  // Complete Sale with atomic execution
  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    // Credit limit validation if payment is CREDIT
    if (paymentMethod === 'CREDIT') {
      if (!selectedCustomer) {
        showToast('تنبيه: يجب تحديد عميل مسجل للبيع بالآجل.');
        return;
      }
      const newBalance = selectedCustomer.balance + grandTotal;
      if (selectedCustomer.creditLimit > 0 && newBalance > selectedCustomer.creditLimit) {
        const proceed = window.confirm(
          `تحذير ائتماني: العميل "${selectedCustomer.name}" سيتجاوز حده الائتماني المسموح (${selectedCustomer.creditLimit} ج.م). الرصيد الجديد: ${newBalance} ج.م.\n\nهل تريد المتابعة استثنائياً؟`
        );
        if (!proceed) return;
      }
    }

    // Validate stocks again
    if (!settings.allowNegativeStock) {
      for (const item of cart) {
        if (item.quantity > item.product.currentStock) {
          showToast(`فشل العملية: الكمية المطلوبة من "${item.product.name}" غير متوفرة بالمخزن.`);
          return;
        }
      }
    }

    const saleId = `INV-${Date.now()}`;
    const timestamp = Date.now();
    const cashier = currentUser?.fullName || 'كاشير';

    const saleEntity: SaleEntity = {
      saleId,
      timestamp,
      totalAmount: subtotal,
      taxAmount: tax,
      discountAmount: 0.0,
      grandTotal,
      paidAmount: paymentMethod === 'CREDIT' ? 0 : grandTotal,
      paymentMethod,
      cashierName: cashier,
      customerId: selectedCustomerId || undefined,
      customerName: selectedCustomer ? selectedCustomer.name : undefined,
      status: 'COMPLETED',
    };

    const saleItems: SaleItemEntity[] = cart.map((item, index) => ({
      itemId: timestamp + index,
      saleId,
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.salePrice,
      totalPrice: item.product.salePrice * item.quantity,
      profit: (item.product.salePrice - item.product.purchasePrice) * item.quantity,
    }));

    const productUpdates = cart.map((item) => ({
      product: item.product,
      qtySold: item.quantity,
    }));

    // Atomic transaction execution in Storage
    storage.executeSaleTransaction(saleEntity, saleItems, productUpdates);

    // If Credit, update customer balance
    if (paymentMethod === 'CREDIT' && selectedCustomer) {
      const allCust = storage.getAllCustomers();
      const idx = allCust.findIndex((c) => c.id === selectedCustomer.id);
      if (idx >= 0) {
        allCust[idx].balance += grandTotal;
        allCust[idx].totalPurchases += grandTotal;
        allCust[idx].lastTransactionDate = timestamp;
        storage.setItem('micropos_customers', allCust);
      }
    }

    // Refresh products stock and reset cart
    refreshData();
    setCart([]);
    setCompletedSale({ sale: saleEntity, items: saleItems });
    showToast('تم إصدار الفاتورة وحفظ المعاملة وتحديث المخزون بنجاح!');
    if (onSaleCompleted) onSaleCompleted();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-sm animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRight className="w-5 h-5" />
            <span className="text-xs font-bold hidden sm:inline">العودة للوحة التحكم</span>
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">نقطة البيع السريعة (POS Enterprise)</h1>
            <p className="text-xs text-gray-500">
              الكاشير: {currentUser?.fullName || 'كاشير'} • المتجر: {settings.storeName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsImportQuotationOpen(true)}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>استيراد عرض سعر</span>
          </button>

          <span className="text-xs text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl font-bold border border-emerald-200">
            الضريبة: {settings.enableTax ? `${taxRate}% قيمة مضافة` : 'معفاة'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT / CENTER: Products Catalog & Search (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barcode / Search Input */}
          <form onSubmit={handleBarcodeSubmit} className="relative">
            <div className="relative">
              <input
                id="pos-barcode-search"
                type="text"
                value={searchBarcode}
                onChange={(e) => setSearchBarcode(e.target.value)}
                placeholder="مسح الباركود أو اسم الصنف (أو اضغط Enter للإضافة المباشرة)..."
                className="w-full pl-12 pr-12 py-3.5 bg-white border-2 border-emerald-700/30 focus:border-emerald-700 rounded-2xl text-sm font-medium focus:outline-none shadow-xs transition-all"
              />
              <QrCode className="w-6 h-6 text-emerald-700 absolute right-3.5 top-3.5" />
              <button
                type="submit"
                className="absolute left-2.5 top-2.5 px-3 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-lg hover:bg-emerald-800 transition-colors"
              >
                بحث / مسح
              </button>
            </div>
          </form>

          {/* Quick Barcode Testing Chips */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 text-xs">
            <span className="text-gray-500 font-semibold shrink-0">باركود سريع:</span>
            {products.slice(0, 4).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleAddToCart(p)}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 rounded-lg border border-gray-200 text-[11px] font-mono shrink-0 transition-colors"
                title={`إضافة ${p.name}`}
              >
                {p.barcode} ({p.name.split(' ')[0]})
              </button>
            ))}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat === 'ALL' ? 'جميع الأصناف' : cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="text-xs font-bold text-gray-700 flex items-center justify-between pt-1">
            <span>الأصناف المتاحة في المخزن ({filteredProducts.length})</span>
            <span className="text-gray-400 font-normal">اضغط على الصنف لإضافته إلى الفاتورة</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-500">لا توجد أصناف مطابقة للبحث</p>
                <p className="text-xs text-gray-400 mt-1">تأكد من كتابة الاسم أو الباركود الصحيح</p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isOutOfStock = p.currentStock <= 0;
                const isLowStock = p.currentStock <= (p.minStockLimit || 10);

                return (
                  <div
                    key={p.id}
                    onClick={() => (!isOutOfStock || settings.allowNegativeStock) && handleAddToCart(p)}
                    className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      isOutOfStock && !settings.allowNegativeStock
                        ? 'bg-gray-50/80 border-gray-200 opacity-60 cursor-not-allowed'
                        : 'bg-white border-gray-200 hover:border-emerald-700 hover:shadow-md cursor-pointer group'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                          {p.name}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-50 text-emerald-800 shrink-0">
                          {p.category}
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-500 space-y-0.5 mt-2">
                        <div className="flex justify-between">
                          <span>الباركود:</span>
                          <span className="font-mono text-gray-700">{p.barcode}</span>
                        </div>
                        {p.batchNumber && (
                          <div className="flex justify-between">
                            <span>التشغيلة:</span>
                            <span className="font-mono text-cyan-800">{p.batchNumber}</span>
                          </div>
                        )}
                        {p.expiryDate && (
                          <div className="flex justify-between">
                            <span>الصلاحية:</span>
                            <span className="font-mono text-gray-700">{p.expiryDate}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-lg font-black text-emerald-700 font-mono">
                          {p.salePrice.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500 mr-1">{settings.currencySymbol}</span>
                      </div>

                      <div>
                        {isOutOfStock ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-md">
                            نفد المخزون
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                            متبقي {p.currentStock} فقط
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-gray-500">
                            مخزون: <strong className="font-mono text-gray-900">{p.currentStock}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Current Cart & Checkout (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-fit sticky top-20">
          {/* Cart Header */}
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-700" />
              <h2 className="font-bold text-gray-900 text-sm">سلة الفاتورة</h2>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                {cart.length} أصناف
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-red-600 hover:text-red-700 hover:underline font-semibold"
              >
                تفريغ السلة
              </button>
            )}
          </div>

          {/* Customer Selection Field */}
          <div className="p-3 bg-gray-50/70 border-b border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-gray-500" />
                <span>العميل:</span>
              </label>
              {selectedCustomer && (
                <span className="text-[11px] text-gray-500 font-mono">
                  الرصيد: <strong className="text-rose-700">{selectedCustomer.balance.toLocaleString()} {settings.currencySymbol}</strong>
                </span>
              )}
            </div>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-700"
            >
              <option value="">عميل نقدي عام (Cash Customer)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.balance > 0 ? `(مدين: ${c.balance} ${settings.currencySymbol})` : ''}
                </option>
              ))}
            </select>
            {selectedCustomer && selectedCustomer.creditLimit > 0 && selectedCustomer.balance > selectedCustomer.creditLimit && (
              <div className="flex items-center gap-1 text-[11px] text-rose-700 font-bold bg-rose-50 p-2 rounded-lg border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>تحذير: تجاوز العميل للحد الائتماني ({selectedCustomer.creditLimit.toLocaleString()} {settings.currencySymbol})!</span>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="p-4 divide-y divide-gray-100 max-h-[260px] overflow-y-auto">
            {cart.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">السلة فارغة حالياً</p>
                <p className="text-xs text-gray-400 mt-1">امسح الباركود أو اختر صنفاً للإضافة</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 truncate">{item.product.name}</h4>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      <span className="font-mono">{item.product.salePrice.toFixed(2)} {settings.currencySymbol}</span> × {item.quantity} ={' '}
                      <strong className="text-gray-900 font-mono">
                        {(item.product.salePrice * item.quantity).toFixed(2)} {settings.currencySymbol}
                      </strong>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, -1)}
                      className="w-6 h-6 rounded-lg bg-white text-gray-700 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold font-mono text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, 1)}
                      className="w-6 h-6 rounded-lg bg-white text-gray-700 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleRemoveFromCart(item.product.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="p-4 bg-gray-50/50 border-t border-gray-200 space-y-2">
            <div className="text-xs font-bold text-gray-700">طريقة الدفع:</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'CASH' as PaymentMethodType, label: 'نقداً (CASH)', icon: Banknote },
                { id: 'CARD' as PaymentMethodType, label: 'بطاقة (CARD)', icon: CreditCard },
                { id: 'CREDIT' as PaymentMethodType, label: 'آجل (CREDIT)', icon: Users },
                { id: 'TRANSFER' as PaymentMethodType, label: 'تحويل بنكي', icon: Building },
              ].map((pm) => {
                const Icon = pm.icon;
                const active = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      active
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calculation Summary & Action Buttons */}
          <div className="p-4 bg-white border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>المجموع قبل الضريبة:</span>
              <span className="font-mono font-semibold">{subtotal.toFixed(2)} {settings.currencySymbol}</span>
            </div>
            {settings.enableTax && (
              <div className="flex justify-between text-xs text-gray-600">
                <span>ضريبة القيمة المضافة ({taxRate}%):</span>
                <span className="font-mono font-semibold">{tax.toFixed(2)} {settings.currencySymbol}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-dashed border-gray-200">
              <span>الإجمالي الكلي المطلوب:</span>
              <span className="font-mono text-xl text-emerald-800 font-black">
                {grandTotal.toFixed(2)} {settings.currencySymbol}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveAsQuotation}
                disabled={cart.length === 0}
                className="py-3 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-900 font-bold text-xs rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>حفظ كعرض سعر</span>
              </button>

              <button
                id="btn-complete-sale"
                onClick={handleCompleteSale}
                disabled={cart.length === 0}
                className="py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>إتمام الفاتورة</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Completed Sale Receipt Modal */}
      {completedSale && (
        <ReceiptModal
          sale={completedSale.sale}
          items={completedSale.items}
          onClose={() => setCompletedSale(null)}
        />
      )}

      {/* Import Quotation Modal */}
      {isImportQuotationOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <FileDown className="w-5 h-5 text-blue-700" />
                <span>استيراد عرض سعر إلى سلة البيع</span>
              </h3>
              <button onClick={() => setIsImportQuotationOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto flex-1 space-y-3">
              {quotations.filter((q) => q.status !== 'CONVERTED').length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">
                  لا توجد عروض أسعار نشطة متاحة للاستيراد
                </div>
              ) : (
                quotations
                  .filter((q) => q.status !== 'CONVERTED')
                  .map((q) => (
                    <div key={q.quotationId} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-blue-700 font-mono">{q.quotationId}</span>
                          <span className="text-xs font-bold text-gray-900">{q.customerName}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1">
                          {q.items.length} أصناف • إجمالي: <strong className="font-mono text-gray-900">{q.grandTotal.toFixed(2)} {settings.currencySymbol}</strong>
                        </div>
                      </div>
                      <button
                        onClick={() => handleImportQuotation(q)}
                        className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold"
                      >
                        تحميل بالسلة
                      </button>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-4 border-t border-gray-200 text-left">
              <button
                onClick={() => setIsImportQuotationOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quotation Saved Confirmation Modal */}
      {isQuotationSavedModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 mx-auto flex items-center justify-center">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-gray-900">تم حفظ عرض السعر بنجاح</h3>
            <p className="text-xs text-gray-500">
              تم إدراج العرض في سجل عروض الأسعار دون خصم من أرصدة المخزون، ويمكنك متابعته وتحويله لاحقاً لفاتورة نهائية.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={() => setIsQuotationSavedModalOpen(false)}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                حسناً، متابعة البيع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
