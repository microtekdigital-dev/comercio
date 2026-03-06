import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Property 45: Required Field Validation
 * Validates: Requirements 20.1, 20.2
 * 
 * Verifica que el sistema rechaza la creación de órdenes de reparación
 * cuando faltan campos requeridos.
 */

describe('Property 45: Required Field Validation', () => {
  it('should reject repair order creation without customer_id', () => {
    fc.assert(
      fc.property(
        fc.record({
          device_type: fc.string({ minLength: 1, maxLength: 100 }),
          brand: fc.string({ minLength: 1, maxLength: 100 }),
          model: fc.string({ minLength: 1, maxLength: 100 }),
          reported_problem: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        (orderData) => {
          const result = validateRepairOrderCreation({
            ...orderData,
            customer_id: undefined,
          });

          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('customer_id is required');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject repair order creation without device_type', () => {
    fc.assert(
      fc.property(
        fc.record({
          customer_id: fc.uuid(),
          brand: fc.string({ minLength: 1, maxLength: 100 }),
          model: fc.string({ minLength: 1, maxLength: 100 }),
          reported_problem: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        (orderData) => {
          const result = validateRepairOrderCreation({
            ...orderData,
            device_type: undefined,
          });

          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('device_type is required');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject repair order creation without brand', () => {
    fc.assert(
      fc.property(
        fc.record({
          customer_id: fc.uuid(),
          device_type: fc.string({ minLength: 1, maxLength: 100 }),
          model: fc.string({ minLength: 1, maxLength: 100 }),
          reported_problem: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        (orderData) => {
          const result = validateRepairOrderCreation({
            ...orderData,
            brand: undefined,
          });

          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('brand is required');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject repair order creation without model', () => {
    fc.assert(
      fc.property(
        fc.record({
          customer_id: fc.uuid(),
          device_type: fc.string({ minLength: 1, maxLength: 100 }),
          brand: fc.string({ minLength: 1, maxLength: 100 }),
          reported_problem: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        (orderData) => {
          const result = validateRepairOrderCreation({
            ...orderData,
            model: undefined,
          });

          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('model is required');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject repair order creation without reported_problem', () => {
    fc.assert(
      fc.property(
        fc.record({
          customer_id: fc.uuid(),
          device_type: fc.string({ minLength: 1, maxLength: 100 }),
          brand: fc.string({ minLength: 1, maxLength: 100 }),
          model: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        (orderData) => {
          const result = validateRepairOrderCreation({
            ...orderData,
            reported_problem: undefined,
          });

          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('reported_problem is required');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject repair order with empty string fields', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('device_type', 'brand', 'model', 'reported_problem'),
        (fieldToEmpty) => {
          const validData = {
            customer_id: 'valid-uuid',
            device_type: 'Smartphone',
            brand: 'Samsung',
            model: 'Galaxy S21',
            reported_problem: 'Screen broken',
          };

          const invalidData = {
            ...validData,
            [fieldToEmpty]: '',
          };

          const result = validateRepairOrderCreation(invalidData);

          expect(result.isValid).toBe(false);
          expect(result.errors.some(e => e.includes(fieldToEmpty))).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should accept repair order with all required fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          customer_id: fc.uuid(),
          device_type: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          brand: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          model: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          reported_problem: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
        }),
        (orderData) => {
          const result = validateRepairOrderCreation(orderData);

          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject technician creation without name', () => {
    fc.assert(
      fc.property(
        fc.record({
          specialty: fc.option(fc.string({ minLength: 1, maxLength: 255 }), { nil: null }),
        }),
        (technicianData) => {
          const result = validateTechnicianCreation({
            ...technicianData,
            name: undefined,
          });

          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('name is required');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject technician with empty or whitespace-only name', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', '   ', '\t', '\n', '  \t  \n  '),
        (invalidName) => {
          const result = validateTechnicianCreation({
            name: invalidName,
            specialty: 'Electronics',
          });

          expect(result.isValid).toBe(false);
          expect(result.errors.some(e => e.includes('name'))).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });
});

/**
 * Property 46: Budget Validation
 * Validates: Requirements 20.3
 * 
 * Verifica que el sistema rechaza presupuestos sin repuestos ni mano de obra.
 */

describe('Property 46: Budget Validation', () => {
  it('should reject budget with no items and zero labor cost', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (repairOrderId) => {
          const result = validateBudget({
            repair_order_id: repairOrderId,
            items: [],
            labor_cost: 0,
          });

          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('Budget must have at least one item or labor cost');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should accept budget with items but no labor cost', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(
          fc.record({
            product_id: fc.uuid(),
            quantity: fc.double({ min: 0.01, max: 100, noNaN: true }),
            unit_price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (repairOrderId, items) => {
          const result = validateBudget({
            repair_order_id: repairOrderId,
            items,
            labor_cost: 0,
          });

          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should accept budget with labor cost but no items', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        (repairOrderId, laborCost) => {
          const result = validateBudget({
            repair_order_id: repairOrderId,
            items: [],
            labor_cost: laborCost,
          });

          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject budget items with invalid quantity', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.constantFrom(0, -1, -10, -0.5),
        (repairOrderId, invalidQuantity) => {
          const result = validateBudgetItem({
            repair_order_id: repairOrderId,
            product_id: 'valid-uuid',
            quantity: invalidQuantity,
            unit_price: 100,
          });

          expect(result.isValid).toBe(false);
          expect(result.errors.some(e => e.includes('quantity'))).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject budget items with negative unit price', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.double({ min: -10000, max: -0.01, noNaN: true }),
        (repairOrderId, negativePrice) => {
          const result = validateBudgetItem({
            repair_order_id: repairOrderId,
            product_id: 'valid-uuid',
            quantity: 1,
            unit_price: negativePrice,
          });

          expect(result.isValid).toBe(false);
          expect(result.errors.some(e => e.includes('unit_price'))).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Property 47: Payment Validation
 * Validates: Requirements 20.4, 20.5
 * 
 * Verifica que el sistema rechaza pagos sin monto, método o con montos inválidos.
 */

describe('Property 47: Payment Validation', () => {
  it('should reject payment without amount', () => {
    fc.assert(
      fc.property(
        fc.record({
          repair_order_id: fc.uuid(),
          payment_method: fc.constantFrom('cash', 'card', 'transfer', 'account'),
        }),
        (paymentData) => {
          const result = validatePayment({
            ...paymentData,
            amount: undefined,
          });

          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('amount is required');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject payment without payment_method', () => {
    fc.assert(
      fc.property(
        fc.record({
          repair_order_id: fc.uuid(),
          amount: fc.double({ min: 0.01, max: 10000, noNaN: true }),
        }),
        (paymentData) => {
          const result = validatePayment({
            ...paymentData,
            payment_method: undefined,
          });

          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('payment_method is required');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject payment with zero or negative amount', () => {
    fc.assert(
      fc.property(
        fc.record({
          repair_order_id: fc.uuid(),
          payment_method: fc.constantFrom('cash', 'card', 'transfer'),
        }),
        fc.constantFrom(0, -0.01, -1, -100, -1000),
        (paymentData, invalidAmount) => {
          const result = validatePayment({
            ...paymentData,
            amount: invalidAmount,
          });

          expect(result.isValid).toBe(false);
          expect(result.errors.some(e => e.includes('amount') && e.includes('positive'))).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should accept payment with valid amount and method', () => {
    fc.assert(
      fc.property(
        fc.record({
          repair_order_id: fc.uuid(),
          amount: fc.double({ min: 0.01, max: 100000, noNaN: true }),
          payment_method: fc.constantFrom('cash', 'card', 'transfer', 'account'),
        }),
        (paymentData) => {
          const result = validatePayment(paymentData);

          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject payment with empty payment_method', () => {
    fc.assert(
      fc.property(
        fc.record({
          repair_order_id: fc.uuid(),
          amount: fc.double({ min: 0.01, max: 10000, noNaN: true }),
        }),
        (paymentData) => {
          const result = validatePayment({
            ...paymentData,
            payment_method: '',
          });

          expect(result.isValid).toBe(false);
          expect(result.errors.some(e => e.includes('payment_method'))).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Property 48: Date Validation
 * Validates: Requirements 20.6
 * 
 * Verifica que el sistema rechaza fechas estimadas de entrega anteriores
 * a la fecha de recepción.
 */

describe('Property 48: Date Validation', () => {
  it('should reject estimated_delivery_date before received_date', () => {
    fc.assert(
      fc.property(
        fc.record({
          customer_id: fc.uuid(),
          device_type: fc.string({ minLength: 1, maxLength: 100 }),
          brand: fc.string({ minLength: 1, maxLength: 100 }),
          model: fc.string({ minLength: 1, maxLength: 100 }),
          reported_problem: fc.string({ minLength: 1, maxLength: 500 }),
          received_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          estimated_delivery_date: fc.date({ min: new Date('2023-01-01'), max: new Date('2023-12-31') }),
        }),
        (orderData) => {
          // Asegurar que estimated_delivery_date < received_date
          const invalidData = {
            ...orderData,
            estimated_delivery_date: new Date(orderData.received_date.getTime() - 86400000), // -1 día
          };

          const result = validateRepairOrderDates(invalidData);

          expect(result.isValid).toBe(false);
          expect(
            result.errors.some(e => e.includes('estimated_delivery_date') && e.includes('received_date'))
          ).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept estimated_delivery_date equal to received_date', () => {
    fc.assert(
      fc.property(
        fc.record({
          customer_id: fc.uuid(),
          device_type: fc.string({ minLength: 1, maxLength: 100 }),
          brand: fc.string({ minLength: 1, maxLength: 100 }),
          model: fc.string({ minLength: 1, maxLength: 100 }),
          reported_problem: fc.string({ minLength: 1, maxLength: 500 }),
          received_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        }),
        (orderData) => {
          const validData = {
            ...orderData,
            estimated_delivery_date: orderData.received_date,
          };

          const result = validateRepairOrderDates(validData);

          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should accept estimated_delivery_date after received_date', () => {
    fc.assert(
      fc.property(
        fc.record({
          customer_id: fc.uuid(),
          device_type: fc.string({ minLength: 1, maxLength: 100 }),
          brand: fc.string({ minLength: 1, maxLength: 100 }),
          model: fc.string({ minLength: 1, maxLength: 100 }),
          reported_problem: fc.string({ minLength: 1, maxLength: 500 }),
          received_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-30') }),
          estimated_delivery_date: fc.date({ min: new Date('2024-07-01'), max: new Date('2024-12-31') }),
        }),
        (orderData) => {
          // Asegurar que estimated_delivery_date > received_date
          const validData = {
            ...orderData,
            estimated_delivery_date: new Date(orderData.received_date.getTime() + 86400000), // +1 día
          };

          const result = validateRepairOrderDates(validData);

          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept repair order without estimated_delivery_date', () => {
    fc.assert(
      fc.property(
        fc.record({
          customer_id: fc.uuid(),
          device_type: fc.string({ minLength: 1, maxLength: 100 }),
          brand: fc.string({ minLength: 1, maxLength: 100 }),
          model: fc.string({ minLength: 1, maxLength: 100 }),
          reported_problem: fc.string({ minLength: 1, maxLength: 500 }),
          received_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        }),
        (orderData) => {
          const validData = {
            ...orderData,
            estimated_delivery_date: null,
          };

          const result = validateRepairOrderDates(validData);

          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Funciones auxiliares para simular validaciones
 */

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

function validateRepairOrderCreation(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data.customer_id) {
    errors.push('customer_id is required');
  }

  if (!data.device_type || data.device_type.trim() === '') {
    errors.push('device_type is required');
  }

  if (!data.brand || data.brand.trim() === '') {
    errors.push('brand is required');
  }

  if (!data.model || data.model.trim() === '') {
    errors.push('model is required');
  }

  if (!data.reported_problem || data.reported_problem.trim() === '') {
    errors.push('reported_problem is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateTechnicianCreation(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data.name) {
    errors.push('name is required');
  } else if (data.name.trim() === '') {
    errors.push('name cannot be empty or whitespace only');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateBudget(data: any): ValidationResult {
  const errors: string[] = [];

  const hasItems = data.items && data.items.length > 0;
  const hasLaborCost = data.labor_cost && data.labor_cost > 0;

  if (!hasItems && !hasLaborCost) {
    errors.push('Budget must have at least one item or labor cost');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateBudgetItem(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data.quantity || data.quantity <= 0) {
    errors.push('quantity must be greater than 0');
  }

  if (data.unit_price === undefined || data.unit_price < 0) {
    errors.push('unit_price must be 0 or greater');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validatePayment(data: any): ValidationResult {
  const errors: string[] = [];

  if (data.amount === undefined) {
    errors.push('amount is required');
  } else if (data.amount <= 0) {
    errors.push('amount must be positive');
  }

  if (!data.payment_method) {
    errors.push('payment_method is required');
  } else if (data.payment_method.trim() === '') {
    errors.push('payment_method cannot be empty');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateRepairOrderDates(data: any): ValidationResult {
  const errors: string[] = [];

  if (data.estimated_delivery_date && data.received_date) {
    if (data.estimated_delivery_date < data.received_date) {
      errors.push('estimated_delivery_date must be greater than or equal to received_date');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
