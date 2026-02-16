# Fix: Valor de Compras en Liquidación de Inventario

## Problema Reportado

En el reporte de liquidación de inventario, el "Valor Total de Compras" se mostraba igual que el "Valor Total de Ventas".

## Causa Raíz

En el archivo `lib/actions/inventory-liquidation-advanced.ts`, línea 33, el cálculo del `totalPurchaseValue` en el resumen estaba usando la fuente de datos incorrecta:

```typescript
// INCORRECTO
totalPurchaseValue: byProduct.reduce((sum, p) => sum + (p.value || 0), 0),
```

El problema era que:
1. `byProduct` contiene movimientos de VENTAS (no de compras)
2. El campo `value` en `byProduct` representa `quantity * unit_price` (precio de venta)
3. Por lo tanto, estaba sumando valores de venta en lugar de valores de compra

## Solución Aplicada

Se corrigió para usar `byCategory` que sí calcula correctamente el `totalPurchaseValue` basado en las órdenes de compra recibidas:

```typescript
// CORRECTO
totalPurchaseValue: byCategory.reduce((sum, c) => sum + c.totalPurchaseValue, 0),
```

## Cómo Funciona Ahora

El `totalPurchaseValue` se calcula correctamente de la siguiente manera:

1. En `getCategoryLiquidation()`:
   - Se obtienen las órdenes de compra con estado "received" del período
   - Se suman los items: `quantity * unit_cost` de cada orden
   - Se agrupa por categoría en `totalPurchaseValue`

2. En el resumen general:
   - Se suman todos los `totalPurchaseValue` de todas las categorías
   - Esto da el valor total real de las compras del período

## Valores Correctos

Ahora el reporte muestra:
- **Valor Total de Compras**: Suma de (cantidad × costo unitario) de todas las órdenes de compra recibidas
- **Valor Total de Ventas**: Suma de (cantidad × precio de venta) de todas las ventas completadas
- **Ganancia Total**: Valor de Ventas - Valor de Compras
- **Margen de Ganancia**: (Ganancia / Ventas) × 100

## Archivos Modificados

- `lib/actions/inventory-liquidation-advanced.ts` - Línea 33

## Fecha de Corrección

2026-02-16
