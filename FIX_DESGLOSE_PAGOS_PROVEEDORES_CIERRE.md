# Desglose de Pagos a Proveedores por Método de Pago en Cierre de Caja

## Problema
El cierre de caja solo mostraba el total de pagos a proveedores en efectivo, sin desglosar por método de pago (efectivo, tarjeta, transferencia, otros) como se hace con las ventas.

## Solución Implementada

### 1. Actualización de Base de Datos
**Archivo**: `scripts/215_add_supplier_payment_methods_to_closures.sql`

Se agregaron nuevas columnas a la tabla `cash_register_closures`:
- `supplier_payments_total`: Total de pagos a proveedores (todos los métodos)
- `supplier_payments_card`: Pagos con tarjeta
- `supplier_payments_transfer`: Pagos por transferencia
- `supplier_payments_other`: Pagos por otros métodos
- Se mantiene `supplier_payments_cash`: Pagos en efectivo

**Ejecutar el script**:
```sql
-- En Supabase SQL Editor
\i scripts/215_add_supplier_payment_methods_to_closures.sql
```

### 2. Actualización de Tipos TypeScript
**Archivo**: `lib/types/erp.ts`

Se actualizó la interfaz `CashRegisterClosure` para incluir los nuevos campos:
```typescript
export interface CashRegisterClosure {
  // ... campos existentes
  supplier_payments_total: number;
  supplier_payments_cash: number;
  supplier_payments_card?: number;
  supplier_payments_transfer?: number;
  supplier_payments_other?: number;
  // ... resto de campos
}
```

### 3. Actualización de Lógica de Cálculo
**Archivo**: `lib/actions/cash-register.ts`

#### Función `createCashRegisterClosure`:
- Ahora calcula los pagos a proveedores por cada método de pago
- Clasifica los pagos según palabras clave en `payment_method`:
  - **Efectivo**: "efectivo", "cash"
  - **Tarjeta**: "tarjeta", "card", "débito", "crédito"
  - **Transferencia**: "transferencia", "transfer"
  - **Otros**: cualquier otro método

#### Función `getSupplierPaymentsForClosure`:
- Cambió de devolver solo pagos en efectivo a devolver TODOS los pagos
- Se eliminó el filtro que limitaba a pagos en efectivo
- Ahora el título del comentario dice "all payment methods" en lugar de "cash only"

### 4. Actualización del Componente de Reporte
**Archivo**: `components/dashboard/cash-closure-report.tsx`

#### Sección "RESUMEN DE PAGOS A PROVEEDORES":
- Ahora muestra el total general (`supplier_payments_total`)
- Desglose por método de pago en tarjetas individuales:
  - Efectivo (con icono Wallet)
  - Tarjeta (con icono CreditCard)
  - Transferencia (con icono Smartphone)
  - Otros (con icono TrendingUp, solo si > 0)

#### Tabla "DETALLE DE PAGOS A PROVEEDORES":
- Cambió el título de "PAGOS A PROVEEDORES (EFECTIVO)" a "DETALLE DE PAGOS A PROVEEDORES"
- Ahora muestra TODOS los pagos, no solo los de efectivo
- Incluye la columna "Método" que muestra el método de pago de cada transacción

## Estructura Visual del Reporte

```
┌─────────────────────────────────────────────────────────┐
│ RESUMEN DE PAGOS A PROVEEDORES                          │
├─────────────────────────────────────────────────────────┤
│ ┌──────────────────┐  ┌──────────┬──────────┐          │
│ │ Total Pagos      │  │ Efectivo │ Tarjeta  │          │
│ │ $ X,XXX.XX       │  │ $ XXX.XX │ $ XXX.XX │          │
│ │ X pagos          │  ├──────────┼──────────┤          │
│ └──────────────────┘  │Transfer. │ Otros    │          │
│                       │ $ XXX.XX │ $ XXX.XX │          │
│                       └──────────┴──────────┘          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ DETALLE DE PAGOS A PROVEEDORES                          │
├──────────────┬─────────┬──────────────┬────────────────┤
│ Proveedor    │ Monto   │ Método       │ Referencia     │
├──────────────┼─────────┼──────────────┼────────────────┤
│ Proveedor A  │ $100.00 │ Efectivo     │ N/A            │
│ Proveedor B  │ $200.00 │ Tarjeta      │ REF-123        │
│ Proveedor C  │ $150.00 │ Transferencia│ TRANS-456      │
└──────────────┴─────────┴──────────────┴────────────────┘
```

## Beneficios

1. **Consistencia**: El reporte de pagos a proveedores ahora tiene el mismo nivel de detalle que el de ventas
2. **Visibilidad completa**: Se pueden ver todos los pagos a proveedores, no solo los de efectivo
3. **Mejor control**: Permite identificar rápidamente cuánto se pagó por cada método
4. **Reconciliación más fácil**: Facilita la conciliación bancaria al tener el desglose por método

## Notas Importantes

- Los cierres existentes tendrán `supplier_payments_total = supplier_payments_cash` después de ejecutar el script de migración
- Los nuevos cierres calcularán correctamente todos los métodos de pago
- La sección de pagos a proveedores ahora SIEMPRE se muestra, incluso cuando el monto es $0.00
- El cálculo de efectivo esperado en la reconciliación solo considera pagos en efectivo (no cambia)

## Archivos Modificados

1. `scripts/215_add_supplier_payment_methods_to_closures.sql` (nuevo)
2. `lib/types/erp.ts`
3. `lib/actions/cash-register.ts`
4. `components/dashboard/cash-closure-report.tsx`
5. `FIX_DESGLOSE_PAGOS_PROVEEDORES_CIERRE.md` (este archivo)

## Próximos Pasos

1. Ejecutar el script SQL en Supabase
2. Refrescar el navegador (Ctrl+F5)
3. Crear un nuevo cierre de caja para ver los cambios
4. Verificar que el desglose se muestre correctamente
