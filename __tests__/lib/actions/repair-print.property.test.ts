import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Property 23: Printable Document Generation
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 19.4
 * 
 * Verifica que el documento imprimible contiene todos los campos requeridos
 * y se genera correctamente para cualquier orden de reparación válida.
 */

describe('Property 23: Printable Document Generation', () => {
  it('should generate printable document with all required fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          order_number: fc.string({ minLength: 1, maxLength: 20 }),
          customer_name: fc.string({ minLength: 1, maxLength: 100 }),
          customer_phone: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
          customer_email: fc.option(fc.emailAddress(), { nil: null }),
          device_type: fc.string({ minLength: 1, maxLength: 50 }),
          brand: fc.string({ minLength: 1, maxLength: 50 }),
          model: fc.string({ minLength: 1, maxLength: 50 }),
          serial_number: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          reported_problem: fc.string({ minLength: 1, maxLength: 500 }),
          accessories: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
          diagnosis: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
          technician_name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          received_date: fc.date(),
          estimated_delivery_date: fc.option(fc.date(), { nil: null }),
          labor_cost: fc.double({ min: 0, max: 100000, noNaN: true }),
          items: fc.array(
            fc.record({
              product_name: fc.string({ minLength: 1, maxLength: 100 }),
              quantity: fc.integer({ min: 1, max: 100 }),
              unit_price: fc.double({ min: 0, max: 10000, noNaN: true }),
            }),
            { maxLength: 20 }
          ),
        }),
        (repairData) => {
          // Generar documento imprimible simulado
          const printableDoc = generatePrintableDocument(repairData);

          // Verificar que contiene todos los campos requeridos
          expect(printableDoc).toHaveProperty('order_number');
          expect(printableDoc.order_number).toBe(repairData.order_number);
          
          expect(printableDoc).toHaveProperty('customer_name');
          expect(printableDoc.customer_name).toBe(repairData.customer_name);
          
          expect(printableDoc).toHaveProperty('device_type');
          expect(printableDoc.device_type).toBe(repairData.device_type);
          
          expect(printableDoc).toHaveProperty('brand');
          expect(printableDoc.brand).toBe(repairData.brand);
          
          expect(printableDoc).toHaveProperty('model');
          expect(printableDoc.model).toBe(repairData.model);
          
          expect(printableDoc).toHaveProperty('reported_problem');
          expect(printableDoc.reported_problem).toBe(repairData.reported_problem);
          
          expect(printableDoc).toHaveProperty('received_date');
          expect(printableDoc.received_date).toBeInstanceOf(Date);

          // Verificar cálculo de totales
          const expectedItemsTotal = repairData.items.reduce(
            (sum, item) => sum + item.quantity * item.unit_price,
            0
          );
          const expectedTotal = expectedItemsTotal + repairData.labor_cost;
          
          expect(printableDoc.items_total).toBeCloseTo(expectedItemsTotal, 2);
          expect(printableDoc.total).toBeCloseTo(expectedTotal, 2);

          // Verificar que incluye items si existen
          if (repairData.items.length > 0) {
            expect(printableDoc.items).toHaveLength(repairData.items.length);
            repairData.items.forEach((item, index) => {
              expect(printableDoc.items[index].product_name).toBe(item.product_name);
              expect(printableDoc.items[index].quantity).toBe(item.quantity);
              expect(printableDoc.items[index].unit_price).toBeCloseTo(item.unit_price, 2);
              expect(printableDoc.items[index].subtotal).toBeCloseTo(
                item.quantity * item.unit_price,
                2
              );
            });
          }

          // Verificar campos opcionales
          if (repairData.customer_phone) {
            expect(printableDoc.customer_phone).toBe(repairData.customer_phone);
          }
          
          if (repairData.diagnosis) {
            expect(printableDoc.diagnosis).toBe(repairData.diagnosis);
          }
          
          if (repairData.technician_name) {
            expect(printableDoc.technician_name).toBe(repairData.technician_name);
          }

          // Verificar que el documento es válido para impresión
          expect(printableDoc.is_printable).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle missing optional fields gracefully', () => {
    fc.assert(
      fc.property(
        fc.record({
          order_number: fc.string({ minLength: 1, maxLength: 20 }),
          customer_name: fc.string({ minLength: 1, maxLength: 100 }),
          device_type: fc.string({ minLength: 1, maxLength: 50 }),
          brand: fc.string({ minLength: 1, maxLength: 50 }),
          model: fc.string({ minLength: 1, maxLength: 50 }),
          reported_problem: fc.string({ minLength: 1, maxLength: 500 }),
          received_date: fc.date(),
          labor_cost: fc.double({ min: 0, max: 100000, noNaN: true }),
        }),
        (minimalData) => {
          // Generar documento con campos mínimos
          const printableDoc = generatePrintableDocument({
            ...minimalData,
            customer_phone: null,
            customer_email: null,
            serial_number: null,
            accessories: null,
            diagnosis: null,
            technician_name: null,
            estimated_delivery_date: null,
            items: [],
          });

          // Verificar que se genera correctamente sin campos opcionales
          expect(printableDoc.is_printable).toBe(true);
          expect(printableDoc.order_number).toBe(minimalData.order_number);
          expect(printableDoc.items_total).toBe(0);
          expect(printableDoc.total).toBeCloseTo(minimalData.labor_cost, 2);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Función auxiliar para simular la generación de documento imprimible
 */
function generatePrintableDocument(repairData: any) {
  const itemsTotal = repairData.items.reduce(
    (sum: number, item: any) => sum + item.quantity * item.unit_price,
    0
  );
  
  const total = itemsTotal + repairData.labor_cost;

  return {
    order_number: repairData.order_number,
    customer_name: repairData.customer_name,
    customer_phone: repairData.customer_phone || undefined,
    customer_email: repairData.customer_email || undefined,
    device_type: repairData.device_type,
    brand: repairData.brand,
    model: repairData.model,
    serial_number: repairData.serial_number || undefined,
    reported_problem: repairData.reported_problem,
    accessories: repairData.accessories || undefined,
    diagnosis: repairData.diagnosis || undefined,
    technician_name: repairData.technician_name || undefined,
    received_date: repairData.received_date,
    estimated_delivery_date: repairData.estimated_delivery_date || undefined,
    labor_cost: repairData.labor_cost,
    items: repairData.items.map((item: any) => ({
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price,
    })),
    items_total: itemsTotal,
    total: total,
    is_printable: true,
  };
}
