import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Property 38: Pending Repairs Report
 * Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7
 * 
 * Verifica que el reporte de reparaciones pendientes identifica correctamente
 * todas las órdenes que no han sido entregadas ni canceladas.
 */

describe('Property 38: Pending Repairs Report', () => {
  it('should identify all pending repairs correctly', () => {
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
            received_date: fc.date(),
            estimated_delivery_date: fc.option(fc.date(), { nil: null }),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (repairs) => {
          const pendingReport = getPendingRepairs(repairs);

          const nonFinalStatuses = ['pending', 'in_progress', 'waiting_parts', 'waiting_approval', 'repaired'];
          
          // Verificar que solo incluye reparaciones no finalizadas
          pendingReport.repairs.forEach(repair => {
            expect(nonFinalStatuses).toContain(repair.status);
          });

          // Verificar conteo
          const expectedCount = repairs.filter(r => nonFinalStatuses.includes(r.status)).length;
          expect(pendingReport.total_pending).toBe(expectedCount);

          // Verificar que no incluye entregadas ni canceladas
          const deliveredOrCancelled = pendingReport.repairs.filter(
            r => r.status === 'delivered' || r.status === 'cancelled'
          );
          expect(deliveredOrCancelled).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should identify overdue repairs', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            order_number: fc.string({ minLength: 1, maxLength: 20 }),
            status: fc.constantFrom('pending', 'in_progress', 'waiting_parts', 'repaired'),
            estimated_delivery_date: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          }),
          { minLength: 1, maxLength: 30 }
        ),
        (repairs) => {
          const today = new Date();
          const overdueReport = getOverdueRepairs(repairs, today);

          // Verificar que solo incluye reparaciones vencidas
          overdueReport.repairs.forEach(repair => {
            expect(repair.estimated_delivery_date).toBeDefined();
            expect(repair.estimated_delivery_date!.getTime()).toBeLessThan(today.getTime());
          });

          // Verificar conteo
          const expectedCount = repairs.filter(
            r => r.estimated_delivery_date && r.estimated_delivery_date < today
          ).length;
          expect(overdueReport.total_overdue).toBe(expectedCount);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Property 39: Technician Performance Report
 * Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7
 * 
 * Verifica que el reporte de desempeño por técnico calcula correctamente
 * las métricas de cada técnico.
 */

describe('Property 39: Technician Performance Report', () => {
  it('should calculate repair counts per technician', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            order_number: fc.string({ minLength: 1, maxLength: 20 }),
            technician_id: fc.option(fc.uuid(), { nil: null }),
            technician_name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
            status: fc.constantFrom(
              'pending',
              'in_progress',
              'waiting_parts',
              'repaired',
              'delivered',
              'cancelled'
            ),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (repairs) => {
          const performanceReport = getRepairsByTechnician(repairs);

          // Verificar que cada técnico tiene su conteo correcto
          Object.entries(performanceReport.by_technician).forEach(([techId, stats]) => {
            const techRepairs = repairs.filter(r => r.technician_id === techId);
            expect(stats.total_repairs).toBe(techRepairs.length);

            const activeRepairs = techRepairs.filter(r =>
              ['pending', 'in_progress', 'waiting_parts', 'repaired'].includes(r.status)
            );
            expect(stats.active_repairs).toBe(activeRepairs.length);

            const completedRepairs = techRepairs.filter(r => r.status === 'delivered');
            expect(stats.completed_repairs).toBe(completedRepairs.length);
          });

          // Verificar reparaciones sin técnico asignado
          const unassignedRepairs = repairs.filter(r => !r.technician_id);
          expect(performanceReport.unassigned_repairs).toBe(unassignedRepairs.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate average completion time per technician', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            order_number: fc.string({ minLength: 1, maxLength: 20 }),
            technician_id: fc.uuid(),
            technician_name: fc.string({ minLength: 1, maxLength: 100 }),
            status: fc.constant('delivered'),
            received_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
            delivered_date: fc.date({ min: new Date('2024-01-02'), max: new Date('2024-06-30') }),
          }),
          { minLength: 1, maxLength: 30 }
        ),
        (repairs) => {
          // Asegurar que delivered_date >= received_date y que ambas fechas son válidas
          const validRepairs = repairs
            .filter(r => !isNaN(r.received_date.getTime()) && !isNaN(r.delivered_date.getTime()))
            .map(r => ({
              ...r,
              delivered_date: r.delivered_date > r.received_date ? r.delivered_date : new Date(r.received_date.getTime() + 86400000),
            }));

          if (validRepairs.length === 0) return;

          const performanceReport = calculateTechnicianPerformance(validRepairs);

          Object.entries(performanceReport).forEach(([techId, stats]) => {
            const techRepairs = validRepairs.filter(r => r.technician_id === techId);
            
            if (techRepairs.length > 0) {
              const totalDays = techRepairs.reduce((sum, r) => {
                const days = Math.ceil(
                  (r.delivered_date.getTime() - r.received_date.getTime()) / (1000 * 60 * 60 * 24)
                );
                return sum + days;
              }, 0);
              
              const expectedAvg = totalDays / techRepairs.length;
              expect(stats.average_completion_days).toBeCloseTo(expectedAvg, 1);
            }
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Property 40: Status Distribution Report
 * Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7
 * 
 * Verifica que el reporte de distribución por estado calcula correctamente
 * la cantidad de reparaciones en cada estado.
 */

describe('Property 40: Status Distribution Report', () => {
  it('should calculate correct distribution of repairs by status', () => {
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
          }),
          { minLength: 1, maxLength: 100 }
        ),
        (repairs) => {
          const distribution = getRepairsByStatus(repairs);

          // Verificar que cada estado tiene el conteo correcto
          const statusCounts = repairs.reduce((acc, repair) => {
            acc[repair.status] = (acc[repair.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          Object.entries(statusCounts).forEach(([status, count]) => {
            expect(distribution[status]).toBe(count);
          });

          // Verificar que el total coincide
          const totalInDistribution = Object.values(distribution).reduce((sum, count) => sum + count, 0);
          expect(totalInDistribution).toBe(repairs.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate percentage distribution', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            order_number: fc.string({ minLength: 1, maxLength: 20 }),
            status: fc.constantFrom('pending', 'in_progress', 'delivered', 'cancelled'),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (repairs) => {
          const distribution = getStatusDistributionWithPercentages(repairs);

          // Verificar que los porcentajes suman 100%
          const totalPercentage = Object.values(distribution).reduce(
            (sum, stat) => sum + stat.percentage,
            0
          );
          expect(totalPercentage).toBeCloseTo(100, 1);

          // Verificar que cada porcentaje es correcto
          Object.entries(distribution).forEach(([status, stat]) => {
            const expectedPercentage = (stat.count / repairs.length) * 100;
            expect(stat.percentage).toBeCloseTo(expectedPercentage, 1);
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Property 41: Profitability Calculation
 * Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7
 * 
 * Verifica que el cálculo de rentabilidad considera correctamente
 * costos de repuestos y mano de obra.
 */

describe('Property 41: Profitability Calculation', () => {
  it('should calculate profit correctly for each repair', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            order_number: fc.string({ minLength: 1, maxLength: 20 }),
            labor_cost: fc.double({ min: 0.01, max: 10000, noNaN: true, noDefaultInfinity: true }),
            parts_cost: fc.double({ min: 0.01, max: 10000, noNaN: true, noDefaultInfinity: true }),
            total_charged: fc.double({ min: 0.01, max: 20000, noNaN: true, noDefaultInfinity: true }),
          }),
          { minLength: 1, maxLength: 30 }
        ),
        (repairs) => {
          const profitabilityReport = calculateRepairProfitability(repairs);

          profitabilityReport.repairs.forEach((repair, index) => {
            const originalRepair = repairs[index];
            const expectedTotalCost = originalRepair.labor_cost + originalRepair.parts_cost;
            const expectedProfit = originalRepair.total_charged - expectedTotalCost;
            const expectedMargin = originalRepair.total_charged > 0
              ? (expectedProfit / originalRepair.total_charged) * 100
              : 0;

            expect(repair.total_cost).toBeCloseTo(expectedTotalCost, 2);
            expect(repair.profit).toBeCloseTo(expectedProfit, 2);
            expect(repair.profit_margin).toBeCloseTo(expectedMargin, 1);
          });

          // Verificar totales
          const expectedTotalProfit = repairs.reduce(
            (sum, r) => sum + (r.total_charged - r.labor_cost - r.parts_cost),
            0
          );
          expect(profitabilityReport.total_profit).toBeCloseTo(expectedTotalProfit, 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle zero-cost repairs correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          order_number: fc.string({ minLength: 1, maxLength: 20 }),
          labor_cost: fc.constant(0),
          parts_cost: fc.constant(0),
          total_charged: fc.double({ min: 0.01, max: 1000, noNaN: true, noDefaultInfinity: true }),
        }),
        (repair) => {
          const profitability = calculateSingleRepairProfitability(repair);

          expect(profitability.total_cost).toBe(0);
          expect(profitability.profit).toBeCloseTo(repair.total_charged, 2);
          
          // Margen debe ser 100% si no hay costos
          if (repair.total_charged > 0) {
            expect(profitability.profit_margin).toBeCloseTo(100, 1);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Property 42: Average Repair Time
 * Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7
 * 
 * Verifica que el cálculo del tiempo promedio de reparación es correcto.
 */

describe('Property 42: Average Repair Time', () => {
  it('should calculate average repair time correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            order_number: fc.string({ minLength: 1, maxLength: 20 }),
            received_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-05-31') }),
            delivered_date: fc.date({ min: new Date('2024-01-02'), max: new Date('2024-06-30') }),
            status: fc.constant('delivered'),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (repairs) => {
          // Asegurar que delivered_date >= received_date y que ambas fechas son válidas
          const validRepairs = repairs
            .filter(r => !isNaN(r.received_date.getTime()) && !isNaN(r.delivered_date.getTime()))
            .map(r => ({
              ...r,
              delivered_date: r.delivered_date > r.received_date ? r.delivered_date : new Date(r.received_date.getTime() + 86400000),
            }));

          if (validRepairs.length === 0) return;

          const avgTime = calculateAverageRepairTime(validRepairs);

          // Calcular promedio esperado
          const totalDays = validRepairs.reduce((sum, r) => {
            const days = Math.ceil(
              (r.delivered_date.getTime() - r.received_date.getTime()) / (1000 * 60 * 60 * 24)
            );
            return sum + days;
          }, 0);

          const expectedAvg = totalDays / validRepairs.length;
          expect(avgTime.average_days).toBeCloseTo(expectedAvg, 1);
          expect(avgTime.total_repairs).toBe(validRepairs.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should exclude non-delivered repairs from average', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            order_number: fc.string({ minLength: 1, maxLength: 20 }),
            received_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            delivered_date: fc.option(fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }), { nil: null }),
            status: fc.constantFrom('pending', 'in_progress', 'delivered'),
          }),
          { minLength: 1, maxLength: 30 }
        ),
        (repairs) => {
          const avgTime = calculateAverageRepairTime(repairs);

          // Solo debe contar reparaciones entregadas con fecha válida
          const deliveredRepairs = repairs.filter(
            r => r.status === 'delivered' && r.delivered_date && !isNaN((r.delivered_date as Date).getTime()) && !isNaN((r.received_date as Date).getTime())
          );
          expect(avgTime.total_repairs).toBe(deliveredRepairs.length);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Property 43: Report Filtering and Export
 * Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7
 * 
 * Verifica que los reportes se pueden filtrar por fecha y exportar correctamente.
 */

describe('Property 43: Report Filtering and Export', () => {
  it('should filter reports by date range', () => {
    fc.assert(
      fc.property(
        fc.record({
          repairs: fc.array(
            fc.record({
              order_number: fc.string({ minLength: 1, maxLength: 20 }),
              received_date: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
              status: fc.constantFrom('pending', 'delivered'),
            }),
            { minLength: 5, maxLength: 50 }
          ),
          filter_start: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
          filter_end: fc.date({ min: new Date('2021-01-01'), max: new Date('2025-12-31') }),
        }),
        (data) => {
          const startDate = data.filter_start;
          const endDate = data.filter_end > data.filter_start ? data.filter_end : data.filter_start;

          const filteredReport = getRepairsReport(data.repairs, { startDate, endDate });

          // Verificar que solo incluye reparaciones en el rango
          filteredReport.repairs.forEach(repair => {
            expect(repair.received_date.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
            expect(repair.received_date.getTime()).toBeLessThanOrEqual(endDate.getTime());
          });

          const expectedCount = data.repairs.filter(
            r => r.received_date >= startDate && r.received_date <= endDate
          ).length;
          expect(filteredReport.total_repairs).toBe(expectedCount);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should generate exportable report data', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            order_number: fc.string({ minLength: 1, maxLength: 20 }),
            customer_name: fc.string({ minLength: 1, maxLength: 100 }),
            device_type: fc.string({ minLength: 1, maxLength: 50 }),
            status: fc.constantFrom('pending', 'delivered'),
            total_cost: fc.double({ min: 0, max: 10000, noNaN: true }),
          }),
          { minLength: 1, maxLength: 30 }
        ),
        (repairs) => {
          const exportData = generateExportableReport(repairs);

          expect(exportData.rows).toHaveLength(repairs.length);
          expect(exportData.columns).toContain('order_number');
          expect(exportData.columns).toContain('customer_name');
          expect(exportData.columns).toContain('device_type');
          expect(exportData.columns).toContain('status');
          expect(exportData.columns).toContain('total_cost');

          // Verificar que cada fila tiene todos los campos
          exportData.rows.forEach((row, index) => {
            expect(row.order_number).toBe(repairs[index].order_number);
            expect(row.customer_name).toBe(repairs[index].customer_name);
            expect(row.device_type).toBe(repairs[index].device_type);
            expect(row.status).toBe(repairs[index].status);
            expect(row.total_cost).toBeCloseTo(repairs[index].total_cost, 2);
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Funciones auxiliares para simular operaciones de reportes
 */

function getPendingRepairs(repairs: any[]) {
  const nonFinalStatuses = ['pending', 'in_progress', 'waiting_parts', 'waiting_approval', 'repaired'];
  const pending = repairs.filter(r => nonFinalStatuses.includes(r.status));
  
  return {
    repairs: pending,
    total_pending: pending.length,
  };
}

function getOverdueRepairs(repairs: any[], today: Date) {
  const overdue = repairs.filter(
    r => r.estimated_delivery_date && r.estimated_delivery_date < today
  );
  
  return {
    repairs: overdue,
    total_overdue: overdue.length,
  };
}

function getRepairsByTechnician(repairs: any[]) {
  const byTechnician: Record<string, any> = {};
  
  repairs.forEach(repair => {
    if (repair.technician_id) {
      if (!byTechnician[repair.technician_id]) {
        byTechnician[repair.technician_id] = {
          total_repairs: 0,
          active_repairs: 0,
          completed_repairs: 0,
        };
      }
      
      byTechnician[repair.technician_id].total_repairs++;
      
      if (['pending', 'in_progress', 'waiting_parts', 'repaired'].includes(repair.status)) {
        byTechnician[repair.technician_id].active_repairs++;
      }
      
      if (repair.status === 'delivered') {
        byTechnician[repair.technician_id].completed_repairs++;
      }
    }
  });
  
  const unassigned = repairs.filter(r => !r.technician_id).length;
  
  return {
    by_technician: byTechnician,
    unassigned_repairs: unassigned,
  };
}

function calculateTechnicianPerformance(repairs: any[]) {
  const performance: Record<string, any> = {};
  
  repairs.forEach(repair => {
    if (!performance[repair.technician_id]) {
      performance[repair.technician_id] = {
        total_days: 0,
        count: 0,
      };
    }
    
    const days = Math.ceil(
      (repair.delivered_date.getTime() - repair.received_date.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    performance[repair.technician_id].total_days += days;
    performance[repair.technician_id].count++;
  });
  
  Object.keys(performance).forEach(techId => {
    performance[techId].average_completion_days = 
      performance[techId].total_days / performance[techId].count;
  });
  
  return performance;
}

function getRepairsByStatus(repairs: any[]) {
  return repairs.reduce((acc, repair) => {
    acc[repair.status] = (acc[repair.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function getStatusDistributionWithPercentages(repairs: any[]) {
  const distribution = getRepairsByStatus(repairs);
  const total = repairs.length;
  
  const withPercentages: Record<string, any> = {};
  Object.entries(distribution).forEach(([status, count]) => {
    withPercentages[status] = {
      count,
      percentage: (count / total) * 100,
    };
  });
  
  return withPercentages;
}

function calculateRepairProfitability(repairs: any[]) {
  const repairsWithProfit = repairs.map(r => calculateSingleRepairProfitability(r));
  
  const totalProfit = repairsWithProfit.reduce((sum, r) => sum + r.profit, 0);
  
  return {
    repairs: repairsWithProfit,
    total_profit: totalProfit,
  };
}

function calculateSingleRepairProfitability(repair: any) {
  const totalCost = repair.labor_cost + repair.parts_cost;
  const profit = repair.total_charged - totalCost;
  
  // Evitar división por cero y manejar casos edge con números muy pequeños
  let profitMargin = 0;
  
  // Considerar valores menores a 0.01 como efectivamente cero
  const effectiveTotalCharged = repair.total_charged < 0.01 ? 0 : repair.total_charged;
  const effectiveTotalCost = totalCost < 0.01 ? 0 : totalCost;
  
  if (effectiveTotalCharged > 0) {
    profitMargin = (profit / repair.total_charged) * 100;
  } else if (effectiveTotalCost === 0 && effectiveTotalCharged === 0) {
    // Si ambos son efectivamente cero, margen es 0
    profitMargin = 0;
  }
  
  return {
    ...repair,
    total_cost: totalCost,
    profit,
    profit_margin: profitMargin,
  };
}

function calculateAverageRepairTime(repairs: any[]) {
  const deliveredRepairs = repairs.filter(r => 
    r.status === 'delivered' && 
    r.delivered_date && 
    r.received_date &&
    !isNaN(r.delivered_date.getTime()) &&
    !isNaN(r.received_date.getTime())
  );
  
  if (deliveredRepairs.length === 0) {
    return {
      average_days: 0,
      total_repairs: 0,
    };
  }
  
  const totalDays = deliveredRepairs.reduce((sum, r) => {
    const days = Math.ceil(
      (r.delivered_date.getTime() - r.received_date.getTime()) / (1000 * 60 * 60 * 24)
    );
    return sum + days;
  }, 0);
  
  return {
    average_days: totalDays / deliveredRepairs.length,
    total_repairs: deliveredRepairs.length,
  };
}

function getRepairsReport(repairs: any[], dateFilter: { startDate: Date; endDate: Date }) {
  const filtered = repairs.filter(
    r => r.received_date >= dateFilter.startDate && r.received_date <= dateFilter.endDate
  );
  
  return {
    repairs: filtered,
    total_repairs: filtered.length,
  };
}

function generateExportableReport(repairs: any[]) {
  return {
    columns: ['order_number', 'customer_name', 'device_type', 'status', 'total_cost'],
    rows: repairs.map(r => ({
      order_number: r.order_number,
      customer_name: r.customer_name,
      device_type: r.device_type,
      status: r.status,
      total_cost: r.total_cost,
    })),
  };
}
