// =====================================================
// ERP Types
// =====================================================

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document_type: string | null;
  document_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  notes: string | null;
  status: 'active' | 'inactive' | 'blocked';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  color: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  company_id: string;
  category_id: string | null;
  supplier_id: string | null; // Proveedor asociado al producto
  sku: string | null;
  name: string;
  description: string | null;
  type: 'product' | 'service';
  price: number;
  cost: number;
  currency: string;
  tax_rate: number;
  stock_quantity: number;
  min_stock_level: number;
  track_inventory: boolean;
  is_active: boolean;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  supplier?: Supplier; // Relación con proveedor para consultas JOIN
}

export interface Sale {
  id: string;
  company_id: string;
  customer_id: string | null;
  sale_number: string;
  status: 'draft' | 'completed' | 'cancelled';
  sale_date: string;
  due_date: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  currency: string;
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded';
  payment_method: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  items?: SaleItem[];
  payments?: SalePayment[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_percent: number;
  subtotal: number;
  tax_amount: number;
  total: number;
  created_at: string;
  product?: Product;
}

export interface SalePayment {
  id: string;
  sale_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

// Form types
export interface CustomerFormData {
  name: string;
  email?: string;
  phone?: string;
  document_type?: string;
  document_number?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'blocked';
}

export interface ProductFormData {
  category_id?: string;
  supplier_id?: string; // Proveedor del producto (opcional)
  sku?: string;
  name: string;
  description?: string;
  type: 'product' | 'service';
  price: number;
  cost?: number;
  currency: string;
  tax_rate?: number;
  stock_quantity?: number;
  min_stock_level?: number;
  track_inventory: boolean;
  is_active: boolean;
  image_url?: string;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  sort_order?: number;
  is_active: boolean;
}

export interface SaleFormData {
  customer_id?: string;
  status: 'draft' | 'completed' | 'cancelled';
  sale_date: string;
  due_date?: string;
  payment_method?: string;
  notes?: string;
  items: SaleItemFormData[];
}

export interface SaleItemFormData {
  product_id?: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_percent: number;
}

// Analytics types
export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingSales: number;
  lowStockProducts: number;
  revenueGrowth: number;
  salesGrowth: number;
}

export interface SalesChartData {
  date: string;
  revenue: number;
  sales: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface TopCustomer {
  customer_id: string;
  customer_name: string;
  total_sales: number;
  total_revenue: number;
}

// =====================================================
// Supplier Types
// =====================================================

export interface Supplier {
  id: string;
  company_id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  tax_id: string | null;
  website: string | null;
  notes: string | null;
  status: 'active' | 'inactive';
  payment_terms: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  company_id: string;
  supplier_id: string;
  order_number: string;
  order_date: string;
  expected_date: string | null;
  received_date: string | null;
  status: 'pending' | 'confirmed' | 'received' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  currency: string;
  payment_status: 'pending' | 'partial' | 'paid';
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
  payments?: SupplierPayment[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_cost: number;
  tax_rate: number;
  discount_percent: number;
  subtotal: number;
  tax_amount: number;
  total: number;
  received_quantity: number;
  created_at: string;
  product?: Product;
}

export interface SupplierPayment {
  id: string;
  company_id: string;
  supplier_id: string;
  purchase_order_id: string | null;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

// Form types
export interface SupplierFormData {
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  tax_id?: string;
  website?: string;
  notes?: string;
  status: 'active' | 'inactive';
  payment_terms?: string;
}

export interface PurchaseOrderFormData {
  supplier_id: string;
  order_date: string;
  expected_date?: string;
  status: 'pending' | 'confirmed' | 'received' | 'cancelled';
  notes?: string;
  items: PurchaseOrderItemFormData[];
}

export interface PurchaseOrderItemFormData {
  product_id?: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_cost: number;
  tax_rate: number;
  discount_percent: number;
}

// =====================================================
// Quote Types (Presupuestos)
// =====================================================

export interface Quote {
  id: string;
  company_id: string;
  customer_id: string | null;
  quote_number: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  quote_date: string;
  valid_until: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  currency: string;
  notes: string | null;
  terms: string | null;
  sent_at: string | null;
  sent_to_email: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  converted_to_sale_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  items?: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_percent: number;
  subtotal: number;
  tax_amount: number;
  total: number;
  created_at: string;
  product?: Product;
}

// Form types
export interface QuoteFormData {
  customer_id?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  quote_date: string;
  valid_until: string;
  notes?: string;
  terms?: string;
  items: QuoteItemFormData[];
}

export interface QuoteItemFormData {
  product_id?: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_percent: number;
}

// =====================================================
// Cash Register Types (Cierre de Caja)
// =====================================================

export interface CashRegisterClosure {
  id: string;
  company_id: string;
  closure_date: string;
  shift: string | null;
  closed_by: string;
  closed_by_name: string;
  total_sales_count: number;
  total_sales_amount: number;
  cash_sales: number;
  card_sales: number;
  transfer_sales: number;
  other_sales: number;
  cash_counted: number | null;
  cash_difference: number | null;
  notes: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface CashRegisterClosureFormData {
  closure_date: string;
  shift?: string;
  cash_counted?: number;
  notes?: string;
}

// =====================================================
// Stock Movement Types (Historial de Stock)
// =====================================================

export interface StockMovement {
  id: string;
  company_id: string;
  product_id: string;
  movement_type: 'purchase' | 'sale' | 'adjustment_in' | 'adjustment_out' | 'return_in' | 'return_out';
  quantity: number;
  stock_before: number;
  stock_after: number;
  sale_id: string | null;
  purchase_order_id: string | null;
  created_by: string;
  created_by_name: string;
  notes: string | null;
  created_at: string;
  product?: Product;
}

export interface StockMovementFormData {
  product_id: string;
  movement_type: 'adjustment_in' | 'adjustment_out';
  quantity: number;
  notes?: string;
}

export interface StockMovementFilters {
  productId?: string;
  movementType?: string;
  dateFrom?: string;
  dateTo?: string;
  employeeId?: string;
  purchaseOrderId?: string;
}

export interface StockMovementStats {
  totalIn: number;
  totalOut: number;
  purchases: number;
  sales: number;
  adjustmentsIn: number;
  adjustmentsOut: number;
}

// =====================================================
// Price Change Types (Historial de Precios)
// =====================================================

export interface PriceChange {
  id: string;
  company_id: string;
  product_id: string;
  price_type: 'sale_price' | 'cost_price';
  old_value: number;
  new_value: number;
  changed_by: string;
  changed_by_name: string;
  changed_by_role: string;
  reason: string | null;
  created_at: string;
  product?: Product;
}

export interface PriceChangeFilters {
  productId?: string;
  priceType?: 'sale_price' | 'cost_price';
  dateFrom?: string;
  dateTo?: string;
  employeeId?: string;
}

export interface PriceChangeFormData {
  product_id: string;
  price_type: 'sale_price' | 'cost_price';
  new_value: number;
  reason?: string;
}
