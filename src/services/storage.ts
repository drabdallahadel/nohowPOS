import {
  UserEntity,
  ProductEntity,
  SaleEntity,
  SaleItemEntity,
  StockMovementEntity,
  SyncQueueEntity,
  ExpenseEntity,
  CustomerEntity,
  SupplierEntity,
  ReturnEntity,
  CashMovementEntity,
  AppSettingsEntity,
  PurchaseBillEntity,
  QuotationEntity,
  WarehouseEntity,
  StockTransferEntity,
  BranchEntity,
  DrawerClosingEntity,
  AuditLogEntity,
  NotificationItem,
} from '../types';

const STORAGE_KEYS = {
  USERS: 'pos_users_v1',
  PRODUCTS: 'pos_products_v1',
  SALES: 'pos_sales_v1',
  SALE_ITEMS: 'pos_sale_items_v1',
  STOCK_MOVEMENTS: 'pos_stock_movements_v1',
  SYNC_QUEUE: 'pos_sync_queue_v1',
  CURRENT_USER: 'pos_current_user_v1',
  EXPENSES: 'pos_expenses_v1',
  CUSTOMERS: 'pos_customers_v1',
  SUPPLIERS: 'pos_suppliers_v1',
  RETURNS: 'pos_returns_v1',
  CASH_MOVEMENTS: 'pos_cash_movements_v1',
  SETTINGS: 'pos_settings_v1',
  PURCHASES: 'pos_purchases_v1',
  QUOTATIONS: 'pos_quotations_v1',
  WAREHOUSES: 'pos_warehouses_v1',
  STOCK_TRANSFERS: 'pos_stock_transfers_v1',
  BRANCHES: 'pos_branches_v1',
  DRAWER_CLOSINGS: 'pos_drawer_closings_v1',
  AUDIT_LOGS: 'pos_audit_logs_v1',
  NOTIFICATIONS: 'pos_notifications_v1',
};

const DEFAULT_USERS: UserEntity[] = [
  {
    username: 'admin',
    passwordHash: 'admin123',
    fullName: 'مدير النظام د. عبدالله عادل',
    role: 'OWNER',
    phone: '01011112222',
  },
  {
    username: 'cashier1',
    passwordHash: '123456',
    fullName: 'أحمد محمود (كاشير)',
    role: 'CASHIER',
    phone: '01033334444',
  },
  {
    username: 'accountant1',
    passwordHash: '123456',
    fullName: 'أ. محمود فوزي (محاسب مالي)',
    role: 'ACCOUNTANT',
    phone: '01055556666',
  },
  {
    username: 'warehouse1',
    passwordHash: '123456',
    fullName: 'عمرو السيد (أمين مستودع)',
    role: 'WAREHOUSE',
    phone: '01077778888',
  },
  {
    username: 'purchases1',
    passwordHash: '123456',
    fullName: 'م. إبراهيم خليل (مسؤول مشتريات)',
    role: 'PURCHASES',
    phone: '01099990000',
  },
];

const DEFAULT_PRODUCTS: ProductEntity[] = [
  {
    id: 'prod-001',
    name: 'مضاد حيوي أوكسي تتراسيكلين 20%',
    barcode: '6221001',
    category: 'أدوية بيطرية',
    purchasePrice: 120.0,
    salePrice: 160.0,
    currentStock: 45.0,
    minStockLimit: 5.0,
    batchNumber: 'BATCH-VET-09',
    expiryDate: '2027-08-30',
  },
  {
    id: 'prod-002',
    name: 'فيتامين AD3E هولندي 1 لتر',
    barcode: '6221002',
    category: 'فيتامينات ومكملات',
    purchasePrice: 280.0,
    salePrice: 350.0,
    currentStock: 20.0,
    minStockLimit: 5.0,
    batchNumber: 'BATCH-AD-26',
    expiryDate: '2028-02-15',
  },
  {
    id: 'prod-003',
    name: 'علف دواجن بادئ سوبر 23%',
    barcode: '6221003',
    category: 'أعلاف',
    purchasePrice: 550.0,
    salePrice: 620.0,
    currentStock: 100.0,
    minStockLimit: 15.0,
    batchNumber: 'FEED-2026',
    expiryDate: '2026-12-01',
  },
  {
    id: 'prod-004',
    name: 'تيلوزين طرطرات 50% قابل للذوبان 100 جم',
    barcode: '6221004',
    category: 'أدوية بيطرية',
    purchasePrice: 95.0,
    salePrice: 135.0,
    currentStock: 18.0,
    minStockLimit: 5.0,
    batchNumber: 'BATCH-TY-14',
    expiryDate: '2027-11-20',
  },
  {
    id: 'prod-005',
    name: 'أملاح ومضاد سموم فطرية بيولوجي 1 لتر',
    barcode: '6221005',
    category: 'فيتامينات ومكملات',
    purchasePrice: 190.0,
    salePrice: 245.0,
    currentStock: 4.0,
    minStockLimit: 6.0,
    batchNumber: 'BATCH-TOX-02',
    expiryDate: '2027-05-10',
  },
];

const DEFAULT_CUSTOMERS: CustomerEntity[] = [
  { id: 'cust-01', name: 'مزارع النور للدواجن', phone: '01012345678', balance: 2400.0, currentBalance: 2400.0, creditLimit: 10000.0, lastTransactionDate: Date.now() - 3600 * 1000 * 24 * 2, email: 'nour_farms@example.com' },
  { id: 'cust-02', name: 'عيادة د. محمد البيطرية', phone: '01123456789', balance: 0.0, currentBalance: 0.0, creditLimit: 5000.0, lastTransactionDate: Date.now() - 3600 * 1000 * 24 * 5, email: 'dr.mohamed@example.com' },
  { id: 'cust-03', name: 'مزرعة البركة للإنتاج الحيواني', phone: '01234567890', balance: 5800.0, currentBalance: 5800.0, creditLimit: 5000.0, lastTransactionDate: Date.now() - 3600 * 1000 * 24 * 12, email: 'albaraka@example.com' },
  { id: 'cust-04', name: 'عميل نقدي عام', phone: '—', balance: 0.0, currentBalance: 0.0, creditLimit: 0, lastTransactionDate: Date.now() },
];

const DEFAULT_SUPPLIERS: SupplierEntity[] = [
  { id: 'sup-01', name: 'شركة الدلتا للأدوية واللقاحات', company: 'الدلتا فارما', phone: '0223456781', balance: 14500.0, currentBalance: 14500.0, contactPerson: 'م. حسام الدين', lastTransactionDate: Date.now() - 3600 * 1000 * 24 * 4 },
  { id: 'sup-02', name: 'مصنع النيل للأعلاف المركزة', company: 'النيل جروب', phone: '0223456782', balance: 32000.0, currentBalance: 32000.0, contactPerson: 'د. سامي فتحي', lastTransactionDate: Date.now() - 3600 * 1000 * 24 * 7 },
  { id: 'sup-03', name: 'الشركة العالمية للمكملات البيطرية', company: 'جلوبال فيت', phone: '0223456783', balance: 8750.0, currentBalance: 8750.0, contactPerson: 'م. إبراهيم كمال', lastTransactionDate: Date.now() - 3600 * 1000 * 24 * 14 },
];

const now = Date.now();
const ONE_HOUR = 3600 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

const DEFAULT_SALES_DATA: { sales: SaleEntity[]; items: SaleItemEntity[]; movements: StockMovementEntity[] } = (() => {
  const sales: SaleEntity[] = [
    {
      saleId: 'INV-1001',
      timestamp: now - 2 * ONE_HOUR,
      totalAmount: 1110.0,
      taxAmount: 155.4,
      discountAmount: 0,
      grandTotal: 1265.4,
      paidAmount: 1265.4,
      paymentMethod: 'CASH',
      cashierName: 'أحمد محمود (كاشير)',
      customerName: 'عميل نقدي عام',
      status: 'COMPLETED',
    },
    {
      saleId: 'INV-1002',
      timestamp: now - 5 * ONE_HOUR,
      totalAmount: 1860.0,
      taxAmount: 260.4,
      discountAmount: 50.0,
      grandTotal: 2070.4,
      paidAmount: 2070.4,
      paymentMethod: 'CARD',
      cashierName: 'مدير النظام د. عبدالله عادل',
      customerName: 'مزارع النور للدواجن',
      customerId: 'cust-01',
      status: 'COMPLETED',
    },
    {
      saleId: 'INV-1003',
      timestamp: now - 1 * ONE_DAY - 3 * ONE_HOUR,
      totalAmount: 3100.0,
      taxAmount: 434.0,
      discountAmount: 0,
      grandTotal: 3534.0,
      paidAmount: 3534.0,
      paymentMethod: 'CASH',
      cashierName: 'أحمد محمود (كاشير)',
      customerName: 'مزرعة البركة للإنتاج الحيواني',
      customerId: 'cust-03',
      status: 'COMPLETED',
    },
    {
      saleId: 'INV-1004',
      timestamp: now - 2 * ONE_DAY - 4 * ONE_HOUR,
      totalAmount: 670.0,
      taxAmount: 93.8,
      discountAmount: 20.0,
      grandTotal: 743.8,
      paidAmount: 743.8,
      paymentMethod: 'CASH',
      cashierName: 'مدير النظام د. عبدالله عادل',
      customerName: 'عيادة د. محمد البيطرية',
      customerId: 'cust-02',
      status: 'COMPLETED',
    },
    {
      saleId: 'INV-1005',
      timestamp: now - 4 * ONE_DAY - 6 * ONE_HOUR,
      totalAmount: 2400.0,
      taxAmount: 336.0,
      discountAmount: 0,
      grandTotal: 2736.0,
      paidAmount: 2736.0,
      paymentMethod: 'CREDIT',
      cashierName: 'أحمد محمود (كاشير)',
      customerName: 'مزارع النور للدواجن',
      customerId: 'cust-01',
      status: 'COMPLETED',
    },
    {
      saleId: 'INV-1006',
      timestamp: now - 7 * ONE_DAY - 2 * ONE_HOUR,
      totalAmount: 4340.0,
      taxAmount: 607.6,
      discountAmount: 100.0,
      grandTotal: 4847.6,
      paidAmount: 4847.6,
      paymentMethod: 'CARD',
      cashierName: 'مدير النظام د. عبدالله عادل',
      customerName: 'مزرعة البركة للإنتاج الحيواني',
      customerId: 'cust-03',
      status: 'COMPLETED',
    },
    {
      saleId: 'INV-1007',
      timestamp: now - 14 * ONE_DAY - 1 * ONE_HOUR,
      totalAmount: 1550.0,
      taxAmount: 217.0,
      discountAmount: 0,
      grandTotal: 1767.0,
      paidAmount: 1767.0,
      paymentMethod: 'CASH',
      cashierName: 'أحمد محمود (كاشير)',
      customerName: 'عميل نقدي عام',
      status: 'COMPLETED',
    },
  ];

  const items: SaleItemEntity[] = [
    // INV-1001
    { itemId: 101, saleId: 'INV-1001', productId: 'prod-001', productName: 'مضاد حيوي أوكسي تتراسيكلين 20%', quantity: 3, unitPrice: 160.0, totalPrice: 480.0 },
    { itemId: 102, saleId: 'INV-1001', productId: 'prod-002', productName: 'فيتامين AD3E هولندي 1 لتر', quantity: 1, unitPrice: 350.0, totalPrice: 350.0 },
    { itemId: 103, saleId: 'INV-1001', productId: 'prod-004', productName: 'تيلوزين طرطرات 50% قابل للذوبان 100 جم', quantity: 2, unitPrice: 140.0, totalPrice: 280.0 },
    // INV-1002
    { itemId: 104, saleId: 'INV-1002', productId: 'prod-003', productName: 'علف دواجن بادئ سوبر 23%', quantity: 3, unitPrice: 620.0, totalPrice: 1860.0 },
    // INV-1003
    { itemId: 105, saleId: 'INV-1003', productId: 'prod-003', productName: 'علف دواجن بادئ سوبر 23%', quantity: 5, unitPrice: 620.0, totalPrice: 3100.0 },
    // INV-1004
    { itemId: 106, saleId: 'INV-1004', productId: 'prod-005', productName: 'أملاح ومضاد سموم فطرية بيولوجي 1 لتر', quantity: 2, unitPrice: 245.0, totalPrice: 490.0 },
    { itemId: 107, saleId: 'INV-1004', productId: 'prod-004', productName: 'تيلوزين طرطرات 50% قابل للذوبان 100 جم', quantity: 1, unitPrice: 135.0, totalPrice: 135.0 },
    { itemId: 108, saleId: 'INV-1004', productId: 'prod-001', productName: 'مضاد حيوي أوكسي تتراسيكلين 20%', quantity: 1, unitPrice: 160.0, totalPrice: 160.0 },
    // INV-1005
    { itemId: 109, saleId: 'INV-1005', productId: 'prod-001', productName: 'مضاد حيوي أوكسي تتراسيكلين 20%', quantity: 15, unitPrice: 160.0, totalPrice: 2400.0 },
    // INV-1006
    { itemId: 110, saleId: 'INV-1006', productId: 'prod-003', productName: 'علف دواجن بادئ سوبر 23%', quantity: 7, unitPrice: 620.0, totalPrice: 4340.0 },
    // INV-1007
    { itemId: 111, saleId: 'INV-1007', productId: 'prod-002', productName: 'فيتامين AD3E هولندي 1 لتر', quantity: 3, unitPrice: 350.0, totalPrice: 1050.0 },
    { itemId: 112, saleId: 'INV-1007', productId: 'prod-005', productName: 'أملاح ومضاد سموم فطرية بيولوجي 1 لتر', quantity: 2, unitPrice: 245.0, totalPrice: 490.0 },
  ];

  const movements: StockMovementEntity[] = [
    { movementId: 'mov-init-1', productId: 'prod-001', changeType: 'PURCHASE', quantityChanged: 64, stockAfter: 64, timestamp: now - 30 * ONE_DAY, referenceId: 'رصيد افتتاحي توريد' },
    { movementId: 'mov-init-2', productId: 'prod-002', changeType: 'PURCHASE', quantityChanged: 24, stockAfter: 24, timestamp: now - 30 * ONE_DAY, referenceId: 'رصيد افتتاحي توريد' },
    { movementId: 'mov-init-3', productId: 'prod-003', changeType: 'PURCHASE', quantityChanged: 115, stockAfter: 115, timestamp: now - 30 * ONE_DAY, referenceId: 'رصيد افتتاحي توريد' },
    { movementId: 'mov-init-4', productId: 'prod-004', changeType: 'PURCHASE', quantityChanged: 21, stockAfter: 21, timestamp: now - 30 * ONE_DAY, referenceId: 'رصيد افتتاحي توريد' },
    { movementId: 'mov-init-5', productId: 'prod-005', changeType: 'PURCHASE', quantityChanged: 8, stockAfter: 8, timestamp: now - 30 * ONE_DAY, referenceId: 'رصيد افتتاحي توريد' },
  ];

  return { sales, items, movements };
})();

const DEFAULT_EXPENSES: ExpenseEntity[] = [
  { id: 'exp-01', category: 'إيجار وتأمينات', amount: 3500.0, description: 'إيجار مقر المحل والمستودع عن الشهر الحالي', timestamp: now - 3 * ONE_DAY, recordedBy: 'مدير النظام د. عبدالله عادل' },
  { id: 'exp-02', category: 'فواتير ومرافق', amount: 840.0, description: 'فاتورة الكهرباء وتبريد المخزن البيطري', timestamp: now - 5 * ONE_DAY, recordedBy: 'أحمد محمود (كاشير)' },
  { id: 'exp-03', category: 'صيانة ومعدات', amount: 450.0, description: 'صيانة جهاز قراءة الباركود وطابعة الإيصالات', timestamp: now - 8 * ONE_DAY, recordedBy: 'أحمد محمود (كاشير)' },
  { id: 'exp-04', category: 'نثريات ومطبوعات', amount: 220.0, description: 'شراء ورق إيصالات حرارية وأكياس تغليف', timestamp: now - 1 * ONE_DAY, recordedBy: 'أحمد محمود (كاشير)' },
  { id: 'exp-05', category: 'رواتب ومكافآت', amount: 4000.0, description: 'سلفة نصف شهرية للمساعدين والعمال', timestamp: now - 12 * ONE_DAY, recordedBy: 'مدير النظام د. عبدالله عادل' },
];

const DEFAULT_RETURNS: ReturnEntity[] = [
  {
    returnId: 'RET-101',
    originalSaleId: 'INV-1004',
    timestamp: now - 1 * ONE_DAY,
    totalAmount: 135.0,
    taxRefund: 18.9,
    taxAmount: 18.9,
    grandTotal: 153.9,
    cashierName: 'أحمد محمود (كاشير)',
    customerName: 'عيادة د. محمد البيطرية',
    reason: 'استبدال بعبوة بحجم مختلف',
    items: [
      {
        productId: 'prod-004',
        productName: 'تيلوزين طرطرات 50% قابل للذوبان 100 جم',
        quantity: 1,
        unitPrice: 135.0,
        refundAmount: 135.0,
      },
    ],
  },
];

const DEFAULT_CASH_MOVEMENTS: CashMovementEntity[] = [
  { id: 'cash-01', type: 'OPENING', amount: 2500.0, description: 'رصيد الخزينة الافتتاحي (عهدة الصندوق)', timestamp: now - 15 * ONE_DAY, recordedBy: 'مدير النظام د. عبدالله عادل' },
  { id: 'cash-02', type: 'SALE_CASH', amount: 1265.4, description: 'مبيعات نقدية فاتورة INV-1001', timestamp: now - 2 * ONE_HOUR, recordedBy: 'أحمد محمود (كاشير)' },
  { id: 'cash-03', type: 'SALE_CASH', amount: 3534.0, description: 'مبيعات نقدية فاتورة INV-1003', timestamp: now - 1 * ONE_DAY - 3 * ONE_HOUR, recordedBy: 'أحمد محمود (كاشير)' },
  { id: 'cash-04', type: 'EXPENSE', amount: 220.0, description: 'صرف نثريات ورق وأكياس تغليف', timestamp: now - 1 * ONE_DAY, recordedBy: 'أحمد محمود (كاشير)' },
  { id: 'cash-05', type: 'RETURN_CASH', amount: 153.9, description: 'استرداد نقدي لمرتجع فاتورة INV-1004', timestamp: now - 1 * ONE_DAY, recordedBy: 'أحمد محمود (كاشير)' },
];

const DEFAULT_SETTINGS: AppSettingsEntity = {
  storeName: 'ميكروبوز للبيطرة والأعلاف (MicroPOS)',
  activityName: 'تجارة وتوزيع الأدوية البيطرية والأعلاف وإضافات الأعلاف',
  phone: '01012345678',
  address: 'جمهورية مصر العربية - الدلتا - طريق المنصورة الزراعي',
  taxNumber: '109-882-341',
  commercialReg: 'CR-889922',
  taxRate: 14,
  currencySymbol: 'ج.م',
  invoiceFooter: 'شكراً لتعاملكم الراقي معنا! البضاعة المباعة ترد وتستبدل خلال 14 يوماً مع إحضار أصل الفاتورة.',
  invoiceTemplate: 'THERMAL_80MM',
  autoFocusBarcode: true,
  defaultLowStockThreshold: 10,
  inventoryValuationPolicy: 'FIFO',
  allowNegativeStock: false,
  enableMultiBranch: true,
  activeBranchId: 'branch-01',
  activeWarehouseId: 'wh-01',
  themeMode: 'LIGHT',
  autoBackupEnabled: true,
  soundEffects: true,
  qrCodeOnInvoice: true,
};

const DEFAULT_WAREHOUSES: WarehouseEntity[] = [
  { id: 'wh-01', name: 'المستودع الرئيسي (الصيدلية البيطرية)', code: 'WH-MAIN', location: 'المبنى الرئيسي - طابق المبيعات', isDefault: true, managerName: 'د. عبدالله عادل' },
  { id: 'wh-02', name: 'مخزن الأدوية واللقاحات (غرفة التبريد)', code: 'WH-COLD', location: 'المبنى الرئيسي - ثلاجة حفظ الأمصال', isDefault: false, managerName: 'عمرو السيد' },
  { id: 'wh-03', name: 'مستودع الأعلاف والإضافات المركزة', code: 'WH-FEED', location: 'الهنجر الإقليمي - قسم التخزين الجاف', isDefault: false, managerName: 'عمرو السيد' },
];

const DEFAULT_BRANCHES: BranchEntity[] = [
  { id: 'branch-01', name: 'الفرع الرئيسي - مركز التوزيع', code: 'BR-01', address: 'طريق المنصورة الزراعي - مجمع الإرشاد البيطري', phone: '01012345678', isMain: true },
  { id: 'branch-02', name: 'فرع مزرعة الوادي ومنافذ التوزيع', code: 'BR-02', address: 'منطقة المزارع - الكيلو 15 طريق المطار', phone: '01198765432', isMain: false },
];

const DEFAULT_PURCHASES: PurchaseBillEntity[] = [
  {
    purchaseId: 'PO-2001',
    date: now - 3 * ONE_DAY,
    supplierId: 'sup-01',
    supplierName: 'شركة الدلتا للأدوية واللقاحات',
    status: 'RECEIVED',
    items: [
      { productId: 'prod-001', productName: 'مضاد حيوي أوكسي تتراسيكلين 20%', quantity: 50, unitPrice: 58.0, totalPrice: 2900.0, batchNumber: 'BATCH-OXY-24', expiryDate: '2026-11-15' },
      { productId: 'prod-002', productName: 'فيتامين هـ + سيلينيوم فائق التركيز 1 لتر', quantity: 30, unitPrice: 110.0, totalPrice: 3300.0, batchNumber: 'BATCH-ESEL-24', expiryDate: '2027-01-20' },
    ],
    subtotal: 6200.0,
    taxAmount: 868.0,
    discount: 200.0,
    grandTotal: 6868.0,
    paidAmount: 4000.0,
    remainingAmount: 2868.0,
    paymentMethod: 'SPLIT',
    warehouseId: 'wh-01',
    recordedBy: 'م. إبراهيم خليل (مسؤول مشتريات)',
    notes: 'توريد دفعة طوارئ لقاحات ومضادات حيوية',
  },
  {
    purchaseId: 'PO-2002',
    date: now - 8 * ONE_DAY,
    supplierId: 'sup-02',
    supplierName: 'مصنع النيل للأعلاف المركزة',
    status: 'RECEIVED',
    items: [
      { productId: 'prod-003', productName: 'علف بادي دواجن بروتين 23% سوبر (شيكارة 50 كجم)', quantity: 40, unitPrice: 620.0, totalPrice: 24800.0, batchNumber: 'FEED-BROIL-99', expiryDate: '2026-08-30' },
    ],
    subtotal: 24800.0,
    taxAmount: 0.0,
    discount: 500.0,
    grandTotal: 24300.0,
    paidAmount: 15000.0,
    remainingAmount: 9300.0,
    paymentMethod: 'BANK_TRANSFER',
    warehouseId: 'wh-03',
    recordedBy: 'م. إبراهيم خليل (مسؤول مشتريات)',
    notes: 'توريد أعلاف موسمية مع خصم كميات',
  },
];

const DEFAULT_QUOTATIONS: QuotationEntity[] = [
  {
    quotationId: 'QT-1001',
    date: now - 2 * ONE_DAY,
    expiryDate: now + 12 * ONE_DAY,
    customerId: 'cust-01',
    customerName: 'مزارع النور للدواجن',
    customerPhone: '01012345678',
    status: 'SENT',
    items: [
      { productId: 'prod-001', productName: 'مضاد حيوي أوكسي تتراسيكلين 20%', quantity: 20, unitPrice: 85.0, totalPrice: 1700.0 },
      { productId: 'prod-003', productName: 'علف بادي دواجن بروتين 23% سوبر (شيكارة 50 كجم)', quantity: 15, unitPrice: 720.0, totalPrice: 10800.0 },
    ],
    subtotal: 12500.0,
    taxAmount: 1750.0,
    discount: 250.0,
    grandTotal: 14000.0,
    notes: 'تسليم بمقر المزرعة خلال 48 ساعة من تأكيد العرض',
    createdBy: 'مدير النظام د. عبدالله عادل',
  },
];

const DEFAULT_DRAWER_CLOSINGS: DrawerClosingEntity[] = [
  {
    closingId: 'CLS-901',
    date: now - 1 * ONE_DAY,
    cashierName: 'أحمد محمود (كاشير)',
    branchId: 'branch-01',
    openingFloat: 2500.0,
    cashSales: 4800.0,
    customerPayments: 1200.0,
    cashExpenses: 450.0,
    cashReturns: 153.9,
    supplierPayouts: 0.0,
    expectedCash: 7896.1,
    actualCashCounted: 7896.0,
    difference: -0.1,
    notes: 'إغلاق وردية المساء - مطابقة تامة',
    status: 'APPROVED',
  },
];

const DEFAULT_AUDIT_LOGS: AuditLogEntity[] = [
  {
    logId: 'AUD-001',
    timestamp: now - 2 * ONE_HOUR,
    username: 'admin',
    action: 'CREATE_SALE',
    entityType: 'INVOICE',
    entityId: 'INV-1001',
    details: 'إصدار فاتورة بيع نقدية بقيمة 1,265.40 ج.م للعميل نقدي عام',
    ipOrDevice: 'MicroPOS Terminal 01',
  },
  {
    logId: 'AUD-002',
    timestamp: now - 1 * ONE_DAY,
    username: 'cashier1',
    action: 'PROCESS_RETURN',
    entityType: 'RETURN',
    entityId: 'RET-101',
    details: 'تسجيل مرتجع بيع جزئي على فاتورة INV-1004 بقيمة 153.90 ج.م',
    ipOrDevice: 'MicroPOS Terminal 01',
  },
  {
    logId: 'AUD-003',
    timestamp: now - 3 * ONE_DAY,
    username: 'purchases1',
    action: 'RECEIVE_PURCHASE',
    entityType: 'PURCHASE_BILL',
    entityId: 'PO-2001',
    details: 'استلام بضاعة شراء من شركة الدلتا للأدوية واللقاحات بقيمة 6,868 ج.م',
    ipOrDevice: 'Backoffice PC',
  },
];

class StorageService {
  constructor() {
    this.initializeDefaults();
  }

  public getItem<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return fallback;
    }
  }

  public setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to storage:`, e);
    }
  }

  public initializeDefaults(): void {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.setItem(STORAGE_KEYS.USERS, DEFAULT_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.setItem(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SALES) || this.getItem<SaleEntity[]>(STORAGE_KEYS.SALES, []).length === 0) {
      this.setItem(STORAGE_KEYS.SALES, DEFAULT_SALES_DATA.sales);
      this.setItem(STORAGE_KEYS.SALE_ITEMS, DEFAULT_SALES_DATA.items);
      this.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, DEFAULT_SALES_DATA.movements);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
      this.setItem(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      this.setItem(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUPPLIERS)) {
      this.setItem(STORAGE_KEYS.SUPPLIERS, DEFAULT_SUPPLIERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.RETURNS)) {
      this.setItem(STORAGE_KEYS.RETURNS, DEFAULT_RETURNS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CASH_MOVEMENTS)) {
      this.setItem(STORAGE_KEYS.CASH_MOVEMENTS, DEFAULT_CASH_MOVEMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE)) {
      this.setItem(STORAGE_KEYS.SYNC_QUEUE, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.setItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.WAREHOUSES)) {
      this.setItem(STORAGE_KEYS.WAREHOUSES, DEFAULT_WAREHOUSES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BRANCHES)) {
      this.setItem(STORAGE_KEYS.BRANCHES, DEFAULT_BRANCHES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PURCHASES)) {
      this.setItem(STORAGE_KEYS.PURCHASES, DEFAULT_PURCHASES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUOTATIONS)) {
      this.setItem(STORAGE_KEYS.QUOTATIONS, DEFAULT_QUOTATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.STOCK_TRANSFERS)) {
      this.setItem(STORAGE_KEYS.STOCK_TRANSFERS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DRAWER_CLOSINGS)) {
      this.setItem(STORAGE_KEYS.DRAWER_CLOSINGS, DEFAULT_DRAWER_CLOSINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      this.setItem(STORAGE_KEYS.AUDIT_LOGS, DEFAULT_AUDIT_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, []);
    }
  }

  // Authentication
  public getUserByUsername(username: string): UserEntity | undefined {
    const users = this.getItem<UserEntity[]>(STORAGE_KEYS.USERS, []);
    return users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  }

  public getCurrentUser(): UserEntity | null {
    return this.getItem<UserEntity | null>(STORAGE_KEYS.CURRENT_USER, null);
  }

  public setCurrentUser(user: UserEntity | null): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  // Products
  public getAllProducts(): ProductEntity[] {
    return this.getItem<ProductEntity[]>(STORAGE_KEYS.PRODUCTS, []);
  }

  public searchProduct(query: string): ProductEntity | undefined {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return undefined;
    const products = this.getAllProducts();
    return products.find(
      (p) => p.barcode.toLowerCase() === trimmed || p.name.toLowerCase().includes(trimmed)
    );
  }

  public insertProduct(product: ProductEntity): void {
    const products = this.getAllProducts();
    const existingIndex = products.findIndex((p) => p.id === product.id || p.barcode === product.barcode);
    if (existingIndex >= 0) {
      products[existingIndex] = product;
    } else {
      products.push(product);
    }
    this.setItem(STORAGE_KEYS.PRODUCTS, products);

    // Add to sync queue
    this.insertSyncQueue({
      queueId: Date.now() + Math.floor(Math.random() * 1000),
      entityType: 'PRODUCT',
      entityId: product.id,
      action: existingIndex >= 0 ? 'UPDATE' : 'INSERT',
      payloadJson: JSON.stringify(product),
      timestamp: Date.now(),
      synced: false,
    });
  }

  public updateProduct(product: ProductEntity): void {
    const products = this.getAllProducts();
    const index = products.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
      this.setItem(STORAGE_KEYS.PRODUCTS, products);
    }
  }

  // Stock Adjustment
  public adjustStock(productId: string, newStock: number, reason: string = 'جرد يدوي'): void {
    const products = this.getAllProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const diff = newStock - product.currentStock;
    product.currentStock = newStock;
    this.setItem(STORAGE_KEYS.PRODUCTS, products);

    // Record movement
    const movement: StockMovementEntity = {
      movementId: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      productId,
      changeType: 'ADJUSTMENT',
      quantityChanged: diff,
      stockAfter: newStock,
      timestamp: Date.now(),
      referenceId: reason,
    };
    const movements = this.getItem<StockMovementEntity[]>(STORAGE_KEYS.STOCK_MOVEMENTS, []);
    movements.unshift(movement);
    this.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, movements);

    // Sync queue
    this.insertSyncQueue({
      queueId: Date.now() + Math.floor(Math.random() * 1000),
      entityType: 'STOCK_MOVEMENT',
      entityId: movement.movementId,
      action: 'INSERT',
      payloadJson: JSON.stringify(movement),
      timestamp: Date.now(),
      synced: false,
    });
  }

  // Atomic Sales Transaction (Transaction Engine)
  public executeSaleTransaction(
    sale: SaleEntity,
    items: SaleItemEntity[],
    productUpdates?: { product: ProductEntity; qtySold: number }[]
  ): void {
    const sales = this.getItem<SaleEntity[]>(STORAGE_KEYS.SALES, []);
    sales.unshift(sale);
    this.setItem(STORAGE_KEYS.SALES, sales);

    const saleItems = this.getItem<SaleItemEntity[]>(STORAGE_KEYS.SALE_ITEMS, []);
    saleItems.push(...items);
    this.setItem(STORAGE_KEYS.SALE_ITEMS, saleItems);

    const products = this.getAllProducts();
    const movements = this.getItem<StockMovementEntity[]>(STORAGE_KEYS.STOCK_MOVEMENTS, []);

    const actualUpdates = productUpdates || items.map((it) => {
      const prod = products.find((p) => p.id === it.productId);
      return prod ? { product: prod, qtySold: it.quantity } : null;
    }).filter(Boolean) as { product: ProductEntity; qtySold: number }[];

    for (const update of actualUpdates) {
      const pIndex = products.findIndex((p) => p.id === update.product.id);
      if (pIndex >= 0) {
        const newStock = Math.max(0, products[pIndex].currentStock - update.qtySold);
        products[pIndex].currentStock = newStock;

        const movement: StockMovementEntity = {
          movementId: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          productId: update.product.id,
          changeType: 'SALE',
          quantityChanged: -update.qtySold,
          stockAfter: newStock,
          timestamp: sale.timestamp,
          referenceId: sale.saleId,
        };
        movements.unshift(movement);
      }
    }

    this.setItem(STORAGE_KEYS.PRODUCTS, products);
    this.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, movements);

    // Record cash inflow if payment method is cash
    if (sale.paymentMethod === 'CASH') {
      this.insertCashMovement({
        id: 'cash-sale-' + Date.now(),
        type: 'SALE_CASH',
        amount: sale.grandTotal,
        description: `مبيعات نقدية فاتورة ${sale.saleId} (${sale.customerName || 'عميل نقدي'})`,
        timestamp: sale.timestamp,
        recordedBy: sale.cashierName,
      });
    }

    // Add to Google Cloud / Firestore sync queue
    this.insertSyncQueue({
      queueId: Date.now() + Math.floor(Math.random() * 1000),
      entityType: 'SALE',
      entityId: sale.saleId,
      action: 'INSERT',
      payloadJson: JSON.stringify({
        saleId: sale.saleId,
        cashier: sale.cashierName,
        total: sale.grandTotal,
        tax: sale.taxAmount,
        subtotal: sale.totalAmount,
        paymentMethod: sale.paymentMethod,
        itemsCount: items.length,
        timestamp: sale.timestamp,
      }),
      timestamp: Date.now(),
      synced: false,
    });
  }

  // Sales and Items
  public getAllSales(): SaleEntity[] {
    return this.getItem<SaleEntity[]>(STORAGE_KEYS.SALES, []);
  }

  public getSaleItems(saleId: string): SaleItemEntity[] {
    const all = this.getItem<SaleItemEntity[]>(STORAGE_KEYS.SALE_ITEMS, []);
    return all.filter((i) => i.saleId === saleId);
  }

  public getAllSaleItems(): SaleItemEntity[] {
    return this.getItem<SaleItemEntity[]>(STORAGE_KEYS.SALE_ITEMS, []);
  }

  public getStockMovements(): StockMovementEntity[] {
    return this.getItem<StockMovementEntity[]>(STORAGE_KEYS.STOCK_MOVEMENTS, []);
  }

  // Expenses
  public getAllExpenses(): ExpenseEntity[] {
    return this.getItem<ExpenseEntity[]>(STORAGE_KEYS.EXPENSES, []);
  }

  public insertExpense(expense: ExpenseEntity): void {
    const expenses = this.getAllExpenses();
    expenses.unshift(expense);
    this.setItem(STORAGE_KEYS.EXPENSES, expenses);

    // Record cash outflow
    this.insertCashMovement({
      id: 'cash-exp-' + Date.now(),
      type: 'EXPENSE',
      amount: expense.amount,
      description: `صرف مصروف: ${expense.category} - ${expense.description}`,
      timestamp: expense.timestamp,
      recordedBy: expense.recordedBy,
    });

    // Add to sync queue
    this.insertSyncQueue({
      queueId: Date.now() + Math.floor(Math.random() * 1000),
      entityType: 'EXPENSE',
      entityId: expense.id,
      action: 'INSERT',
      payloadJson: JSON.stringify(expense),
      timestamp: Date.now(),
      synced: false,
    });
  }

  public deleteExpense(id: string): void {
    const expenses = this.getAllExpenses().filter((e) => e.id !== id);
    this.setItem(STORAGE_KEYS.EXPENSES, expenses);
  }

  // Customers
  public getAllCustomers(): CustomerEntity[] {
    return this.getItem<CustomerEntity[]>(STORAGE_KEYS.CUSTOMERS, []);
  }

  public insertCustomer(customer: CustomerEntity): void {
    const customers = this.getAllCustomers();
    customers.push(customer);
    this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
  }

  public updateCustomer(customer: CustomerEntity): void {
    const customers = this.getAllCustomers();
    const index = customers.findIndex((c) => c.id === customer.id);
    if (index >= 0) {
      customers[index] = customer;
      this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
    }
  }

  // Suppliers
  public getAllSuppliers(): SupplierEntity[] {
    return this.getItem<SupplierEntity[]>(STORAGE_KEYS.SUPPLIERS, []);
  }

  public insertSupplier(supplier: SupplierEntity): void {
    const suppliers = this.getAllSuppliers();
    suppliers.push(supplier);
    this.setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
  }

  public updateSupplier(supplier: SupplierEntity): void {
    const suppliers = this.getAllSuppliers();
    const index = suppliers.findIndex((s) => s.id === supplier.id);
    if (index >= 0) {
      suppliers[index] = supplier;
      this.setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
    }
  }

  // Returns
  public getAllReturns(): ReturnEntity[] {
    return this.getItem<ReturnEntity[]>(STORAGE_KEYS.RETURNS, []);
  }

  public executeReturnTransaction(returnRecord: ReturnEntity): void {
    const returns = this.getAllReturns();
    returns.unshift(returnRecord);
    this.setItem(STORAGE_KEYS.RETURNS, returns);

    // Update sale status
    const sales = this.getAllSales();
    const saleIndex = sales.findIndex((s) => s.saleId === returnRecord.originalSaleId);
    if (saleIndex >= 0) {
      sales[saleIndex].status = 'RETURNED';
      this.setItem(STORAGE_KEYS.SALES, sales);
    }

    // Restock returned items & create movements
    const products = this.getAllProducts();
    const movements = this.getStockMovements();

    for (const item of returnRecord.items) {
      const pIndex = products.findIndex((p) => p.id === item.productId);
      if (pIndex >= 0) {
        products[pIndex].currentStock += item.quantity;
        const mov: StockMovementEntity = {
          movementId: 'mov-ret-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          productId: item.productId,
          changeType: 'RETURN',
          quantityChanged: item.quantity,
          stockAfter: products[pIndex].currentStock,
          timestamp: returnRecord.timestamp,
          referenceId: `مرتجع فاتورة ${returnRecord.originalSaleId}`,
        };
        movements.unshift(mov);
      }
    }

    this.setItem(STORAGE_KEYS.PRODUCTS, products);
    this.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, movements);

    // Record cash refund movement
    this.insertCashMovement({
      id: 'cash-ret-' + Date.now(),
      type: 'RETURN_CASH',
      amount: returnRecord.grandTotal,
      description: `استرداد نقدي لمرتجع ${returnRecord.returnId} (فاتورة ${returnRecord.originalSaleId})`,
      timestamp: returnRecord.timestamp,
      recordedBy: returnRecord.cashierName,
    });

    // Add to sync queue
    this.insertSyncQueue({
      queueId: Date.now() + Math.floor(Math.random() * 1000),
      entityType: 'RETURN',
      entityId: returnRecord.returnId,
      action: 'INSERT',
      payloadJson: JSON.stringify(returnRecord),
      timestamp: Date.now(),
      synced: false,
    });
  }

  // Cash Movements
  public getAllCashMovements(): CashMovementEntity[] {
    return this.getItem<CashMovementEntity[]>(STORAGE_KEYS.CASH_MOVEMENTS, []);
  }

  public insertCashMovement(movement: CashMovementEntity): void {
    const movements = this.getAllCashMovements();
    movements.unshift(movement);
    this.setItem(STORAGE_KEYS.CASH_MOVEMENTS, movements);
  }

  // App Settings & Customization
  public getSettings(): AppSettingsEntity {
    return this.getItem<AppSettingsEntity>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  public updateSettings(partial: Partial<AppSettingsEntity>): AppSettingsEntity {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    this.setItem(STORAGE_KEYS.SETTINGS, updated);
    this.logAudit('UPDATE_SETTINGS', 'SETTINGS', 'APP_CONFIG', 'تحديث إعدادات النظام والتخصيص');
    return updated;
  }

  // Purchases
  public getAllPurchases(): PurchaseBillEntity[] {
    return this.getItem<PurchaseBillEntity[]>(STORAGE_KEYS.PURCHASES, []);
  }

  public getPurchaseById(id: string): PurchaseBillEntity | undefined {
    return this.getAllPurchases().find((p) => p.purchaseId === id);
  }

  public executePurchaseTransaction(bill: PurchaseBillEntity): void {
    const purchases = this.getAllPurchases();
    purchases.unshift(bill);
    this.setItem(STORAGE_KEYS.PURCHASES, purchases);

    // Update stock and stock movements
    const products = this.getAllProducts();
    const movements = this.getItem<StockMovementEntity[]>(STORAGE_KEYS.STOCK_MOVEMENTS, []);

    for (const item of bill.items) {
      const pIndex = products.findIndex((p) => p.id === item.productId);
      if (pIndex >= 0) {
        products[pIndex].currentStock += item.quantity;
        // update purchase price if newer
        products[pIndex].purchasePrice = item.unitPrice;
        if (item.batchNumber) products[pIndex].batchNumber = item.batchNumber;
        if (item.expiryDate) products[pIndex].expiryDate = item.expiryDate;

        const movement: StockMovementEntity = {
          movementId: 'mov-pur-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          productId: item.productId,
          changeType: 'PURCHASE',
          quantityChanged: item.quantity,
          stockAfter: products[pIndex].currentStock,
          timestamp: bill.date,
          referenceId: bill.purchaseId,
          warehouseId: bill.warehouseId,
          recordedBy: bill.recordedBy,
        };
        movements.unshift(movement);
      }
    }
    this.setItem(STORAGE_KEYS.PRODUCTS, products);
    this.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, movements);

    // Update Supplier Balance
    const suppliers = this.getAllSuppliers();
    const sIndex = suppliers.findIndex((s) => s.id === bill.supplierId);
    if (sIndex >= 0) {
      suppliers[sIndex].balance += bill.remainingAmount;
      suppliers[sIndex].currentBalance += bill.remainingAmount;
      suppliers[sIndex].lastTransactionDate = bill.date;
      this.setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
    }

    // Record cash payout if paid in cash
    if (bill.paidAmount > 0 && (bill.paymentMethod === 'CASH' || bill.paymentMethod === 'SPLIT')) {
      this.insertCashMovement({
        id: 'cash-pur-' + Date.now(),
        type: 'SUPPLIER_PAYMENT',
        amount: bill.paidAmount,
        description: `دفعة مشتريات فاتورة ${bill.purchaseId} - المورد: ${bill.supplierName}`,
        timestamp: bill.date,
        recordedBy: bill.recordedBy,
      });
    }

    // Audit log
    this.logAudit(
      'CREATE_PURCHASE',
      'PURCHASE_BILL',
      bill.purchaseId,
      `فاتورة شراء جديدة بقيمة ${bill.grandTotal} ج.م من المورد ${bill.supplierName}`,
      bill.recordedBy
    );
  }

  // Quotations
  public getAllQuotations(): QuotationEntity[] {
    return this.getItem<QuotationEntity[]>(STORAGE_KEYS.QUOTATIONS, []);
  }

  public getQuotationById(id: string): QuotationEntity | undefined {
    return this.getAllQuotations().find((q) => q.quotationId === id);
  }

  public insertQuotation(quotation: QuotationEntity): void {
    const quotations = this.getAllQuotations();
    quotations.unshift(quotation);
    this.setItem(STORAGE_KEYS.QUOTATIONS, quotations);
    this.logAudit('CREATE_QUOTATION', 'QUOTATION', quotation.quotationId, `إنشاء عرض سعر للعميل ${quotation.customerName}`);
  }

  public updateQuotation(quotation: QuotationEntity): void {
    const quotations = this.getAllQuotations();
    const index = quotations.findIndex((q) => q.quotationId === quotation.quotationId);
    if (index >= 0) {
      quotations[index] = quotation;
      this.setItem(STORAGE_KEYS.QUOTATIONS, quotations);
      this.logAudit('UPDATE_QUOTATION', 'QUOTATION', quotation.quotationId, `تحديث حالة عرض السعر إلى ${quotation.status}`);
    }
  }

  // Warehouses & Stock Transfers
  public getAllWarehouses(): WarehouseEntity[] {
    return this.getItem<WarehouseEntity[]>(STORAGE_KEYS.WAREHOUSES, DEFAULT_WAREHOUSES);
  }

  public insertWarehouse(warehouse: WarehouseEntity): void {
    const list = this.getAllWarehouses();
    list.push(warehouse);
    this.setItem(STORAGE_KEYS.WAREHOUSES, list);
    this.logAudit('CREATE_WAREHOUSE', 'WAREHOUSE', warehouse.id, `إضافة مستودع جديد: ${warehouse.name}`);
  }

  public getAllStockTransfers(): StockTransferEntity[] {
    return this.getItem<StockTransferEntity[]>(STORAGE_KEYS.STOCK_TRANSFERS, []);
  }

  public executeStockTransfer(transfer: StockTransferEntity): void {
    const transfers = this.getAllStockTransfers();
    transfers.unshift(transfer);
    this.setItem(STORAGE_KEYS.STOCK_TRANSFERS, transfers);

    // Record stock movements
    const movements = this.getItem<StockMovementEntity[]>(STORAGE_KEYS.STOCK_MOVEMENTS, []);
    const products = this.getAllProducts();
    const prod = products.find((p) => p.id === transfer.productId);
    const stockNow = prod ? prod.currentStock : 0;

    movements.unshift({
      movementId: 'tr-out-' + Date.now(),
      productId: transfer.productId,
      changeType: 'TRANSFER_OUT',
      quantityChanged: -transfer.quantity,
      stockAfter: stockNow,
      timestamp: transfer.date,
      referenceId: `${transfer.transferId}: نقل من ${transfer.fromWarehouseName} إلى ${transfer.toWarehouseName}`,
      warehouseId: transfer.fromWarehouseId,
      recordedBy: transfer.recordedBy,
    });

    movements.unshift({
      movementId: 'tr-in-' + Date.now(),
      productId: transfer.productId,
      changeType: 'TRANSFER_IN',
      quantityChanged: transfer.quantity,
      stockAfter: stockNow,
      timestamp: transfer.date,
      referenceId: `${transfer.transferId}: استلام في ${transfer.toWarehouseName} من ${transfer.fromWarehouseName}`,
      warehouseId: transfer.toWarehouseId,
      recordedBy: transfer.recordedBy,
    });

    this.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, movements);
    this.logAudit(
      'STOCK_TRANSFER',
      'WAREHOUSE_TRANSFER',
      transfer.transferId,
      `تحويل مخزني: ${transfer.quantity} من ${transfer.productName} من ${transfer.fromWarehouseName} إلى ${transfer.toWarehouseName}`,
      transfer.recordedBy
    );
  }

  // Branches
  public getAllBranches(): BranchEntity[] {
    return this.getItem<BranchEntity[]>(STORAGE_KEYS.BRANCHES, DEFAULT_BRANCHES);
  }

  public getActiveBranchId(): string {
    const settings = this.getSettings();
    return settings.activeBranchId || 'branch-01';
  }

  public setActiveBranchId(branchId: string): void {
    this.updateSettings({ activeBranchId: branchId });
  }

  // Drawer Closings (إغلاق اليومية / تقفيل الوردية)
  public getAllDrawerClosings(): DrawerClosingEntity[] {
    return this.getItem<DrawerClosingEntity[]>(STORAGE_KEYS.DRAWER_CLOSINGS, DEFAULT_DRAWER_CLOSINGS);
  }

  public executeDrawerClosing(closing: DrawerClosingEntity): void {
    const closings = this.getAllDrawerClosings();
    closings.unshift(closing);
    this.setItem(STORAGE_KEYS.DRAWER_CLOSINGS, closings);
    this.logAudit(
      'CLOSE_DRAWER',
      'TREASURY',
      closing.closingId,
      `إغلاق الوردية للكاشير ${closing.cashierName}: رصيد دفتري ${closing.expectedCash} ج.م، فعلي ${closing.actualCashCounted} ج.م (فارق: ${closing.difference} ج.م)`
    );
  }

  // Audit Logs
  public getAllAuditLogs(): AuditLogEntity[] {
    return this.getItem<AuditLogEntity[]>(STORAGE_KEYS.AUDIT_LOGS, DEFAULT_AUDIT_LOGS);
  }

  public logAudit(action: string, entityType: string, entityId: string, details: string, username?: string): void {
    const currentUser = this.getCurrentUser();
    const user = username || (currentUser ? currentUser.fullName : 'نظام آلي');
    const logs = this.getAllAuditLogs();
    const newLog: AuditLogEntity = {
      logId: 'AUD-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 100),
      timestamp: Date.now(),
      username: user,
      action,
      entityType,
      entityId,
      details,
      ipOrDevice: 'MicroPOS Terminal',
    };
    logs.unshift(newLog);
    // Keep max 500 logs
    if (logs.length > 500) logs.length = 500;
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // Dynamic Notification Center
  public getNotifications(): NotificationItem[] {
    const notifications: NotificationItem[] = [];
    const products = this.getAllProducts();
    const customers = this.getAllCustomers();
    const settings = this.getSettings();
    const threshold = settings.defaultLowStockThreshold || 10;
    const nowTime = Date.now();

    // Check low and out of stock products
    for (const p of products) {
      if (p.currentStock <= 0) {
        notifications.push({
          id: 'notif-out-' + p.id,
          type: 'ALERT',
          title: 'نفاد رصيد المخزون',
          message: `الصنف (${p.name}) نفد تماماً من المخزن (${p.currentStock}). يرجى عمل أمر شراء.`,
          timestamp: nowTime - 3600000,
          read: false,
          targetScreen: 'PURCHASES',
        });
      } else if (p.currentStock <= (p.minStockLimit || threshold)) {
        notifications.push({
          id: 'notif-low-' + p.id,
          type: 'WARNING',
          title: 'تنبيه حد الأمان للمخزون',
          message: `الصنف (${p.name}) قارب على النفاد. الرصيد الحالي: ${p.currentStock} فقط (حد الأمان: ${p.minStockLimit || threshold}).`,
          timestamp: nowTime - 7200000,
          read: false,
          targetScreen: 'PRODUCTS',
        });
      }

      // Check Expiry Date within 90 days
      if (p.expiryDate) {
        const expTime = new Date(p.expiryDate).getTime();
        const diffDays = Math.ceil((expTime - nowTime) / (1000 * 3600 * 24));
        if (diffDays < 0) {
          notifications.push({
            id: 'notif-exp-' + p.id,
            type: 'ALERT',
            title: 'صنف منتهي الصلاحية',
            message: `الصنف (${p.name}) تشغيلة (${p.batchNumber}) انتهت صلاحيته بتاريخ ${p.expiryDate}. لا يجوز بيعه!`,
            timestamp: nowTime - 1800000,
            read: false,
            targetScreen: 'INVENTORY_HUB',
          });
        } else if (diffDays <= 90) {
          notifications.push({
            id: 'notif-near-exp-' + p.id,
            type: 'WARNING',
            title: 'قرب انتهاء الصلاحية',
            message: `الصنف (${p.name}) متبقي على انتهائه ${diffDays} يوماً (تاريخ الانتهاء: ${p.expiryDate}). يفضل بيعه أولاً (FIFO).`,
            timestamp: nowTime - 10800000,
            read: false,
            targetScreen: 'INVENTORY_HUB',
          });
        }
      }
    }

    // Check Customer Credit Limit Breach
    for (const c of customers) {
      if (c.creditLimit > 0 && c.balance > c.creditLimit) {
        notifications.push({
          id: 'notif-cred-' + c.id,
          type: 'WARNING',
          title: 'تجاوز الحد الائتماني',
          message: `العميل (${c.name}) تجاوز حده الائتماني بمبلغ ${(c.balance - c.creditLimit).toLocaleString()} ج.م (الرصيد: ${c.balance.toLocaleString()} ج.م).`,
          timestamp: nowTime - 86400000,
          read: false,
          targetScreen: 'CUSTOMERS',
        });
      }
    }

    return notifications;
  }

  // Backup & Restore
  public exportBackupJson(): string {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      timestamp: Date.now(),
      settings: this.getSettings(),
      users: this.getItem(STORAGE_KEYS.USERS, []),
      products: this.getAllProducts(),
      sales: this.getAllSales(),
      saleItems: this.getAllSaleItems(),
      stockMovements: this.getStockMovements(),
      expenses: this.getAllExpenses(),
      customers: this.getAllCustomers(),
      suppliers: this.getAllSuppliers(),
      returns: this.getAllReturns(),
      cashMovements: this.getAllCashMovements(),
      purchases: this.getAllPurchases(),
      quotations: this.getAllQuotations(),
      warehouses: this.getAllWarehouses(),
      stockTransfers: this.getAllStockTransfers(),
      drawerClosings: this.getAllDrawerClosings(),
      auditLogs: this.getAllAuditLogs(),
    };
    return JSON.stringify(backupData, null, 2);
  }

  public restoreBackupJson(jsonString: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !data.products || !data.users) {
        return { success: false, error: 'الملف غير صالح أو لا يحتوي على بنية بيانات نظام MicroPOS.' };
      }
      if (data.settings) this.setItem(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.users) this.setItem(STORAGE_KEYS.USERS, data.users);
      if (data.products) this.setItem(STORAGE_KEYS.PRODUCTS, data.products);
      if (data.sales) this.setItem(STORAGE_KEYS.SALES, data.sales);
      if (data.saleItems) this.setItem(STORAGE_KEYS.SALE_ITEMS, data.saleItems);
      if (data.stockMovements) this.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, data.stockMovements);
      if (data.expenses) this.setItem(STORAGE_KEYS.EXPENSES, data.expenses);
      if (data.customers) this.setItem(STORAGE_KEYS.CUSTOMERS, data.customers);
      if (data.suppliers) this.setItem(STORAGE_KEYS.SUPPLIERS, data.suppliers);
      if (data.returns) this.setItem(STORAGE_KEYS.RETURNS, data.returns);
      if (data.cashMovements) this.setItem(STORAGE_KEYS.CASH_MOVEMENTS, data.cashMovements);
      if (data.purchases) this.setItem(STORAGE_KEYS.PURCHASES, data.purchases);
      if (data.quotations) this.setItem(STORAGE_KEYS.QUOTATIONS, data.quotations);
      if (data.warehouses) this.setItem(STORAGE_KEYS.WAREHOUSES, data.warehouses);
      if (data.stockTransfers) this.setItem(STORAGE_KEYS.STOCK_TRANSFERS, data.stockTransfers);
      if (data.drawerClosings) this.setItem(STORAGE_KEYS.DRAWER_CLOSINGS, data.drawerClosings);
      if (data.auditLogs) this.setItem(STORAGE_KEYS.AUDIT_LOGS, data.auditLogs);

      this.logAudit('RESTORE_BACKUP', 'SYSTEM', 'DATABASE', 'استعادة قاعدة البيانات من ملف نسخة احتياطية خارجي');
      return { success: true };
    } catch (e) {
      return { success: false, error: 'خطأ في قراءة ملف JSON: ' + (e as Error).message };
    }
  }

  // Sync Queue
  public getSyncQueue(): SyncQueueEntity[] {
    return this.getItem<SyncQueueEntity[]>(STORAGE_KEYS.SYNC_QUEUE, []);
  }

  public insertSyncQueue(item: SyncQueueEntity): void {
    const queue = this.getSyncQueue();
    queue.unshift(item);
    this.setItem(STORAGE_KEYS.SYNC_QUEUE, queue);
  }

  public syncAllPending(): Promise<{ syncedCount: number }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const queue = this.getSyncQueue();
        const pendingCount = queue.filter((item) => !item.synced).length;
        const updated = queue.map((item) => ({ ...item, synced: true }));
        this.setItem(STORAGE_KEYS.SYNC_QUEUE, updated);
        resolve({ syncedCount: pendingCount });
      }, 900);
    });
  }

  public clearSyncedQueue(): void {
    const queue = this.getSyncQueue();
    const remaining = queue.filter((item) => !item.synced);
    this.setItem(STORAGE_KEYS.SYNC_QUEUE, remaining);
  }

  public resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.SALE_ITEMS);
    localStorage.removeItem(STORAGE_KEYS.STOCK_MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.SUPPLIERS);
    localStorage.removeItem(STORAGE_KEYS.RETURNS);
    localStorage.removeItem(STORAGE_KEYS.CASH_MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.PURCHASES);
    localStorage.removeItem(STORAGE_KEYS.QUOTATIONS);
    localStorage.removeItem(STORAGE_KEYS.WAREHOUSES);
    localStorage.removeItem(STORAGE_KEYS.STOCK_TRANSFERS);
    localStorage.removeItem(STORAGE_KEYS.BRANCHES);
    localStorage.removeItem(STORAGE_KEYS.DRAWER_CLOSINGS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    this.initializeDefaults();
  }
}

export const storage = new StorageService();
