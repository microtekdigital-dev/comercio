import type { Product, ProductVariant } from '@/lib/types/erp';

// =====================================================
// POS Cart Types
// =====================================================

export interface POSCartItem {
  id: string; // ID temporal para gestión del carrito
  product_id: string;
  product_name: string;
  product_sku: string | null;
  variant_id: string | null;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_percent: number;
  subtotal: number;
  tax_amount: number;
  total: number;
  image_url: string | null;
}

export interface POSCart {
  items: POSCartItem[];
  customer_id: string | null;
  customer_name: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
}

// =====================================================
// POS Payment Types
// =====================================================

export interface POSPayment {
  payment_method: string;
  amount: number;
}

// =====================================================
// POS Sale Request
// =====================================================

export interface POSSaleRequest {
  customer_id: string | null;
  items: POSCartItem[];
  payments: POSPayment[];
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  notes: string | null;
  opening_id: string | null;
  invoice_type?: 'consumidor_final' | 'factura_a' | 'factura_b';
}

// =====================================================
// Offline Queue (Plan Empresarial)
// =====================================================

export interface OfflineQueueItem {
  id: string;
  sale_data: POSSaleRequest;
  timestamp: number;
  retry_count: number;
  status: 'pending' | 'syncing' | 'failed';
}

// =====================================================
// POS Product Search
// =====================================================

export interface POSProductSearchResult extends Product {
  variants?: ProductVariant[];
}

// =====================================================
// POS Reports
// =====================================================

export interface POSReportFilters {
  dateFrom: string;
  dateTo: string;
  cashierId?: string;
}

export interface POSSalesByCashier {
  cashier_id: string;
  cashier_name: string;
  total_sales: number;
  total_amount: number;
}

export interface POSTopProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface POSPaymentMethodReport {
  payment_method: string;
  total_amount: number;
  transaction_count: number;
}

export interface POSSalesByHour {
  hour: number; // 0-23
  total_sales: number;
  total_amount: number;
}

// =====================================================
// Constants
// =====================================================

export const INITIAL_POS_CART: POSCart = {
  items: [],
  customer_id: null,
  customer_name: null,
  discount_type: 'percentage',
  discount_value: 0,
  subtotal: 0,
  discount_amount: 0,
  tax_amount: 0,
  total: 0,
};

export const POS_PAYMENT_METHODS: string[] = [
  'Efectivo',
  'Tarjeta de Débito',
  'Tarjeta de Crédito',
  'Transferencia',
  'Mercado Pago',
  'Otro',
];
