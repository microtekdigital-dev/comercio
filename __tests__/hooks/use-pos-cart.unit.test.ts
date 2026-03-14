/**
 * Unit tests for usePOSCart hook and calculateCartTotals helper
 * Requirements: 1.2, 1.4
 */

import { calculateCartTotals } from '@/hooks/use-pos-cart';
import type { POSCartItem } from '@/lib/types/pos';

// =====================================================
// Helpers
// =====================================================

function makeItem(overrides: Partial<POSCartItem> = {}): POSCartItem {
  const quantity = overrides.quantity ?? 1;
  const unit_price = overrides.unit_price ?? 100;
  const tax_rate = overrides.tax_rate ?? 0;
  const discount_percent = overrides.discount_percent ?? 0;

  const grossSubtotal = quantity * unit_price;
  const itemDiscount = grossSubtotal * (discount_percent / 100);
  const subtotal = grossSubtotal - itemDiscount;
  const tax_amount = subtotal * tax_rate;
  const total = subtotal + tax_amount;

  return {
    id: 'item-1',
    product_id: 'prod-1',
    product_name: 'Test Product',
    product_sku: null,
    variant_id: null,
    variant_name: null,
    quantity,
    unit_price,
    tax_rate,
    discount_percent,
    subtotal,
    tax_amount,
    total,
    image_url: null,
    ...overrides,
  };
}

// =====================================================
// calculateCartTotals
// =====================================================

describe('calculateCartTotals', () => {
  it('returns zero totals for empty cart', () => {
    const result = calculateCartTotals([], 'percentage', 0);
    expect(result.subtotal).toBe(0);
    expect(result.discount_amount).toBe(0);
    expect(result.tax_amount).toBe(0);
    expect(result.total).toBe(0);
  });

  it('sums subtotals from all items', () => {
    const items = [
      makeItem({ quantity: 2, unit_price: 50, subtotal: 100, tax_amount: 0, total: 100 }),
      makeItem({ id: 'item-2', quantity: 1, unit_price: 200, subtotal: 200, tax_amount: 0, total: 200 }),
    ];
    const result = calculateCartTotals(items, 'percentage', 0);
    expect(result.subtotal).toBeCloseTo(300);
  });

  it('applies percentage discount correctly', () => {
    const items = [makeItem({ subtotal: 200, tax_amount: 0, total: 200 })];
    const result = calculateCartTotals(items, 'percentage', 10);
    expect(result.discount_amount).toBeCloseTo(20);
    expect(result.total).toBeCloseTo(180);
  });

  it('applies fixed discount correctly', () => {
    const items = [makeItem({ subtotal: 200, tax_amount: 0, total: 200 })];
    const result = calculateCartTotals(items, 'fixed', 50);
    expect(result.discount_amount).toBeCloseTo(50);
    expect(result.total).toBeCloseTo(150);
  });

  it('fixed discount does not exceed subtotal', () => {
    const items = [makeItem({ subtotal: 100, tax_amount: 0, total: 100 })];
    const result = calculateCartTotals(items, 'fixed', 999);
    expect(result.discount_amount).toBeCloseTo(100);
    expect(result.total).toBeCloseTo(0);
  });

  it('sums tax amounts from all items', () => {
    const items = [
      makeItem({ subtotal: 100, tax_amount: 21, total: 121 }),
      makeItem({ id: 'item-2', subtotal: 200, tax_amount: 42, total: 242 }),
    ];
    const result = calculateCartTotals(items, 'percentage', 0);
    expect(result.tax_amount).toBeCloseTo(63);
  });

  it('total = subtotal - discount + tax', () => {
    const items = [makeItem({ subtotal: 200, tax_amount: 20, total: 220 })];
    const result = calculateCartTotals(items, 'percentage', 10);
    // subtotal=200, discount=20, tax=20 → total=200
    expect(result.total).toBeCloseTo(200);
  });

  it('percentage discount of 0 does not change total', () => {
    const items = [makeItem({ subtotal: 150, tax_amount: 0, total: 150 })];
    const result = calculateCartTotals(items, 'percentage', 0);
    expect(result.discount_amount).toBe(0);
    expect(result.total).toBeCloseTo(150);
  });

  it('fixed discount of 0 does not change total', () => {
    const items = [makeItem({ subtotal: 150, tax_amount: 0, total: 150 })];
    const result = calculateCartTotals(items, 'fixed', 0);
    expect(result.discount_amount).toBe(0);
    expect(result.total).toBeCloseTo(150);
  });
});
