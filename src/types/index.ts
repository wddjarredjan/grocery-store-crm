export type UserRole =
  | 'admin_owner'
  | 'manager'
  | 'cashier'
  | 'inventory'
  | 'purchasing'
  | 'inventory_clerk';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: UserRole;
  pin: string;
  avatar?: string;
  isActive: boolean;
}

export type GroceryCategory =
  | 'Produce & Fruits'
  | 'Dairy & Eggs'
  | 'Bakery & Deli'
  | 'Meat & Poultry'
  | 'Beverages'
  | 'Pantry & Grains'
  | 'Snacks & Sweets'
  | 'Household & Care';

export type ProductUnit = 'pcs' | 'kg' | 'pack' | 'box' | 'bunch' | 'bottle' | 'bag';

export interface Product {
  id: string;
  barcode: string;
  plu?: string; // Price Look-Up code for fresh produce
  name: string;
  category: GroceryCategory;
  unit: ProductUnit;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockThreshold: number;
  isWeighted?: boolean; // If sold by weight (scale input required)
  imageUrl?: string;
  supplier?: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number; // e.g. 2 pcs or 1.45 kg
  unitPrice: number;
  discountPercent: number;
  totalPrice: number;
  notes?: string;
}

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'e_wallet' | 'store_credit';

export interface SaleItem {
  productId: string;
  barcode: string;
  name: string;
  category: GroceryCategory;
  unit: ProductUnit;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discountPercent: number;
  totalPrice: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  cashierId: string;
  cashierName: string;
  items: SaleItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountTendered: number;
  changeAmount: number;
  customerName?: string;
  createdAt: string;
  status: 'completed' | 'refunded' | 'voided';
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  changeQuantity: number;
  previousStock: number;
  newStock: number;
  reason: 'sale' | 'restock' | 'spoilage_waste' | 'supplier_delivery' | 'inventory_audit' | 'return';
  recordedBy: string;
  timestamp: string;
}

export interface LowStockAlert {
  id: string;
  productId: string;
  productName: string;
  category: GroceryCategory;
  currentStock: number;
  minThreshold: number;
  unit: ProductUnit;
  timestamp: string;
  isRead: boolean;
}

export interface HeldOrder {
  id: string;
  cart: CartItem[];
  customerNote?: string;
  createdAt: string;
}

export interface CashDrawerShift {
  id: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  startingCashFloat: number;
  cashSales: number;
  nonCashSales: number;
  expectedDrawerCash: number;
  actualDrawerCash?: number;
  difference?: number;
  status: 'open' | 'closed';
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastSyncedAt?: string;
}

export interface SystemHistoryEntry {
  id: string;
  actorId?: string;
  actorName?: string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: string; // JSON string or short description
  timestamp: string;
}
