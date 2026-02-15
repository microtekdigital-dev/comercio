# Fix: Órdenes de Compra no Aparecen en Reporte de Liquidación

## Problema
Las órdenes de compra marcadas como "Recibidas" no aparecían en el Reporte de Liquidación de Inventario, a pesar de tener el estado correcto y fecha de recepción.

## Causa Raíz
El problema estaba en la comparación de fechas en las consultas de Supabase:

1. El campo `received_date` en la base de datos es tipo `DATE` (solo fecha, sin hora)
2. El código usaba `toISOString()` que genera timestamps completos: `2026-02-14T12:30:00.000Z`
3. La comparación entre `DATE` y timestamp con hora fallaba o daba resultados incorrectos

## Solución Implementada

### Archivos Modificados
- `lib/actions/inventory-report.ts`

### Cambios Realizados

#### 1. Función `calculatePurchases`
**Antes:**
```typescript
.gte("purchase_orders.received_date", startDate.toISOString())
.lte("purchase_orders.received_date", endDate.toISOString());
```

**Después:**
```typescript
const startDateStr = startDate.toISOString().split('T')[0];
const endDateStr = endDate.toISOString().split('T')[0];

.not("purchase_orders.received_date", "is", null)
.gte("purchase_orders.received_date", startDateStr)
.lte("purchase_orders.received_date", endDateStr);
```

#### 2. Función `calculateInitialStock`
**Antes:**
```typescript
.lt("purchase_orders.received_date", startDate.toISOString());
```

**Después:**
```typescript
const startDateStr = startDate.toISOString().split('T')[0];

.not("purchase_orders.received_date", "is", null)
.lt("purchase_orders.received_date", startDateStr);
```

#### 3. Función `calculateSales`
**Antes:**
```typescript
.gte("sales.sale_date", startDate.toISOString())
.lte("sales.sale_date", endDate.toISOString());
```

**Después:**
```typescript
const startDateStr = startDate.toISOString().split('T')[0];
const endDateStr = endDate.toISOString().split('T')[0];

.gte("sales.sale_date", startDateStr)
.lte("sales.sale_date", endDateStr);
```

## Mejoras Adicionales
- Se agregó filtro explícito `.not("purchase_orders.received_date", "is", null)` para evitar incluir órdenes sin fecha de recepción
- Se agregó script de diagnóstico: `docs-auth/DEBUG_PURCHASE_ORDERS_INVENTORY_REPORT.sql`

## Resultado
Ahora las órdenes de compra recibidas aparecen correctamente en el Reporte de Liquidación de Inventario cuando:
1. Tienen estado = "received"
2. Tienen una fecha de recepción válida
3. La fecha de recepción está dentro del período seleccionado

## Cómo Verificar
1. Ir a Órdenes de Compra
2. Verificar que las órdenes tengan estado "Recibida"
3. Ir a Reporte de Liquidación de Inventario
4. Seleccionar un período que incluya las fechas de recepción
5. Las compras ahora deben aparecer en la columna "Compras"

## Fecha
2026-02-14
