# Pagos Parciales en Cierre de Caja

## Pregunta del Usuario
"Había un cobro parcial que restaba de una venta, si eso lo cobro no debería aparecer en cierre de caja?"

## Respuesta: SÍ, los pagos parciales SÍ están siendo tomados en cuenta

El sistema de cierre de caja **SÍ incluye correctamente los pagos parciales** de las ventas.

## Cómo Funciona

El código en `lib/actions/cash-register.ts` (líneas 408-434) maneja los pagos de la siguiente manera:

### 1. Prioridad a Pagos Parciales (sale_payments)
```typescript
// Si la venta tiene pagos registrados, usar esos
if (sale.payments && sale.payments.length > 0) {
  for (const payment of sale.payments) {
    const amount = Number(payment.amount)
    const method = payment.payment_method?.toLowerCase() || ""
    
    if (method.includes("efectivo") || method.includes("cash")) {
      cashSales += amount
    } else if (method.includes("tarjeta") || method.includes("card")) {
      cardSales += amount
    } else if (method.includes("transferencia") || method.includes("transfer")) {
      transferSales += amount
    } else {
      otherSales += amount
    }
  }
}
```

### 2. Fallback al Método de Pago de la Venta
Si NO hay pagos parciales registrados, usa el `payment_method` de la venta completa:
```typescript
else {
  const amount = Number(sale.total)
  const method = sale.payment_method?.toLowerCase() || ""
  // ... clasifica por método de pago
}
```

## Ejemplo Práctico

**Escenario:**
- Venta total: $1000
- Pago parcial 1: $400 en efectivo
- Pago parcial 2: $600 en transferencia

**Resultado en Cierre de Caja:**
- Efectivo: $400
- Transferencia: $600
- Total ventas: $1000

✅ Los pagos parciales se suman correctamente según su método de pago.

## Verificación

Para verificar que tus pagos parciales están siendo registrados:

1. Ve a la venta en cuestión
2. Verifica que los pagos parciales estén en la tabla `sale_payments`
3. Cada pago debe tener:
   - `amount`: monto del pago
   - `payment_method`: método usado (efectivo, tarjeta, etc.)
   - `sale_id`: ID de la venta

## Conclusión

El sistema **ya está funcionando correctamente** con respecto a los pagos parciales. Si un pago parcial fue registrado en efectivo, ese monto aparecerá en el cierre de caja bajo "Ventas en Efectivo".

---

**Fecha:** 16/02/2026
**Estado:** Confirmado - Funcionalidad existente
