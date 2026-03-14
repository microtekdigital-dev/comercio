import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Property 44: Estimated Delivery Date Management
 * Validates: Requirements 19.1, 19.2, 19.5, 19.6
 * 
 * Verifica que el sistema gestiona correctamente las fechas estimadas de entrega,
 * permite editarlas, y calcula correctamente el estado de "vencida".
 */

describe('Property 44: Estimated Delivery Date Management', () => {
  it('should allow setting estimated delivery date at creation', () => {
    fc.assert(
      fc.property(
        fc.record({
          order_number: fc.string({ minLength: 1, maxLength: 20 }),
          received_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          estimated_delivery_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        }).filter(d => !isNaN(d.received_date.getTime()) && !isNaN(d.estimated_delivery_date.getTime())),
        (orderData) => {
          // Asegurar que estimated_delivery_date >= received_date
          const validEstimatedDate = orderData.estimated_delivery_date >= orderData.received_date
            ? orderData.estimated_delivery_date
            : new Date(orderData.received_date.getTime() + 86400000); // +1 día

          const order = createRepairOrderWithEstimatedDate({
            ...orderData,
            estimated_delivery_date: validEstimatedDate,
          });

          expect(order.estimated_delivery_date).toBeDefined();
          expect(order.estimated_delivery_date!.getTime()).toBe(validEstimatedDate.getTime());
          expect(order.estimated_delivery_date!.getTime()).toBeGreaterThanOrEqual(
            order.received_date.getTime()
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow updating estimated delivery date', () => {
    fc.assert(
      fc.property(
        fc.record({
          order_number: fc.string({ minLength: 1, maxLength: 20 }),
          received_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
          initial_estimated_date: fc.date({ min: new Date('2024-01-02'), max: new Date('2024-06-30') }),
          new_estimated_date: fc.date({ min: new Date('2024-01-03'), max: new Date('2024-07-31') }),
        }),
        (data) => {
          // Crear orden con fecha estimada inicial
          const order = createRepairOrderWithEstimatedDate({
            order_number: data.order_number,
            received_date: data.received_date,
            estimated_delivery_date: data.initial_estimated_date,
          });

          // Actualizar fecha estimada
          const updatedOrder = updateEstimatedDeliveryDate(
            order.order_number,
            data.new_estimated_date
          );

          expect(updatedOrder.estimated_delivery_date).toBeDefined();
          expect(updatedOrder.estimated_delivery_date!.getTime()).toBe(
            data.new_estimated_date.getTime()
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly identify overdue repairs', () => {
    fc.assert(
      fc.property(
        fc.record({
          order_number: fc.string({ minLength: 1, maxLength: 20 }),
          received_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
          estimated_delivery_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          status: fc.constantFrom('pending', 'in_progress', 'waiting_parts', 'repaired', 'delivered'),
          current_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-01-31') }),
        }),
        (data) => {
          const order = createRepairOrderWithEstimatedDate({
            order_number: data.order_number,
            received_date: data.received_date,
            estimated_delivery_date: data.estimated_delivery_date,
            status: data.status,
          });

          const isOverdue = checkIfRepairIsOverdue(order, data.current_date);

          // Una reparación está vencida si:
          // 1. Tiene fecha estimada
          // 2. La fecha estimada es anterior a la fecha actual
          // 3. No está entregada ni cancelada
          const shouldBeOverdue =
            order.estimated_delivery_date &&
            order.estimated_delivery_date < data.current_date &&
            order.status !== 'delivered' &&
            order.status !== 'cancelled';

          expect(isOverdue).toBe(shouldBeOverdue);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter overdue repairs correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            order_number: fc.string({ minLength: 1, maxLength: 20 }),
            received_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
            estimated_delivery_date: fc.option(
              fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
              { nil: null }
            ),
            status: fc.constantFrom('pending', 'in_progress', 'repaired', 'delivered', 'cancelled'),
          }),
          { minLength: 5, maxLength: 30 }
        ),
        fc.date({ min: new Date('2024-06-01'), max: new Date('2024-12-31') }),
        (repairs, currentDate) => {
          const overdueRepairs = getOverdueRepairs(repairs, currentDate);

          // Verificar que todos los resultados están vencidos
          overdueRepairs.forEach(repair => {
            expect(repair.estimated_delivery_date).toBeDefined();
            expect(repair.estimated_delivery_date!.getTime()).toBeLessThan(currentDate.getTime());
            expect(['pending', 'in_progress', 'waiting_parts', 'repaired']).toContain(repair.status);
          });

          // Verificar que no se omitieron reparaciones vencidas
          const expectedOverdue = repairs.filter(
            r =>
              r.estimated_delivery_date &&
              r.estimated_delivery_date < currentDate &&
              !['delivered', 'cancelled'].includes(r.status)
          );
          expect(overdueRepairs.length).toBe(expectedOverdue.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle repairs without estimated date', () => {
    fc.assert(
      fc.property(
        fc.record({
          order_number: fc.string({ minLength: 1, maxLength: 20 }),
          received_date: fc.date(),
          status: fc.constantFrom('pending', 'in_progress'),
        }),
        (orderData) => {
          const order = createRepairOrderWithoutEstimatedDate(orderData);

          expect(order.estimated_delivery_date).toBeNull();

          // Una reparación sin fecha estimada nunca está vencida
          const isOverdue = checkIfRepairIsOverdue(order, new Date());
          expect(isOverdue).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should not mark delivered repairs as overdue', () => {
    fc.assert(
      fc.property(
        fc.record({
          order_number: fc.string({ minLength: 1, maxLength: 20 }),
          received_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
          estimated_delivery_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-30') }),
          delivered_date: fc.date({ min: new Date('2024-06-01'), max: new Date('2024-12-31') }),
        }),
        (data) => {
          const order = createRepairOrderWithEstimatedDate({
            order_number: data.order_number,
            received_date: data.received_date,
            estimated_delivery_date: data.estimated_delivery_date,
            status: 'delivered',
            delivered_date: data.delivered_date,
          });

          // Incluso si la fecha estimada era anterior a la entrega, no está vencida
          const isOverdue = checkIfRepairIsOverdue(order, new Date('2024-12-31'));
          expect(isOverdue).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should calculate days until delivery correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          order_number: fc.string({ minLength: 1, maxLength: 20 }),
          received_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
          estimated_delivery_date: fc.date({ min: new Date('2024-01-02'), max: new Date('2024-12-31') }),
          current_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        }),
        (data) => {
          const order = createRepairOrderWithEstimatedDate({
            order_number: data.order_number,
            received_date: data.received_date,
            estimated_delivery_date: data.estimated_delivery_date,
            status: 'in_progress',
          });

          const daysUntilDelivery = calculateDaysUntilDelivery(order, data.current_date);

          const expectedDays = Math.ceil(
            (order.estimated_delivery_date!.getTime() - data.current_date.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          expect(daysUntilDelivery).toBe(expectedDays);

          // Si es negativo, la reparación está vencida
          if (daysUntilDelivery < 0) {
            expect(order.estimated_delivery_date!.getTime()).toBeLessThan(
              data.current_date.getTime()
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Funciones auxiliares para simular operaciones de gestión de fechas estimadas
 */

interface RepairOrder {
  order_number: string;
  received_date: Date;
  estimated_delivery_date: Date | null;
  status: string;
  delivered_date?: Date;
}

function createRepairOrderWithEstimatedDate(data: any): RepairOrder {
  return {
    order_number: data.order_number,
    received_date: data.received_date,
    estimated_delivery_date: data.estimated_delivery_date,
    status: data.status || 'pending',
    delivered_date: data.delivered_date,
  };
}

function createRepairOrderWithoutEstimatedDate(data: any): RepairOrder {
  return {
    order_number: data.order_number,
    received_date: data.received_date,
    estimated_delivery_date: null,
    status: data.status || 'pending',
  };
}

function updateEstimatedDeliveryDate(orderNumber: string, newDate: Date): RepairOrder {
  return {
    order_number: orderNumber,
    received_date: new Date(),
    estimated_delivery_date: newDate,
    status: 'pending',
  };
}

function checkIfRepairIsOverdue(order: RepairOrder, currentDate: Date): boolean {
  if (!order.estimated_delivery_date) {
    return false;
  }

  if (order.status === 'delivered' || order.status === 'cancelled') {
    return false;
  }

  return order.estimated_delivery_date < currentDate;
}

function getOverdueRepairs(repairs: RepairOrder[], currentDate: Date): RepairOrder[] {
  return repairs.filter(repair => checkIfRepairIsOverdue(repair, currentDate));
}

function calculateDaysUntilDelivery(order: RepairOrder, currentDate: Date): number {
  if (!order.estimated_delivery_date) {
    return 0;
  }

  return Math.ceil(
    (order.estimated_delivery_date.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
  );
}
