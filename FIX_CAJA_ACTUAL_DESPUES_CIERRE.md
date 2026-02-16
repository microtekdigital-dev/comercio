# Fix: Caja Actual después de Cierre de Caja

## Problema Reportado

Después de cerrar la caja, el dashboard muestra $50,000 en "Caja Actual" en lugar de $0 o el monto correcto.

## Causa Raíz

La función `calculateCurrentCashBalance()` en `lib/actions/financial-stats.ts` tenía una lógica incorrecta cuando no había una apertura activa (después de un cierre):

```typescript
if (!activeOpening) {
  // Retornaba el initial_cash_amount de la empresa
  return company?.initial_cash_amount || 0;
}
```

Esto causaba que después de cerrar la caja, se mostrara el monto inicial configurado en la empresa ($50,000) en lugar de $0.

## Solución Aplicada

Se modificó la función para retornar `0` cuando no hay apertura activa:

```typescript
if (!activeOpening) {
  console.log("[FinancialStats] No active cash register opening found, returning 0");
  return 0;
}
```

## Lógica Correcta

- **Con apertura activa**: Calcular el saldo actual basado en:
  - Monto inicial de la apertura
  - + Ventas en efectivo
  - - Pagos a proveedores en efectivo
  - + Ingresos de caja
  - - Retiros de caja

- **Sin apertura activa** (después de cierre): Retornar `0`
  - La "Caja Actual" solo tiene sentido cuando hay una caja abierta
  - El `initial_cash_amount` de la empresa es solo un valor de referencia para nuevas aperturas

## Archivos Modificados

- `lib/actions/financial-stats.ts` - Función `calculateCurrentCashBalance()`

## Comportamiento Esperado

1. Usuario abre caja con $80,000 → Caja Actual: $80,000
2. Usuario realiza ventas en efectivo → Caja Actual aumenta
3. Usuario cierra caja → Caja Actual: $0
4. Usuario abre nueva caja con $50,000 → Caja Actual: $50,000

## Fecha de Corrección

2026-02-16
