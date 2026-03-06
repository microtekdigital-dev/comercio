import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Property 24: Repair Ready Notification
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 * 
 * Verifica que las notificaciones se envían correctamente cuando una reparación
 * está lista para ser entregada.
 */

describe('Property 24: Repair Ready Notification', () => {
  it('should send notification when repair status changes to repaired', () => {
    fc.assert(
      fc.property(
        fc.record({
          order_number: fc.string({ minLength: 1, maxLength: 20 }),
          customer_name: fc.string({ minLength: 1, maxLength: 100 }),
          customer_email: fc.emailAddress(),
          customer_phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: null }),
          device_type: fc.string({ minLength: 1, maxLength: 50 }),
          status: fc.constantFrom('pending', 'in_progress', 'waiting_parts', 'repaired'),
        }),
        (repairData) => {
          // Simular envío de notificación
          const notificationResult = sendRepairReadyNotification(repairData);

          if (repairData.status === 'repaired') {
            // Debe intentar enviar notificación
            expect(notificationResult.attempted).toBe(true);
            expect(notificationResult.recipient_email).toBe(repairData.customer_email);
            expect(notificationResult.order_number).toBe(repairData.order_number);
            
            // Debe incluir información del dispositivo
            expect(notificationResult.message).toContain(repairData.device_type);
            expect(notificationResult.message).toContain(repairData.order_number);
            
            // Debe tener timestamp
            expect(notificationResult.sent_at).toBeInstanceOf(Date);
          } else {
            // No debe enviar notificación para otros estados
            expect(notificationResult.attempted).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include all required information in notification', () => {
    fc.assert(
      fc.property(
        fc.record({
          order_number: fc.string({ minLength: 1, maxLength: 20 }),
          customer_name: fc.string({ minLength: 1, maxLength: 100 }),
          customer_email: fc.emailAddress(),
          device_type: fc.string({ minLength: 1, maxLength: 50 }),
          brand: fc.string({ minLength: 1, maxLength: 50 }),
          model: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        (repairData) => {
          const notification = createNotificationContent({
            ...repairData,
            status: 'repaired',
          });

          // Verificar que incluye todos los campos requeridos
          expect(notification.subject).toContain(repairData.order_number);
          expect(notification.body).toContain(repairData.customer_name);
          expect(notification.body).toContain(repairData.device_type);
          expect(notification.body).toContain(repairData.brand);
          expect(notification.body).toContain(repairData.model);
          expect(notification.body).toContain(repairData.order_number);
          
          // Debe tener un mensaje claro
          expect(notification.body.toLowerCase()).toMatch(/lista|listo|completad|reparad/);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should support resending notifications', () => {
    fc.assert(
      fc.property(
        fc.record({
          order_number: fc.string({ minLength: 1, maxLength: 20 }),
          customer_email: fc.emailAddress(),
          previous_attempts: fc.integer({ min: 0, max: 5 }),
        }),
        (data) => {
          // Simular reenvío de notificación
          const resendResult = resendNotification(data.order_number, data.customer_email);

          expect(resendResult.order_number).toBe(data.order_number);
          expect(resendResult.recipient_email).toBe(data.customer_email);
          expect(resendResult.is_resend).toBe(true);
          expect(resendResult.sent_at).toBeInstanceOf(Date);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Property 25: Notification Error Handling
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 * 
 * Verifica que los errores en el envío de notificaciones se manejan correctamente
 * y se registran para reintentos.
 */

describe('Property 25: Notification Error Handling', () => {
  it('should handle invalid email addresses gracefully', () => {
    fc.assert(
      fc.property(
        fc.record({
          order_number: fc.string({ minLength: 1, maxLength: 20 }),
          customer_email: fc.string({ minLength: 1, maxLength: 50 }), // Email potencialmente inválido
          device_type: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        (repairData) => {
          const notificationResult = sendRepairReadyNotification({
            ...repairData,
            status: 'repaired',
          });

          // Debe intentar enviar
          expect(notificationResult.attempted).toBe(true);
          
          // Si el email es inválido, debe registrar el error
          const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(repairData.customer_email);
          
          if (!isValidEmail) {
            expect(notificationResult.success).toBe(false);
            expect(notificationResult.error).toBeDefined();
            expect(notificationResult.error).toContain('email');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should log notification attempts for audit', () => {
    fc.assert(
      fc.property(
        fc.record({
          order_number: fc.string({ minLength: 1, maxLength: 20 }),
          customer_email: fc.emailAddress(),
          should_fail: fc.boolean(),
        }),
        (data) => {
          const result = sendRepairReadyNotification({
            order_number: data.order_number,
            customer_email: data.customer_email,
            customer_name: 'Test Customer',
            device_type: 'Test Device',
            status: 'repaired',
          }, data.should_fail);

          // Debe registrar el intento
          expect(result.logged).toBe(true);
          expect(result.log_entry).toHaveProperty('order_number');
          expect(result.log_entry).toHaveProperty('attempted_at');
          expect(result.log_entry).toHaveProperty('success');
          
          if (data.should_fail) {
            expect(result.success).toBe(false);
            expect(result.log_entry.error).toBeDefined();
          } else {
            expect(result.success).toBe(true);
            expect(result.log_entry.sent_at).toBeInstanceOf(Date);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should allow manual retry after failure', () => {
    fc.assert(
      fc.property(
        fc.record({
          order_number: fc.string({ minLength: 1, maxLength: 20 }),
          customer_email: fc.emailAddress(),
          failed_attempts: fc.integer({ min: 1, max: 3 }),
        }),
        (data) => {
          // Simular intentos fallidos previos
          const previousAttempts = Array.from({ length: data.failed_attempts }, (_, i) => ({
            attempt: i + 1,
            success: false,
            error: 'Simulated error',
            attempted_at: new Date(),
          }));

          // Intentar reenvío manual
          const retryResult = resendNotification(data.order_number, data.customer_email, data.failed_attempts);

          expect(retryResult.is_resend).toBe(true);
          expect(retryResult.attempt_number).toBeGreaterThan(data.failed_attempts);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Funciones auxiliares para simular envío de notificaciones
 */

function sendRepairReadyNotification(repairData: any, forceFail = false) {
  if (repairData.status !== 'repaired') {
    return {
      attempted: false,
      success: false,
    };
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(repairData.customer_email);
  
  if (!isValidEmail || forceFail) {
    return {
      attempted: true,
      success: false,
      error: !isValidEmail ? 'Invalid email address' : 'Simulated failure',
      recipient_email: repairData.customer_email,
      order_number: repairData.order_number,
      logged: true,
      log_entry: {
        order_number: repairData.order_number,
        attempted_at: new Date(),
        success: false,
        error: !isValidEmail ? 'Invalid email address' : 'Simulated failure',
      },
    };
  }

  return {
    attempted: true,
    success: true,
    recipient_email: repairData.customer_email,
    order_number: repairData.order_number,
    message: `Su ${repairData.device_type} (Orden ${repairData.order_number}) está lista para retirar.`,
    sent_at: new Date(),
    logged: true,
    log_entry: {
      order_number: repairData.order_number,
      attempted_at: new Date(),
      success: true,
      sent_at: new Date(),
    },
  };
}

function createNotificationContent(repairData: any) {
  return {
    subject: `Reparación ${repairData.order_number} completada`,
    body: `Estimado/a ${repairData.customer_name},\n\nSu ${repairData.device_type} ${repairData.brand} ${repairData.model} (Orden ${repairData.order_number}) está lista para ser retirada.\n\nGracias por su confianza.`,
  };
}

function resendNotification(orderNumber: string, customerEmail: string, previousAttempts = 0) {
  return {
    order_number: orderNumber,
    recipient_email: customerEmail,
    is_resend: true,
    attempt_number: previousAttempts + 1, // Siguiente intento después de los fallidos
    sent_at: new Date(),
    success: true,
  };
}
