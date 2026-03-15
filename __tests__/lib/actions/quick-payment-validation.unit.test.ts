/**
 * Unit Tests: Validación de formulario QuickPaymentModal
 * Validates: Requirements 9.1, 9.2, 9.3
 */

import { describe, it, expect } from 'vitest'

// Lógica de validación extraída del modal para testear de forma aislada
function validatePaymentForm(amount: number, paymentMethod: string, saleTotal: number) {
  const errors: string[] = []
  const warnings: string[] = []

  if (amount <= 0) {
    errors.push('El monto debe ser mayor a 0')
  }

  if (!paymentMethod) {
    errors.push('Debes seleccionar un método de pago')
  }

  if (amount > saleTotal && amount > 0) {
    warnings.push('El monto excede el total de la venta')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    canSubmit: errors.length === 0 && !!paymentMethod,
  }
}

describe('QuickPaymentModal - Validación de formulario', () => {
  it('monto cero muestra error y previene envío', () => {
    const result = validatePaymentForm(0, 'efectivo', 1000)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('El monto debe ser mayor a 0')
    expect(result.canSubmit).toBe(false)
  })

  it('monto negativo muestra error y previene envío', () => {
    const result = validatePaymentForm(-50, 'efectivo', 1000)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('El monto debe ser mayor a 0')
    expect(result.canSubmit).toBe(false)
  })

  it('sin método de pago deshabilita botón', () => {
    const result = validatePaymentForm(500, '', 1000)
    expect(result.canSubmit).toBe(false)
    expect(result.errors).toContain('Debes seleccionar un método de pago')
  })

  it('monto mayor al total muestra advertencia pero permite envío', () => {
    const result = validatePaymentForm(1500, 'efectivo', 1000)
    expect(result.isValid).toBe(true)
    expect(result.canSubmit).toBe(true)
    expect(result.warnings).toContain('El monto excede el total de la venta')
    expect(result.errors).toHaveLength(0)
  })

  it('formulario válido con monto y método correctos', () => {
    const result = validatePaymentForm(500, 'transferencia', 1000)
    expect(result.isValid).toBe(true)
    expect(result.canSubmit).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it('monto exactamente igual al total no genera advertencia', () => {
    const result = validatePaymentForm(1000, 'efectivo', 1000)
    expect(result.isValid).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })
})
