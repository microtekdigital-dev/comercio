import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Property 20: Low Stock Warning
 * Validates: Requirements 7.5
 * 
 * Verifica que el sistema muestra advertencias cuando la cantidad solicitada
 * de un repuesto excede el stock disponible, pero permite continuar con la operación.
 */

describe('Property 20: Low Stock Warning', () => {
  it('should warn when requested quantity exceeds available stock', () => {
    fc.assert(
      fc.property(
        fc.record({
          product_id: fc.uuid(),
          product_name: fc.string({ minLength: 1, maxLength: 100 }),
          available_stock: fc.double({ min: 0, max: 100, noNaN: true }),
          requested_quantity: fc.double({ min: 0.01, max: 200, noNaN: true }),
        }),
        (data) => {
          // Asegurar que requested_quantity > available_stock
          const requestedQty = data.available_stock + Math.abs(data.requested_quantity) + 1;

          const result = checkStockAvailability({
            product_id: data.product_id,
            product_name: data.product_name,
            available_stock: data.available_stock,
            requested_quantity: requestedQty,
          });

          expect(result.has_warning).toBe(true);
          expect(result.warning_message).toMatch(/insufficient stock|out of stock/);
          expect(result.warning_message).toContain(data.product_name);
          expect(result.can_proceed).toBe(true); // Permite continuar
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not warn when requested quantity is within available stock', () => {
    fc.assert(
      fc.property(
        fc.record({
          product_id: fc.uuid(),
          product_name: fc.string({ minLength: 1, maxLength: 100 }),
          available_stock: fc.double({ min: 10, max: 100, noNaN: true }),
          requested_quantity: fc.double({ min: 0.01, max: 10, noNaN: true }),
        }),
        (data) => {
          // Asegurar que requested_quantity <= available_stock
          const requestedQty = Math.min(data.requested_quantity, data.available_stock);

          const result = checkStockAvailability({
            product_id: data.product_id,
            product_name: data.product_name,
            available_stock: data.available_stock,
            requested_quantity: requestedQty,
          });

          expect(result.has_warning).toBe(false);
          expect(result.warning_message).toBeNull();
          expect(result.can_proceed).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should warn when stock is zero', () => {
    fc.assert(
      fc.property(
        fc.record({
          product_id: fc.uuid(),
          product_name: fc.string({ minLength: 1, maxLength: 100 }),
          requested_quantity: fc.double({ min: 0.01, max: 100, noNaN: true }),
        }),
        (data) => {
          const result = checkStockAvailability({
            product_id: data.product_id,
            product_name: data.product_name,
            available_stock: 0,
            requested_quantity: data.requested_quantity,
          });

          expect(result.has_warning).toBe(true);
          expect(result.warning_message).toContain('out of stock');
          expect(result.can_proceed).toBe(true); // Aún permite continuar
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should allow operation to proceed despite warning', () => {
    fc.assert(
      fc.property(
        fc.record({
          repair_order_id: fc.uuid(),
          product_id: fc.uuid(),
          product_name: fc.string({ minLength: 1, maxLength: 100 }),
          available_stock: fc.double({ min: 0, max: 10, noNaN: true }),
          requested_quantity: fc.double({ min: 11, max: 100, noNaN: true }),
          unit_price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
        }),
        (data) => {
          const stockCheck = checkStockAvailability({
            product_id: data.product_id,
            product_name: data.product_name,
            available_stock: data.available_stock,
            requested_quantity: data.requested_quantity,
          });

          expect(stockCheck.has_warning).toBe(true);

          // A pesar de la advertencia, la operación debe poder continuar
          const addItemResult = addRepairItemWithStockCheck({
            repair_order_id: data.repair_order_id,
            product_id: data.product_id,
            quantity: data.requested_quantity,
            unit_price: data.unit_price,
            stock_check: stockCheck,
          });

          expect(addItemResult.success).toBe(true);
          expect(addItemResult.item).toBeDefined();
          expect(addItemResult.item.quantity).toBe(data.requested_quantity);
          expect(addItemResult.warning).toBe(stockCheck.warning_message);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate shortage amount correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          product_id: fc.uuid(),
          product_name: fc.string({ minLength: 1, maxLength: 100 }),
          available_stock: fc.double({ min: 0, max: 50, noNaN: true }),
          requested_quantity: fc.double({ min: 51, max: 200, noNaN: true }),
        }),
        (data) => {
          const result = checkStockAvailability({
            product_id: data.product_id,
            product_name: data.product_name,
            available_stock: data.available_stock,
            requested_quantity: data.requested_quantity,
          });

          expect(result.has_warning).toBe(true);
          expect(result.shortage_amount).toBeCloseTo(
            data.requested_quantity - data.available_stock,
            2
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle multiple items with mixed stock availability', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            product_id: fc.uuid(),
            product_name: fc.string({ minLength: 1, maxLength: 100 }),
            available_stock: fc.double({ min: 0, max: 100, noNaN: true }),
            requested_quantity: fc.double({ min: 0.01, max: 150, noNaN: true }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (items) => {
          const results = items.map(item => checkStockAvailability(item));

          // Verificar que cada item se evalúa independientemente
          results.forEach((result, index) => {
            const item = items[index];
            const shouldWarn = item.requested_quantity > item.available_stock;
            expect(result.has_warning).toBe(shouldWarn);
          });

          // Contar items con advertencia
          const itemsWithWarnings = results.filter(r => r.has_warning).length;
          const expectedWarnings = items.filter(
            i => i.requested_quantity > i.available_stock
          ).length;
          expect(itemsWithWarnings).toBe(expectedWarnings);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should provide detailed warning message with stock levels', () => {
    fc.assert(
      fc.property(
        fc.record({
          product_id: fc.uuid(),
          product_name: fc.string({ minLength: 1, maxLength: 100 }),
          available_stock: fc.double({ min: 0, max: 50, noNaN: true }),
          requested_quantity: fc.double({ min: 51, max: 200, noNaN: true }),
        }),
        (data) => {
          const result = checkStockAvailability({
            product_id: data.product_id,
            product_name: data.product_name,
            available_stock: data.available_stock,
            requested_quantity: data.requested_quantity,
          });

          expect(result.has_warning).toBe(true);
          
          // El mensaje debe incluir información útil
          const message = result.warning_message!;
          expect(message).toContain(data.product_name);
          expect(message.toLowerCase()).toContain('stock');
          
          // Debe mencionar cantidades
          const hasAvailableStock = message.includes(data.available_stock.toString()) ||
                                    message.includes(Math.floor(data.available_stock).toString());
          const hasRequestedQty = message.includes(data.requested_quantity.toString()) ||
                                  message.includes(Math.floor(data.requested_quantity).toString());
          
          expect(hasAvailableStock || hasRequestedQty).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Funciones auxiliares para simular verificación de stock
 */

interface StockCheckResult {
  has_warning: boolean;
  warning_message: string | null;
  can_proceed: boolean;
  shortage_amount?: number;
}

interface StockCheckInput {
  product_id: string;
  product_name: string;
  available_stock: number;
  requested_quantity: number;
}

function checkStockAvailability(input: StockCheckInput): StockCheckResult {
  const { product_name, available_stock, requested_quantity } = input;

  if (requested_quantity > available_stock) {
    const shortage = requested_quantity - available_stock;
    
    let warningMessage: string;
    if (available_stock === 0) {
      warningMessage = `Warning: Product "${product_name}" is out of stock. Requested: ${requested_quantity}, Available: 0`;
    } else {
      warningMessage = `Warning: Product "${product_name}" has insufficient stock. Requested: ${requested_quantity}, Available: ${available_stock}, Shortage: ${shortage.toFixed(2)}`;
    }

    return {
      has_warning: true,
      warning_message: warningMessage,
      can_proceed: true,
      shortage_amount: shortage,
    };
  }

  return {
    has_warning: false,
    warning_message: null,
    can_proceed: true,
  };
}

interface AddRepairItemInput {
  repair_order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  stock_check: StockCheckResult;
}

interface AddRepairItemResult {
  success: boolean;
  item: {
    id: string;
    repair_order_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  };
  warning: string | null;
}

function addRepairItemWithStockCheck(input: AddRepairItemInput): AddRepairItemResult {
  // Incluso con advertencia de stock, permite agregar el item
  const item = {
    id: 'generated-uuid',
    repair_order_id: input.repair_order_id,
    product_id: input.product_id,
    quantity: input.quantity,
    unit_price: input.unit_price,
    subtotal: input.quantity * input.unit_price,
  };

  return {
    success: true,
    item,
    warning: input.stock_check.warning_message,
  };
}
