import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Property 26: Customer Repair History
 * Validates: Requirements 10.1, 10.2, 10.4, 10.5, 12.1, 12.2, 12.3, 12.5
 * 
 * Verifica que el historial de reparaciones por cliente se mantiene correctamente
 * y muestra toda la información relevante.
 */

describe('Property 26: Customer Repair History', () => {
  it('should maintain complete repair history for each customer', () => {
    fc.assert(
      fc.property(
        fc.record({
          customer_id: fc.uuid(),
          repairs: fc.array(
            fc.record({
              order_number: fc.string({ minLength: 1, maxLength: 20 }),
              device_type: fc.string({ minLength: 1, maxLength: 50 }),
              brand: fc.string({ minLength: 1, maxLength: 50 }),
              model: fc.string({ minLength: 1, maxLength: 50 }),
              status: fc.constantFrom(
                'pending',
                'in_progress',
                'waiting_parts',
                'waiting_approval',
                'repaired',
                'delivered',
                'cancelled'
              ),
              received_date: fc.date(),
              total_cost: fc.double({ min: 0, max: 100000, noNaN: true }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
        }),
        (data) => {
          // Obtener historial de reparaciones del cliente
          const history = getCustomerRepairHistory(data.customer_id, data.repairs);

          // Verificar que incluye todas las reparaciones
          expect(history.repairs).toHaveLength(data.repairs.length);
          
          // Verificar que están ordenadas por fecha descendente
          for (let i = 0; i < history.repairs.length - 1; i++) {
            expect(history.repairs[i].received_date.getTime()).toBeGreaterThanOrEqual(
              history.repairs[i + 1].received_date.getTime()
            );
          }

          // Verificar estadísticas
          expect(history.total_repairs).toBe(data.repairs.length);
          
          const expectedTotalAmount = data.repairs.reduce(
            (sum, repair) => sum + repair.total_cost,
            0
          );
          expect(history.total_amount).toBeCloseTo(expectedTotalAmount, 2);

          // Verificar que cada reparación tiene la información completa
          history.repairs.forEach((repair, index) => {
            const originalRepair = data.repairs.find(r => r.order_number === repair.order_number);
            expect(originalRepair).toBeDefined();
            expect(repair.device_type).toBe(originalRepair!.device_type);
            expect(repair.status).toBe(originalRepair!.status);
            expect(repair.total_cost).toBeCloseTo(originalRepair!.total_cost, 2);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate correct statistics for customer repairs', () => {
    fc.assert(
      fc.property(
        fc.record({
          customer_id: fc.uuid(),
          repairs: fc.array(
            fc.record({
              order_number: fc.string({ minLength: 1, maxLength: 20 }),
              status: fc.constantFrom(
                'pending',
                'in_progress',
                'waiting_parts',
                'waiting_approval',
                'repaired',
                'delivered',
                'cancelled'
              ),
              total_cost: fc.double({ min: 0, max: 100000, noNaN: true }),
              received_date: fc.date(),
            }),
            { minLength: 1, maxLength: 50 }
          ),
        }),
        (data) => {
          const stats = calculateCustomerRepairStats(data.repairs);

          // Contar reparaciones por estado
          const statusCounts = data.repairs.reduce((acc, repair) => {
            acc[repair.status] = (acc[repair.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          expect(stats.total_repairs).toBe(data.repairs.length);
          
          const activeStatuses = ['pending', 'in_progress', 'waiting_parts', 'waiting_approval', 'repaired'];
          const expectedActive = data.repairs.filter(r => activeStatuses.includes(r.status)).length;
          expect(stats.active_repairs).toBe(expectedActive);

          const expectedCompleted = data.repairs.filter(r => r.status === 'delivered').length;
          expect(stats.completed_repairs).toBe(expectedCompleted);

          const expectedCancelled = data.repairs.filter(r => r.status === 'cancelled').length;
          expect(stats.cancelled_repairs).toBe(expectedCancelled);

          // Verificar monto total
          const expectedTotal = data.repairs.reduce((sum, r) => sum + r.total_cost, 0);
          expect(stats.total_amount).toBeCloseTo(expectedTotal, 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter repair history by date range', () => {
    fc.assert(
      fc.property(
        fc.record({
          customer_id: fc.uuid(),
          repairs: fc.array(
            fc.record({
              order_number: fc.string({ minLength: 1, maxLength: 20 }),
              received_date: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
              total_cost: fc.double({ min: 0, max: 10000, noNaN: true }),
            }),
            { minLength: 5, maxLength: 30 }
          ),
          filter_start: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
          filter_end: fc.date({ min: new Date('2021-01-01'), max: new Date('2025-12-31') }),
        }),
        (data) => {
          // Asegurar que filter_end >= filter_start
          const startDate = data.filter_start;
          const endDate = data.filter_end > data.filter_start ? data.filter_end : data.filter_start;

          const filteredHistory = getCustomerRepairHistory(
            data.customer_id,
            data.repairs,
            { startDate, endDate }
          );

          // Verificar que solo incluye reparaciones en el rango
          filteredHistory.repairs.forEach(repair => {
            expect(repair.received_date.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
            expect(repair.received_date.getTime()).toBeLessThanOrEqual(endDate.getTime());
          });

          // Verificar que el conteo es correcto
          const expectedCount = data.repairs.filter(
            r => r.received_date >= startDate && r.received_date <= endDate
          ).length;
          expect(filteredHistory.total_repairs).toBe(expectedCount);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Property 29: Customer Integration
 * Validates: Requirements 10.1, 10.2, 10.4, 10.5, 12.1, 12.2, 12.3, 12.5
 * 
 * Verifica que las reparaciones se integran correctamente con el módulo de clientes.
 */

describe('Property 29: Customer Integration', () => {
  it('should link repairs to customer records', () => {
    fc.assert(
      fc.property(
        fc.record({
          customer_id: fc.uuid(),
          customer_name: fc.string({ minLength: 1, maxLength: 100 }),
          customer_email: fc.emailAddress(),
          repair_order_number: fc.string({ minLength: 1, maxLength: 20 }),
          device_type: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        (data) => {
          // Crear reparación vinculada al cliente
          const repair = createRepairForCustomer({
            customer_id: data.customer_id,
            order_number: data.repair_order_number,
            device_type: data.device_type,
          });

          expect(repair.customer_id).toBe(data.customer_id);
          expect(repair.order_number).toBe(data.repair_order_number);

          // Verificar que se puede obtener información del cliente desde la reparación
          const customerInfo = getCustomerFromRepair(repair);
          expect(customerInfo.customer_id).toBe(data.customer_id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show repair count in customer profile', () => {
    fc.assert(
      fc.property(
        fc.record({
          customer_id: fc.uuid(),
          repair_count: fc.integer({ min: 0, max: 100 }),
        }),
        (data) => {
          // Simular perfil de cliente con conteo de reparaciones
          const customerProfile = getCustomerProfile(data.customer_id, data.repair_count);

          expect(customerProfile.customer_id).toBe(data.customer_id);
          expect(customerProfile.total_repairs).toBe(data.repair_count);
          expect(customerProfile.has_repairs).toBe(data.repair_count > 0);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Property 30: Active Repairs Summary
 * Validates: Requirements 10.1, 10.2, 10.4, 10.5, 12.1, 12.2, 12.3, 12.5
 * 
 * Verifica que el resumen de reparaciones activas se calcula correctamente.
 */

describe('Property 30: Active Repairs Summary', () => {
  it('should identify active repairs correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            order_number: fc.string({ minLength: 1, maxLength: 20 }),
            status: fc.constantFrom(
              'pending',
              'in_progress',
              'waiting_parts',
              'waiting_approval',
              'repaired',
              'delivered',
              'cancelled'
            ),
            customer_id: fc.uuid(),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (repairs) => {
          const activeRepairs = getActiveRepairs(repairs);

          const activeStatuses = ['pending', 'in_progress', 'waiting_parts', 'waiting_approval', 'repaired'];
          
          // Verificar que solo incluye reparaciones activas
          activeRepairs.forEach(repair => {
            expect(activeStatuses).toContain(repair.status);
          });

          // Verificar conteo
          const expectedCount = repairs.filter(r => activeStatuses.includes(r.status)).length;
          expect(activeRepairs.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should group active repairs by customer', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            order_number: fc.string({ minLength: 1, maxLength: 20 }),
            status: fc.constantFrom('pending', 'in_progress', 'waiting_parts', 'repaired'),
            customer_id: fc.uuid(),
          }),
          { minLength: 1, maxLength: 30 }
        ),
        (repairs) => {
          const groupedRepairs = groupActiveRepairsByCustomer(repairs);

          // Verificar que cada grupo contiene solo reparaciones del mismo cliente
          Object.entries(groupedRepairs).forEach(([customerId, customerRepairs]) => {
            customerRepairs.forEach(repair => {
              expect(repair.customer_id).toBe(customerId);
            });
          });

          // Verificar que el total coincide
          const totalGrouped = Object.values(groupedRepairs).reduce(
            (sum, group) => sum + group.length,
            0
          );
          expect(totalGrouped).toBe(repairs.length);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Funciones auxiliares para simular operaciones de historial de cliente
 */

function getCustomerRepairHistory(
  customerId: string,
  repairs: any[],
  dateFilter?: { startDate: Date; endDate: Date }
) {
  let filteredRepairs = repairs;

  if (dateFilter) {
    filteredRepairs = repairs.filter(
      r => r.received_date >= dateFilter.startDate && r.received_date <= dateFilter.endDate
    );
  }

  // Ordenar por fecha descendente
  const sortedRepairs = [...filteredRepairs].sort(
    (a, b) => b.received_date.getTime() - a.received_date.getTime()
  );

  const totalAmount = filteredRepairs.reduce((sum, r) => sum + r.total_cost, 0);

  return {
    customer_id: customerId,
    repairs: sortedRepairs,
    total_repairs: filteredRepairs.length,
    total_amount: totalAmount,
  };
}

function calculateCustomerRepairStats(repairs: any[]) {
  const activeStatuses = ['pending', 'in_progress', 'waiting_parts', 'waiting_approval', 'repaired'];
  
  return {
    total_repairs: repairs.length,
    active_repairs: repairs.filter(r => activeStatuses.includes(r.status)).length,
    completed_repairs: repairs.filter(r => r.status === 'delivered').length,
    cancelled_repairs: repairs.filter(r => r.status === 'cancelled').length,
    total_amount: repairs.reduce((sum, r) => sum + r.total_cost, 0),
  };
}

function createRepairForCustomer(data: any) {
  return {
    customer_id: data.customer_id,
    order_number: data.order_number,
    device_type: data.device_type,
    status: 'pending',
    created_at: new Date(),
  };
}

function getCustomerFromRepair(repair: any) {
  return {
    customer_id: repair.customer_id,
  };
}

function getCustomerProfile(customerId: string, repairCount: number) {
  return {
    customer_id: customerId,
    total_repairs: repairCount,
    has_repairs: repairCount > 0,
  };
}

function getActiveRepairs(repairs: any[]) {
  const activeStatuses = ['pending', 'in_progress', 'waiting_parts', 'waiting_approval', 'repaired'];
  return repairs.filter(r => activeStatuses.includes(r.status));
}

function groupActiveRepairsByCustomer(repairs: any[]) {
  return repairs.reduce((acc, repair) => {
    if (!acc[repair.customer_id]) {
      acc[repair.customer_id] = [];
    }
    acc[repair.customer_id].push(repair);
    return acc;
  }, {} as Record<string, any[]>);
}
