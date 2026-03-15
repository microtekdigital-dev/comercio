import { describe, it, expect } from 'vitest';
import {
  validateItemDiscount,
  calculateItemDiscount,
  calculateItemTotals,
  validateGlobalDiscount,
  calculateGlobalDiscount,
  calculateSaleTotals,
} from '@/lib/utils/discount-calculator';
import type { SaleItemFormData } from '@/lib/types/erp';

// Helper to build a minimal SaleItemFormData
function makeItem(overrides: Partial<SaleItemFormData> = {}): SaleItemFormData {
  return {
    product_name: 'Test',
    quantity: 2,
    unit_price: 100,
    tax_rate: 21,
    discount_percent: 0,
    ...overrides,
  };
}

// =====================================================
// validateItemDiscount
// =====================================================
describe('validateItemDiscount', () => {
  it('accepts percentage 0', () => {
    expect(validateItemDiscount(100, 1, 'percentage', 0).valid).toBe(true);
  });

  it('accepts percentage 100', () => {
    expect(validateItemDiscount(100, 1, 'percentage', 100).valid).toBe(true);
  });

  it('rejects percentage > 100', () => {
    const r = validateItemDiscount(100, 1, 'percentage', 101);
    expect(r.valid).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it('rejects negative percentage', () => {
    expect(validateItemDiscount(100, 1, 'percentage', -1).valid).toBe(false);
  });

  it('accepts fixed = 0', () => {
    expect(validateItemDiscount(100, 2, 'fixed', 0).valid).toBe(true);
  });

  it('accepts fixed equal to subtotal', () => {
    expect(validateItemDiscount(100, 2, 'fixed', 200).valid).toBe(true);
  });

  it('rejects fixed > subtotal', () => {
    expect(validateItemDiscount(100, 2, 'fixed', 201).valid).toBe(false);
  });

  it('rejects negative fixed', () => {
    expect(validateItemDiscount(100, 2, 'fixed', -1).valid).toBe(false);
  });
});

// =====================================================
// calculateItemDiscount
// =====================================================
describe('calculateItemDiscount', () => {
  it('calculates percentage discount correctly', () => {
    expect(calculateItemDiscount(100, 2, 'percentage', 10)).toBe(20);
  });

  it('returns fixed discount as-is', () => {
    expect(calculateItemDiscount(100, 2, 'fixed', 50)).toBe(50);
  });

  it('returns 0 for 0% discount', () => {
    expect(calculateItemDiscount(100, 3, 'percentage', 0)).toBe(0);
  });
});

// =====================================================
// calculateItemTotals
// =====================================================
describe('calculateItemTotals', () => {
  it('calculates totals with no discount', () => {
    const item = makeItem({ unit_price: 100, quantity: 2, tax_rate: 10, discount_percent: 0 });
    const t = calculateItemTotals(item);
    expect(t.subtotal).toBe(200);
    expect(t.discount_amount).toBe(0);
    expect(t.subtotal_net).toBe(200);
    expect(t.tax_amount).toBe(20);
    expect(t.total).toBe(220);
  });

  it('calculates totals with percentage discount', () => {
    const item = makeItem({ unit_price: 100, quantity: 2, tax_rate: 10, discount_percent: 50 });
    const t = calculateItemTotals(item);
    expect(t.subtotal).toBe(200);
    expect(t.discount_amount).toBe(100);
    expect(t.subtotal_net).toBe(100);
    expect(t.tax_amount).toBe(10);
    expect(t.total).toBe(110);
  });

  it('calculates totals with fixed discount', () => {
    const item = makeItem({
      unit_price: 100,
      quantity: 2,
      tax_rate: 10,
      discount_percent: 0,
      discount_type: 'fixed',
      discount_fixed: 30,
    });
    const t = calculateItemTotals(item);
    expect(t.subtotal).toBe(200);
    expect(t.discount_amount).toBe(30);
    expect(t.subtotal_net).toBe(170);
    expect(t.tax_amount).toBeCloseTo(17);
    expect(t.total).toBeCloseTo(187);
  });

  it('tax is calculated on subtotal_net, not gross subtotal', () => {
    const item = makeItem({ unit_price: 200, quantity: 1, tax_rate: 21, discount_percent: 50 });
    const t = calculateItemTotals(item);
    expect(t.subtotal_net).toBe(100);
    expect(t.tax_amount).toBeCloseTo(21);
  });
});

// =====================================================
// validateGlobalDiscount
// =====================================================
describe('validateGlobalDiscount', () => {
  it('accepts percentage in [0, 100]', () => {
    expect(validateGlobalDiscount(500, 'percentage', 20).valid).toBe(true);
  });

  it('rejects percentage > 100', () => {
    expect(validateGlobalDiscount(500, 'percentage', 101).valid).toBe(false);
  });

  it('accepts fixed <= subtotal', () => {
    expect(validateGlobalDiscount(500, 'fixed', 500).valid).toBe(true);
  });

  it('rejects fixed > subtotal', () => {
    expect(validateGlobalDiscount(500, 'fixed', 501).valid).toBe(false);
  });

  it('rejects negative fixed', () => {
    expect(validateGlobalDiscount(500, 'fixed', -1).valid).toBe(false);
  });
});

// =====================================================
// calculateGlobalDiscount
// =====================================================
describe('calculateGlobalDiscount', () => {
  it('calculates percentage global discount', () => {
    expect(calculateGlobalDiscount(1000, 'percentage', 10)).toBe(100);
  });

  it('returns fixed global discount as-is', () => {
    expect(calculateGlobalDiscount(1000, 'fixed', 150)).toBe(150);
  });

  it('returns 0 for 0% global discount', () => {
    expect(calculateGlobalDiscount(1000, 'percentage', 0)).toBe(0);
  });
});

// =====================================================
// calculateSaleTotals
// =====================================================
describe('calculateSaleTotals', () => {
  it('calculates totals for a single item with no global discount', () => {
    const items = [makeItem({ unit_price: 100, quantity: 1, tax_rate: 0, discount_percent: 0 })];
    const t = calculateSaleTotals(items, 'percentage', 0);
    expect(t.subtotal).toBe(100);
    expect(t.discount_amount).toBe(0);
    expect(t.tax_amount).toBe(0);
    expect(t.total).toBe(100);
  });

  it('applies global percentage discount over item subtotals', () => {
    const items = [makeItem({ unit_price: 200, quantity: 1, tax_rate: 0, discount_percent: 0 })];
    const t = calculateSaleTotals(items, 'percentage', 10);
    expect(t.subtotal).toBe(200);
    expect(t.discount_amount).toBe(20);
    expect(t.total).toBe(180);
  });

  it('applies global fixed discount', () => {
    const items = [makeItem({ unit_price: 200, quantity: 1, tax_rate: 0, discount_percent: 0 })];
    const t = calculateSaleTotals(items, 'fixed', 50);
    expect(t.discount_amount).toBe(50);
    expect(t.total).toBe(150);
  });

  it('combines item discount and global discount', () => {
    // item: 100 * 2 = 200, 50% item discount → subtotal_net = 100
    // global 10% → discount = 10, total = 90 (no tax)
    const items = [makeItem({ unit_price: 100, quantity: 2, tax_rate: 0, discount_percent: 50 })];
    const t = calculateSaleTotals(items, 'percentage', 10);
    expect(t.subtotal).toBe(100);
    expect(t.discount_amount).toBe(10);
    expect(t.total).toBe(90);
  });

  it('sums tax from all items', () => {
    const items = [
      makeItem({ unit_price: 100, quantity: 1, tax_rate: 10, discount_percent: 0 }),
      makeItem({ unit_price: 200, quantity: 1, tax_rate: 20, discount_percent: 0 }),
    ];
    const t = calculateSaleTotals(items, 'percentage', 0);
    expect(t.tax_amount).toBeCloseTo(50); // 10 + 40
    expect(t.total).toBeCloseTo(350);
  });

  it('throws when total would be <= 0', () => {
    // 100% global discount → total = 0
    const items = [makeItem({ unit_price: 100, quantity: 1, tax_rate: 0, discount_percent: 0 })];
    expect(() => calculateSaleTotals(items, 'percentage', 100)).toThrow();
  });

  it('discount 0 is idempotent — same result as no discount', () => {
    const items = [makeItem({ unit_price: 150, quantity: 3, tax_rate: 21, discount_percent: 0 })];
    const withZero = calculateSaleTotals(items, 'percentage', 0);
    const withoutDiscount = calculateSaleTotals(items);
    expect(withZero).toEqual(withoutDiscount);
  });
});
