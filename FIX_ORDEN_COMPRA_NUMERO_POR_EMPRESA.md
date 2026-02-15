# Fix: Órdenes de Compra - Número por Empresa

## Problema
Las órdenes de compra tenían una restricción única global en `order_number`, lo que impedía que diferentes empresas usaran el mismo número de orden. Esto era inconsistente con el comportamiento de los productos, que sí permiten números duplicados entre empresas.

## Solución Implementada
Se modificó la restricción única de la tabla `purchase_orders` para que sea por empresa:
- **Antes**: `UNIQUE (order_number)` - global
- **Después**: `UNIQUE (company_id, order_number)` - por empresa

## Archivo de Migración
`scripts/209_fix_purchase_order_unique_constraint.sql`

## Cambios Realizados
1. Se eliminó la restricción única global en `order_number`
2. Se creó una nueva restricción única compuesta `(company_id, order_number)`
3. Se agregó manejo de errores para evitar conflictos durante la migración

## Resultado
Ahora cada empresa puede usar sus propios números de orden de compra de forma independiente, igual que con los productos.

## Fecha
2026-02-14
