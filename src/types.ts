export type UserRole = 'OWNER' | 'ADMIN' | 'CASHIER' | 'ACCOUNTANT' | 'WAREHOUSE' | 'PURCHASES';

export interface UserEntity {
  id?: string;
  username: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  branchId?: string;
}

export interface ProductEntity {
  id: string;
  name: string;
  barcode: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  wholesalePrice?: number;
  specialPrice?: number;
  unit?: string; // 'قطعة' | 'عبوة' | 'شيكارة' | 'كرتونة' | 'لتر'
  currentStock: number;
  minStockLimit: number;
  maxStockLimit?: number;
  batchNumber: string;
  expiryDate: string;
  supplierId?: string;
  supplierName?: string;
  warehouseId?: string;
  imageUrl?: string;
  notes?: string;
}

export type PaymentMethodType = 'CASH' | 'CARD' | 'CREDIT' | 'BANK_TRANSFER' | 'SPLIT';

export interface SplitPaymentDetail {
  method: PaymentMethodType;
  amount: number;
  reference?: string;
}

export interface SaleEntity {
  saleId: string;
  timestamp: number;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount?: number;
  paymentMethod: PaymentMethodType;
  splitPayments?: SplitPaymentDetail[];
  cashierName: string;
  customerName?: string;
  customerId?: string;
  branchId?: string;
  warehouseId?: string;
  status?: 'COMPLETED' | 'RETURNED' | 'PARTIALLY_RETURNED';
  notes?: string;
}

export interface SaleItemEntity {
  itemId: number;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  totalPrice: number;
  profit?: number;
}

export interface StockMovementEntity {
  movementId: string;
  productId: string;
  changeType: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  quantityChanged: number;
  stockAfter: number;
  timestamp: number;
  referenceId: string;
  warehouseId?: string;
  recordedBy?: string;
}

export interface ExpenseEntity {
  id: string;
  category: string;
  amount: number;
  description: string;
  timestamp: number;
  recordedBy: string;
  branchId?: string;
}

export interface CustomerEntity {
  id: string;
  name: string;
  phone: string;
  address?: string;
  taxNumber?: string;
  balance: number; // positive = owed by customer, negative = credit
  currentBalance?: number;
  creditLimit: number;
  lastTransactionDate: number;
  totalPurchases?: number;
  email?: string;
  notes?: string;
}

export interface SupplierEntity {
  id: string;
  name: string;
  company?: string;
  companyName?: string;
  phone: string;
  email?: string;
  address?: string;
  balance: number; // positive = owed to supplier
  currentBalance?: number;
  contactPerson?: string;
  creditLimit?: number;
  lastTransactionDate: number;
  notes?: string;
}

export interface ReturnEntity {
  returnId: string;
  originalSaleId: string;
  customerId?: string;
  timestamp: number;
  totalAmount: number;
  taxRefund?: number;
  taxAmount: number;
  grandTotal: number;
  cashierName: string;
  customerName?: string;
  reason: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    refundAmount?: number;
    totalPrice?: number;
  }[];
}

export interface CashMovementEntity {
  id: string;
  type: 'OPENING' | 'OPENING_FLOAT' | 'SALE_CASH' | 'EXPENSE' | 'EXPENSE_CASH' | 'DEPOSIT' | 'WITHDRAW' | 'RETURN_CASH' | 'CUSTOMER_PAYMENT' | 'SUPPLIER_PAYMENT' | 'TRANSFER_BOX';
  amount: number;
  description: string;
  timestamp: number;
  recordedBy: string;
  branchId?: string;
}

export interface PurchaseItemEntity {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface PurchaseBillEntity {
  purchaseId: string;
  date: number;
  supplierId: string;
  supplierName: string;
  status: 'RECEIVED' | 'ORDERED' | 'DRAFT' | 'CANCELLED';
  items: PurchaseItemEntity[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethodType;
  warehouseId: string;
  recordedBy: string;
  notes?: string;
}

export interface QuotationItemEntity {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface QuotationEntity {
  quotationId: string;
  date: number;
  expiryDate?: number;
  validUntil?: number;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED';
  items: QuotationItemEntity[];
  subtotal?: number;
  totalAmount?: number;
  taxAmount: number;
  discount?: number;
  discountAmount?: number;
  grandTotal: number;
  convertedSaleId?: string;
  notes?: string;
  createdBy: string;
}

export interface WarehouseEntity {
  id: string;
  name: string;
  code: string;
  location: string;
  isDefault: boolean;
  managerName?: string;
}

export interface StockTransferEntity {
  transferId: string;
  date: number;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  productId: string;
  productName: string;
  quantity: number;
  recordedBy: string;
  notes?: string;
  status?: string;
}

export interface BranchEntity {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  isMain: boolean;
}

export interface DrawerClosingEntity {
  closingId: string;
  date: number;
  cashierName: string;
  cashierId?: string;
  branchId?: string;
  shiftName?: string;
  openingFloat?: number;
  openingCash?: number;
  cashSales?: number;
  totalSalesCash?: number;
  customerPayments?: number;
  totalCustomerPayments?: number;
  cashExpenses?: number;
  totalExpensesCash?: number;
  cashReturns?: number;
  totalReturnsCash?: number;
  supplierPayouts?: number;
  totalSupplierPayments?: number;
  expectedCash: number;
  actualCashCounted: number;
  difference: number; // actual - expected
  notes?: string;
  status: 'CLOSED' | 'APPROVED' | 'BALANCED' | 'DEFICIT' | 'SURPLUS';
}

export interface AuditLogEntity {
  logId: string;
  timestamp: number;
  username: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipOrDevice?: string;
}

export interface AppSettingsEntity {
  storeName: string;
  activityName: string;
  phone: string;
  address: string;
  taxNumber: string;
  commercialReg: string;
  taxRate: number; // e.g. 14%
  enableTax?: boolean;
  currencySymbol: string; // e.g. "ج.م"
  defaultOpeningFloat?: number;
  invoiceFooter: string;
  invoiceTemplate: 'THERMAL_80MM' | 'A4_STANDARD' | 'MODERN_CLEAN';
  autoFocusBarcode: boolean;
  defaultLowStockThreshold: number;
  inventoryValuationPolicy: 'FIFO' | 'WEIGHTED_AVG';
  allowNegativeStock: boolean;
  enableMultiBranch: boolean;
  activeBranchId: string;
  activeWarehouseId: string;
  themeMode: 'LIGHT' | 'DARK';
  autoBackupEnabled: boolean;
  soundEffects: boolean;
  qrCodeOnInvoice: boolean;
}

export interface NotificationItem {
  id: string;
  type: 'WARNING' | 'ALERT' | 'INFO' | 'SUCCESS';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  targetScreen?: ScreenState;
}

export interface ReportFilterState {
  datePreset: 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'ALL' | 'CUSTOM';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  cashier: string; // 'ALL' or cashierName
  category: string; // 'ALL' or category name
  paymentMethod: string; // 'ALL' | 'CASH' | 'CARD' | 'CREDIT' | 'BANK_TRANSFER' | 'SPLIT'
  searchQuery: string;
}

export interface SyncQueueEntity {
  queueId: number;
  entityType: 'SALE' | 'PRODUCT' | 'STOCK_MOVEMENT' | 'EXPENSE' | 'RETURN' | 'PURCHASE' | 'SETTINGS';
  entityId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payloadJson: string;
  timestamp: number;
  synced?: boolean;
}

export interface CartItem {
  product: ProductEntity;
  quantity: number;
  customPrice?: number;
  discount?: number;
}

export type ScreenState =
  | 'LOGIN'
  | 'DASHBOARD'
  | 'POS'
  | 'PRODUCTS'
  | 'PURCHASES'
  | 'QUOTATIONS'
  | 'CUSTOMERS'
  | 'SUPPLIERS'
  | 'INVENTORY_HUB'
  | 'TREASURY'
  | 'REPORTS'
  | 'AI_ASSISTANT'
  | 'SETTINGS'
  | 'INVOICES'
  | 'SYNC_QUEUE';
