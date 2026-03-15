import type { DiscountType, ItemTotals, SaleItemFormData, SaleTotals } from '@/lib/types/erp';

// =====================================================
// Discount Calculator — Pure utility functions
// =====================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates the discount applied to a sale item.
 * For percentage: must be in [0, 100].
 * For fixed: must be in [0, unitPrice * quantity].
 */
export function validateItemDiscount(
  unitPrice: number,
  quantity: number,
  discountType: DiscountType,
  discountValue: number
): ValidationResult {
  if (typeof discountValue !== 'number' || isNaN(discountValue)) {
    return { valid: false, error: 'El valor del descuento debe ser un número válido' };
  }
  if (discountType === 'percentage') {
    if (discountValue < 0 || discountValue > 100) {
      return { valid: false, error: 'El porcentaje de descuento debe estar entre 0 y 100' };
    }
  } else {
    const subtotal = unitPrice * quantity;
    if (discountValue < 0) {
      return { valid: false, error: 'El monto de descuento no puede ser negativo' };
    }
    if (discountValue > subtotal) {
      return { valid: false, error: 'El descuento no puede superar el precio del ítem' };
    }
  }
  return { valid: true };
}

/**
 * Calculates the discount amount for a single item.
 * Assumes the discount has already been validated.
 */
export function calculateItemDiscount(
  unitPrice: number,
  quantity: number,
  discountType: DiscountType,
  discountValue: number
): number {
  const subtotal = unitPrice * quantity;
  if (discountType === 'percentage') {
    return subtotal * (discountValue / 100);
  }
  return discountValue;
}

/**
 * Calculates all totals for a single sale item.
 * Uses discount_type + discount_fixed if present, otherwise falls back to discount_percent.
 */
export function calculateItemTotals(item: SaleItemFormData): ItemTotals {
  const subtotal = item.unit_price * item.quantity;

  let discountAmount: number;
  const discountType: DiscountType = item.discount_type ?? 'percentage';
  const discountValue =
    discountType === 'fixed'
      ? (item.discount_fixed ?? 0)
      : (item.discount_percent ?? 0);

  discountAmount = calculateItemDiscount(item.unit_price, item.quantity, discountType, discountValue);

  const subtotalNet = subtotal - discountAmount;
  const taxAmount = subtotalNet * ((item.tax_rate ?? 0) / 100);
  const total = subtotalNet + taxAmount;

  return {
    subtotal,
    discount_amount: discountAmount,
    subtotal_net: subtotalNet,
    tax_amount: taxAmount,
    total,
  };
}

/**
 * Validates the global discount applied to the whole sale.
 * For percentage: must be in [0, 100].
 * For fixed: must be in [0, subtotal].
 */
export function validateGlobalDiscount(
  subtotal: number,
  discountType: DiscountType,
  discountValue: number
): ValidationResult {
  if (typeof discountValue !== 'number' || isNaN(discountValue)) {
    return { valid: false, error: 'El valor del descuento debe ser un número válido' };
  }
  if (discountType === 'percentage') {
    if (discountValue < 0 || discountValue > 100) {
      return { valid: false, error: 'El porcentaje de descuento debe estar entre 0 y 100' };
    }
  } else {
    if (discountValue < 0) {
      return { valid: false, error: 'El monto de descuento no puede ser negativo' };
    }
    if (discountValue > subtotal) {
      return { valid: false, error: 'El descuento global no puede superar el subtotal de la venta' };
    }
  }
  return { valid: true };
}

/**
 * Calculates the global discount amount over the sale subtotal.
 * Assumes the discount has already been validated.
 */
export function calculateGlobalDiscount(
  subtotal: number,
  discountType: DiscountType,
  discountValue: number
): number {
  if (discountType === 'percentage') {
    return subtotal * (discountValue / 100);
  }
  return discountValue;
}

/**
 * Orchestrates all discount calculations for a sale.
 * Returns SaleTotals or throws if total <= 0.
 */
export function calculateSaleTotals(
  items: SaleItemFormData[],
  globalDiscountType: DiscountType = 'percentage',
  globalDiscountValue: number = 0
): SaleTotals {
  const itemTotals = items.map(calculateItemTotals);

  const subtotal = itemTotals.reduce((sum, t) => sum + t.subtotal_net, 0);
  const taxAmount = itemTotals.reduce((sum, t) => sum + t.tax_amount, 0);

  const discountAmount = calculateGlobalDiscount(subtotal, globalDiscountType, globalDiscountValue);
  const total = subtotal - discountAmount + taxAmount;

  if (total <= 0) {
    throw new Error('El total de la venta debe ser mayor a cero');
  }

  return {
    subtotal,
    discount_amount: discountAmount,
    tax_amount: taxAmount,
    total,
  };
}
