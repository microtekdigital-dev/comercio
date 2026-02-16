# Fix: Actualización de Caja Actual en Dashboard

## Problema Reportado

El usuario reportó que "el resultado de la caja actual no varía cuando cierro una caja, no me muestra la actualización del valor luego de sumar ventas y restar gastos de proveedores".

## Causa del Problema

La función `calculateCurrentCashBalance` en `lib/actions/financial-stats.ts` solo estaba devolviendo el `initial_cash_amount` de la última apertura de caja, sin calcular el saldo real después de las transacciones.

**Código anterior:**
```typescript
// For now, just return the initial cash amount from the opening
// TODO: When cash_register table is created, calculate actual balance with movements
return opening.initial_cash_amount;
```

Esto significaba que el dashboard siempre mostraba el monto inicial, sin importar cuántas ventas o pagos a proveedores se hubieran realizado.

## Solución Implementada

Se actualizó la función `calculateCurrentCashBalance` para calcular correctamente el saldo de caja actual usando la fórmula:

```
Caja Actual = Monto Inicial + Ventas en Efectivo - Pagos Proveedores en Efectivo
```

### Lógica Implementada:

1. **Buscar apertura activa:**
   - Obtiene todas las aperturas de caja
   - Obtiene todos los cierres de caja
   - Identifica aperturas que NO tienen cierre asociado (aperturas activas)
   - Usa la apertura activa más reciente

2. **Si no hay apertura activa:**
   - Usa el `initial_cash_amount` de la configuración de la empresa
   - Esto permite mostrar un valor incluso sin aperturas

3. **Calcular ventas en efectivo:**
   - Obtiene todas las ventas completadas desde la fecha de apertura
   - Para cada venta:
     - Si tiene `sale_payments`: suma los pagos en efectivo
     - Si no: usa el `payment_method` de la venta
   - Identifica efectivo por: "efectivo" o "cash" en el método

4. **Calcular pagos a proveedores en efectivo:**
   - Obtiene todos los pagos a proveedores desde la fecha de apertura
   - Filtra solo los pagos en efectivo
   - Suma el total

5. **Calcular saldo actual:**
   ```typescript
   currentBalance = initialAmount + cashSales - cashPayments
   ```

### Características:

- ✅ Calcula desde la fecha de la apertura activa
- ✅ Incluye ventas en efectivo (con soporte para pagos parciales)
- ✅ Resta pagos a proveedores en efectivo
- ✅ Maneja caso sin apertura activa (usa initial_cash de empresa)
- ✅ Logs detallados para debugging
- ✅ Manejo de errores robusto

## Ejemplo de Cálculo

**Escenario:**
- Apertura de caja: $10,000
- Ventas en efectivo del día: $5,000
- Pagos a proveedores en efectivo: $1,500

**Resultado:**
```
Caja Actual = $10,000 + $5,000 - $1,500 = $13,500
```

## Comportamiento Después del Cierre

Cuando se hace un cierre de caja:
1. La apertura queda vinculada al cierre (ya no es "activa")
2. El sistema busca la siguiente apertura sin cierre
3. Si no hay más aperturas activas, usa el `initial_cash_amount` de la empresa
4. El dashboard se actualiza automáticamente en la próxima carga

## Logs de Debugging

La función ahora incluye logs detallados:

```typescript
console.log("[FinancialStats] Cash calculation:", {
  initialAmount: activeOpening.initial_cash_amount,
  cashSales,
  cashPayments,
  currentBalance
});
```

Esto permite verificar los cálculos en la consola del servidor.

## Archivos Modificados

1. `lib/actions/financial-stats.ts`
   - Función `calculateCurrentCashBalance` completamente reescrita
   - Agregada lógica para identificar aperturas activas
   - Agregado cálculo de ventas en efectivo
   - Agregado cálculo de pagos a proveedores en efectivo
   - Agregada fórmula de saldo actual

2. `lib/actions/cash-register.ts` (actualización adicional)
   - Agregado `revalidatePath("/dashboard")` en todas las operaciones de caja
   - Esto asegura que el dashboard principal se actualice automáticamente
   - Afecta: `createCashRegisterOpening`, `deleteCashRegisterOpening`, `createCashRegisterClosure`, `deleteCashRegisterClosure`

## Cómo Verificar

1. Abrir el dashboard principal (`/dashboard`)
2. Ver el valor de "Caja actual"
3. Hacer una venta en efectivo
4. Volver al dashboard → El valor debe aumentar automáticamente
5. Hacer un pago a proveedor en efectivo
6. Volver al dashboard → El valor debe disminuir automáticamente
7. Hacer un cierre de caja
8. Volver al dashboard → El valor debe reflejar la nueva apertura (si existe)

**Nota:** Ya no es necesario refrescar manualmente (F5), el sistema revalida automáticamente la ruta `/dashboard` después de cada operación de caja.

## Notas Importantes

- El cálculo se hace desde la fecha de la apertura activa
- Solo cuenta transacciones en efectivo
- Los pagos parciales de ventas se manejan correctamente
- Si no hay apertura activa, usa el valor inicial de la empresa
- El dashboard se revalida automáticamente después de operaciones de caja
- La actualización es inmediata al navegar de vuelta al dashboard (no requiere F5)

## Relación con Otros Componentes

Este fix complementa los siguientes componentes ya implementados:
- Sistema de apertura de caja
- Sistema de cierre de caja
- Registro de ventas con pagos parciales
- Registro de pagos a proveedores

---

**Fecha:** 16/02/2026
**Estado:** Implementado y funcionando
