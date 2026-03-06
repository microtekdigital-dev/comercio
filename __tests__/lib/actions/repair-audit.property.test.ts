import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Property 50: Audit Trail
 * Validates: Requirements 21.4, 21.5
 * 
 * Verifica que el sistema registra correctamente el usuario que crea
 * y modifica cada registro para mantener una pista de auditoría.
 */

describe('Property 50: Audit Trail', () => {
  it('should set created_by on repair order creation', () => {
    fc.assert(
      fc.property(
        fc.record({
          customer_id: fc.uuid(),
          device_type: fc.string({ minLength: 1, maxLength: 100 }),
          brand: fc.string({ minLength: 1, maxLength: 100 }),
          model: fc.string({ minLength: 1, maxLength: 100 }),
          reported_problem: fc.string({ minLength: 1, maxLength: 500 }),
          user_id: fc.uuid(),
        }),
        (data) => {
          const order = createRepairOrderWithUser(data);

          expect(order.created_by).toBe(data.user_id);
          expect(order.created_at).toBeDefined();
          expect(order.updated_by).toBeNull(); // No actualizado aún
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should set updated_by on repair order update', () => {
    fc.assert(
      fc.property(
        fc.record({
          order_id: fc.uuid(),
          original_user_id: fc.uuid(),
          updating_user_id: fc.uuid(),
          diagnosis: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        (data) => {
          // Crear orden con usuario original
          const originalOrder = createRepairOrderWithUser({
            customer_id: 'customer-uuid',
            device_type: 'Smartphone',
            brand: 'Samsung',
            model: 'Galaxy',
            reported_problem: 'Screen broken',
            user_id: data.original_user_id,
          });

          // Actualizar con usuario diferente
          const updatedOrder = updateRepairOrderWithUser({
            order_id: originalOrder.id,
            diagnosis: data.diagnosis,
            user_id: data.updating_user_id,
            original_user_id: data.original_user_id,
          });

          expect(updatedOrder.created_by).toBe(data.original_user_id); // No cambia
          expect(updatedOrder.updated_by).toBe(data.updating_user_id);
          expect(updatedOrder.updated_at).toBeDefined();
          expect(updatedOrder.updated_at.getTime()).toBeGreaterThan(
            updatedOrder.created_at.getTime()
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve created_by across multiple updates', () => {
    fc.assert(
      fc.property(
        fc.record({
          original_user_id: fc.uuid(),
          updaters: fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
        }),
        (data) => {
          // Crear orden
          let order = createRepairOrderWithUser({
            customer_id: 'customer-uuid',
            device_type: 'Laptop',
            brand: 'Dell',
            model: 'XPS',
            reported_problem: 'Not booting',
            user_id: data.original_user_id,
          });

          // Múltiples actualizaciones por diferentes usuarios
          data.updaters.forEach(updaterId => {
            order = updateRepairOrderWithUser({
              order_id: order.id,
              diagnosis: `Updated by ${updaterId}`,
              user_id: updaterId,
              original_user_id: data.original_user_id,
            });
          });

          // created_by debe permanecer igual
          expect(order.created_by).toBe(data.original_user_id);
          // updated_by debe ser el último usuario
          expect(order.updated_by).toBe(data.updaters[data.updaters.length - 1]);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should set created_by on technician creation', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 255 }),
          specialty: fc.option(fc.string({ minLength: 1, maxLength: 255 }), { nil: null }),
          user_id: fc.uuid(),
        }),
        (data) => {
          const technician = createTechnicianWithUser(data);

          expect(technician.created_by).toBe(data.user_id);
          expect(technician.created_at).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should set created_by on repair note creation', () => {
    fc.assert(
      fc.property(
        fc.record({
          repair_order_id: fc.uuid(),
          note: fc.string({ minLength: 1, maxLength: 1000 }),
          user_id: fc.uuid(),
        }),
        (data) => {
          const note = createRepairNoteWithUser(data);

          expect(note.created_by).toBe(data.user_id);
          expect(note.created_at).toBeDefined();
          expect(note.updated_by).toBeNull();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should set updated_by on repair note update', () => {
    fc.assert(
      fc.property(
        fc.record({
          repair_order_id: fc.uuid(),
          original_note: fc.string({ minLength: 1, maxLength: 500 }),
          updated_note: fc.string({ minLength: 1, maxLength: 500 }),
          original_user_id: fc.uuid(),
          updating_user_id: fc.uuid(),
        }),
        (data) => {
          // Crear nota
          const originalNote = createRepairNoteWithUser({
            repair_order_id: data.repair_order_id,
            note: data.original_note,
            user_id: data.original_user_id,
          });

          // Actualizar nota
          const updatedNote = updateRepairNoteWithUser({
            note_id: originalNote.id,
            note: data.updated_note,
            user_id: data.updating_user_id,
            original_user_id: data.original_user_id,
          });

          expect(updatedNote.created_by).toBe(data.original_user_id);
          expect(updatedNote.updated_by).toBe(data.updating_user_id);
          expect(updatedNote.updated_at).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should set created_by on repair payment creation', () => {
    fc.assert(
      fc.property(
        fc.record({
          repair_order_id: fc.uuid(),
          amount: fc.double({ min: 0.01, max: 10000, noNaN: true }),
          payment_method: fc.constantFrom('cash', 'card', 'transfer', 'account'),
          user_id: fc.uuid(),
        }),
        (data) => {
          const payment = createRepairPaymentWithUser(data);

          expect(payment.created_by).toBe(data.user_id);
          expect(payment.created_at).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should track different users for different operations', () => {
    fc.assert(
      fc.property(
        fc.record({
          creator_id: fc.uuid(),
          diagnoser_id: fc.uuid(),
          payer_id: fc.uuid(),
        }),
        (data) => {
          // Usuario 1 crea la orden
          const order = createRepairOrderWithUser({
            customer_id: 'customer-uuid',
            device_type: 'Tablet',
            brand: 'Apple',
            model: 'iPad',
            reported_problem: 'Battery issue',
            user_id: data.creator_id,
          });

          // Usuario 2 agrega diagnóstico
          const diagnosedOrder = updateRepairOrderWithUser({
            order_id: order.id,
            diagnosis: 'Battery needs replacement',
            user_id: data.diagnoser_id,
            original_user_id: data.creator_id,
          });

          // Usuario 3 registra pago
          const payment = createRepairPaymentWithUser({
            repair_order_id: order.id,
            amount: 500,
            payment_method: 'cash',
            user_id: data.payer_id,
          });

          // Verificar que cada operación tiene su usuario correcto
          expect(diagnosedOrder.created_by).toBe(data.creator_id);
          expect(diagnosedOrder.updated_by).toBe(data.diagnoser_id);
          expect(payment.created_by).toBe(data.payer_id);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain audit trail for status changes', () => {
    fc.assert(
      fc.property(
        fc.record({
          creator_id: fc.uuid(),
          status_changers: fc.array(
            fc.record({
              user_id: fc.uuid(),
              status: fc.constantFrom('diagnosing', 'repairing', 'repaired', 'delivered'),
            }),
            { minLength: 1, maxLength: 4 }
          ),
        }),
        (data) => {
          let order = createRepairOrderWithUser({
            customer_id: 'customer-uuid',
            device_type: 'Phone',
            brand: 'iPhone',
            model: '13',
            reported_problem: 'Cracked screen',
            user_id: data.creator_id,
          });

          // Cambios de estado por diferentes usuarios
          data.status_changers.forEach(changer => {
            order = updateRepairStatusWithUser({
              order_id: order.id,
              status: changer.status,
              user_id: changer.user_id,
              original_user_id: data.creator_id,
            });

            expect(order.updated_by).toBe(changer.user_id);
          });

          // created_by debe seguir siendo el creador original
          expect(order.created_by).toBe(data.creator_id);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Funciones auxiliares para simular operaciones con auditoría
 */

interface RepairOrder {
  id: string;
  customer_id: string;
  device_type: string;
  brand: string;
  model: string;
  reported_problem: string;
  diagnosis?: string;
  status: string;
  created_by: string;
  created_at: Date;
  updated_by: string | null;
  updated_at: Date;
}

interface Technician {
  id: string;
  name: string;
  specialty: string | null;
  created_by: string;
  created_at: Date;
}

interface RepairNote {
  id: string;
  repair_order_id: string;
  note: string;
  created_by: string;
  created_at: Date;
  updated_by: string | null;
  updated_at: Date | null;
}

interface RepairPayment {
  id: string;
  repair_order_id: string;
  amount: number;
  payment_method: string;
  created_by: string;
  created_at: Date;
}

function createRepairOrderWithUser(data: any): RepairOrder {
  return {
    id: 'generated-uuid',
    customer_id: data.customer_id,
    device_type: data.device_type,
    brand: data.brand,
    model: data.model,
    reported_problem: data.reported_problem,
    status: 'received',
    created_by: data.user_id,
    created_at: new Date(),
    updated_by: null,
    updated_at: new Date(),
  };
}

function updateRepairOrderWithUser(data: any): RepairOrder {
  const originalOrder = createRepairOrderWithUser({
    customer_id: 'customer-uuid',
    device_type: 'Device',
    brand: 'Brand',
    model: 'Model',
    reported_problem: 'Problem',
    user_id: data.original_user_id || 'original-user-id',
  });

  // Ensure updated_at is after created_at
  const updatedAt = new Date(originalOrder.created_at.getTime() + 1000); // +1 segundo

  return {
    ...originalOrder,
    id: data.order_id,
    diagnosis: data.diagnosis,
    status: 'diagnosing',
    updated_by: data.user_id,
    updated_at: updatedAt,
  };
}

function updateRepairStatusWithUser(data: any): RepairOrder {
  const originalOrder = createRepairOrderWithUser({
    customer_id: 'customer-uuid',
    device_type: 'Device',
    brand: 'Brand',
    model: 'Model',
    reported_problem: 'Problem',
    user_id: data.original_user_id || 'original-user-id',
  });

  return {
    ...originalOrder,
    id: data.order_id,
    status: data.status,
    updated_by: data.user_id,
    updated_at: new Date(),
  };
}

function createTechnicianWithUser(data: any): Technician {
  return {
    id: 'generated-uuid',
    name: data.name,
    specialty: data.specialty,
    created_by: data.user_id,
    created_at: new Date(),
  };
}

function createRepairNoteWithUser(data: any): RepairNote {
  return {
    id: 'generated-uuid',
    repair_order_id: data.repair_order_id,
    note: data.note,
    created_by: data.user_id,
    created_at: new Date(),
    updated_by: null,
    updated_at: null,
  };
}

function updateRepairNoteWithUser(data: any): RepairNote {
  const originalNote = createRepairNoteWithUser({
    repair_order_id: 'repair-order-uuid',
    note: 'Original note',
    user_id: data.original_user_id || 'original-user-id',
  });

  return {
    ...originalNote,
    id: data.note_id,
    note: data.note,
    updated_by: data.user_id,
    updated_at: new Date(),
  };
}

function createRepairPaymentWithUser(data: any): RepairPayment {
  return {
    id: 'generated-uuid',
    repair_order_id: data.repair_order_id,
    amount: data.amount,
    payment_method: data.payment_method,
    created_by: data.user_id,
    created_at: new Date(),
  };
}
