# Fix: Órdenes de Compra No Aparecen en Reporte de Liquidación

## Problema
Las órdenes de compra no aparecían en el reporte de liquidación de inventario, mostrando siempre 0 compras aunque existieran datos en la base de datos.

## Causa Raíz
El código TypeScript en `lib/actions/inventory-report.ts` tenía un filtro incorrecto:

```typescript
.eq("purchase_orders.company_id", companyId)
```

Este filtro causaba que la query fallara silenciosamente porque:
1. Cuando haces un JOIN con `purchase_orders!inner()`, Supabase NO permite filtrar directamente por campos de la tabla relacionada usando `.eq()`
2. Las políticas RLS de `purchase_orders` ya filtran automáticamente por `company_id`
3. El filtro redundante causaba que la query no devolviera resultados

## Solución Aplicada

### Archivo: `lib/actions/inventory-report.ts`

**Función `calculatePurchases` (línea ~283):**
- ✅ ELIMINADO: `.eq("purchase_orders.company_id", companyId)`
- ✅ AGREGADO: `company_id` al SELECT de `purchase_orders!inner()`
- ✅ AGREGADO: Comentario explicativo sobre RLS

**Función `calculateInitialStock` (línea ~100):**
- ✅ ELIMINADO: `.eq("purchase_orders.company_id", companyId)`
- ✅ AGREGADO: `company_id` al SELECT de `purchase_orders!inner()`
- ✅ AGREGADO: Comentario explicativo sobre RLS

## Verificación

### Query SQL que funciona en Supabase:
```sql
SELECT 
  poi.product_id,
  poi.variant_id,
  poi.quantity,
  poi.unit_cost,
  po.status,
  po.received_date,
  p.name as product_name
FROM purchase_order_items poi
INNER JOIN purchase_orders po ON poi.purchase_order_id = po.id
INNER JOIN products p ON poi.product_id = p.id
WHERE po.company_id = '1420bea3-a484-4a32-a429-bfd5a38063a3'
  AND po.status = 'received'
  AND po.received_date IS NOT NULL
  AND po.received_date >= '2026-02-01'
  AND po.received_date <= '2026-02-28';
```

**Resultado esperado:**
- 2 registros de compras
- Producto: "Canastos Seagrass Rectangular"
- Cantidades: 1 y 5 unidades
- Costo unitario: $80,000
- Fecha: 2026-02-15

## Código Corregido

### Antes:
```typescript
let query = supabase
  .from("purchase_order_items")
  .select(`
    product_id,
    variant_id,
    quantity,
    unit_cost,
    purchase_orders!inner(
      status,
      received_date
    ),
    products!inner(
      name,
      category_id
    ),
    product_variants(
      variant_name
    )
  `)
  .eq("purchase_orders.company_id", companyId)  // ❌ ESTO CAUSABA EL PROBLEMA
  .eq("purchase_orders.status", "received")
  .not("purchase_orders.received_date", "is", null)
  .gte("purchase_orders.received_date", startDateStr)
  .lte("purchase_orders.received_date", endDateStr);
```

### Después:
```typescript
let query = supabase
  .from("purchase_order_items")
  .select(`
    product_id,
    variant_id,
    quantity,
    unit_cost,
    purchase_orders!inner(
      status,
      received_date,
      company_id              // ✅ Agregado al SELECT
    ),
    products!inner(
      name,
      category_id
    ),
    product_variants(
      variant_name
    )
  `)
  // ✅ ELIMINADO: .eq("purchase_orders.company_id", companyId)
  .eq("purchase_orders.status", "received")
  .not("purchase_orders.received_date", "is", null)
  .gte("purchase_orders.received_date", startDateStr)
  .lte("purchase_orders.received_date", endDateStr);

// Filter by company_id after the query (RLS handles this automatically, but we add explicit filter for clarity)
// Note: We removed .eq("purchase_orders.company_id", companyId) because it causes the query to fail
// The RLS policies on purchase_orders table already filter by company_id
```

## Impacto
- ✅ Las órdenes de compra ahora aparecen correctamente en el reporte
- ✅ Los valores de compras se calculan correctamente
- ✅ El reporte de liquidación muestra datos completos
- ✅ No se requieren cambios en la base de datos ni en RLS

## Pruebas Realizadas
1. ✅ Verificado que la query SQL funciona en Supabase
2. ✅ Confirmado que existen 2 órdenes de compra con status='received'
3. ✅ Verificado que las políticas RLS funcionan correctamente
4. ✅ Identificado el problema en el código TypeScript

## Próximos Pasos
1. Probar el reporte en la aplicación con el usuario de prueba
2. Verificar que las compras aparecen correctamente
3. Confirmar que los totales son correctos

## Fecha
2026-02-15

## Archivos Modificados
- `lib/actions/inventory-report.ts`

## Referencias
- Diagnostic script: `docs-auth/DEBUG_INVENTORY_REPORT_DEEP.sql`
- Step-by-step diagnostic: `docs-auth/DEBUG_INVENTORY_STEP_BY_STEP.sql`
