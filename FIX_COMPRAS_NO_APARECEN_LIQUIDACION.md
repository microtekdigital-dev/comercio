# Fix: Compras No Aparecen en Reporte de Liquidación

## Problema
Las órdenes de compra recibidas no se reflejan en el reporte de liquidación de inventario.

## Diagnóstico

### Paso 1: Ejecutar Script de Diagnóstico

Ejecuta el script `docs-auth/DEBUG_PURCHASE_ORDERS_LIQUIDATION.sql` en Supabase SQL Editor.

Este script te mostrará:
1. Todas las órdenes recibidas
2. Los items de esas órdenes
3. Órdenes en un rango de fechas específico
4. El tipo de dato de `received_date`
5. Órdenes con inconsistencias

### Paso 2: Verificar Logs en la Consola

Con el código actualizado, ahora verás logs detallados en la consola del navegador cuando generes el reporte:

```
=== calculatePurchases START ===
Company ID: xxx
Date range: 2026-01-01 to 2026-02-28
Purchase orders found: X
Items returned: Y
=== calculatePurchases END ===
```

### Paso 3: Verificar Condiciones

Para que una orden aparezca en el reporte, debe cumplir TODAS estas condiciones:

1. ✅ `status = 'received'`
2. ✅ `received_date IS NOT NULL`
3. ✅ `received_date >= fecha_inicio`
4. ✅ `received_date <= fecha_fin`
5. ✅ `company_id` coincide con tu empresa

## Causas Comunes

### 1. Orden No Recibida
**Síntoma**: La orden está en estado "Pendiente" o "Confirmada"

**Solución**:
1. Ir a Órdenes de Compra
2. Abrir la orden
3. Hacer clic en "Recibir Mercadería"
4. Confirmar las cantidades
5. Guardar

### 2. Fecha de Recepción Fuera del Rango
**Síntoma**: La orden está recibida pero la fecha no coincide con el período del reporte

**Solución**:
- Verificar la fecha de recepción de la orden
- Ajustar el rango de fechas del reporte

### 3. received_date es NULL
**Síntoma**: La orden tiene status='received' pero received_date es NULL

**Solución**: Ejecutar este SQL para corregir:
```sql
-- Ver órdenes con problema
SELECT id, order_number, status, received_date, created_at
FROM purchase_orders
WHERE status = 'received' AND received_date IS NULL;

-- Corregir usando created_at como fallback
UPDATE purchase_orders
SET received_date = created_at::date
WHERE status = 'received' AND received_date IS NULL;
```

### 4. Problema de Timezone
**Síntoma**: Las fechas no coinciden debido a diferencias de zona horaria

**Solución**: El código ya maneja esto correctamente usando `.split('T')[0]` para obtener solo la fecha.

### 5. Filtros Aplicados
**Síntoma**: Hay compras pero no aparecen por filtros de categoría o producto

**Solución**:
- Quitar los filtros de categoría y producto
- Generar el reporte sin filtros
- Verificar si aparecen las compras

## Cambios Implementados

### 1. Logging Mejorado
Se agregó logging detallado en `lib/actions/inventory-report.ts`:
- Muestra el company_id
- Muestra el rango de fechas
- Muestra cuántas órdenes se encontraron
- Muestra los datos completos de las órdenes
- Muestra cuántos items se encontraron

### 2. Script de Diagnóstico
Se creó `docs-auth/DEBUG_PURCHASE_ORDERS_LIQUIDATION.sql` para diagnosticar problemas en la base de datos.

## Cómo Probar

### 1. Crear una Orden de Prueba
```
1. Ir a Órdenes de Compra > Nueva Orden
2. Agregar productos
3. Guardar la orden
4. Abrir la orden
5. Hacer clic en "Recibir Mercadería"
6. Confirmar recepción
7. Anotar la fecha de recepción
```

### 2. Generar Reporte
```
1. Ir a Reporte de Liquidación
2. Seleccionar rango de fechas que incluya la fecha de recepción
3. Hacer clic en "Generar Reporte"
4. Verificar que aparezca la compra
```

### 3. Revisar Logs
```
1. Abrir DevTools (F12)
2. Ir a la pestaña Console
3. Buscar "=== calculatePurchases START ==="
4. Verificar los datos mostrados
```

## Verificación Final

Ejecuta este SQL para verificar que todo está correcto:

```sql
-- Ver resumen de órdenes recibidas por mes
SELECT 
  DATE_TRUNC('month', received_date) as mes,
  COUNT(*) as ordenes_recibidas,
  SUM((
    SELECT SUM(quantity * unit_cost)
    FROM purchase_order_items
    WHERE purchase_order_id = po.id
  )) as valor_total
FROM purchase_orders po
WHERE status = 'received'
  AND received_date IS NOT NULL
GROUP BY DATE_TRUNC('month', received_date)
ORDER BY mes DESC;
```

## Próximos Pasos

Si después de seguir estos pasos las compras aún no aparecen:

1. Compartir los logs de la consola
2. Compartir el resultado del script de diagnóstico
3. Verificar que la orden realmente existe y está recibida
4. Verificar que el rango de fechas es correcto

## Archivos Modificados

- ✅ `lib/actions/inventory-report.ts` - Agregado logging detallado
- ✅ `docs-auth/DEBUG_PURCHASE_ORDERS_LIQUIDATION.sql` - Script de diagnóstico
- ✅ `FIX_COMPRAS_NO_APARECEN_LIQUIDACION.md` - Esta guía

## Fecha
2026-02-14
