# Fix: Órdenes de Compra No Aparecen en Reporte de Liquidación (Problema RLS)

## Problema

Las órdenes de compra que antes aparecían en el reporte de liquidación ahora no se muestran. Esto indica un problema de RLS (Row Level Security).

## Causa Probable

Las políticas RLS de `purchase_orders` y `purchase_order_items` están bloqueando el acceso cuando se ejecuta el reporte desde el servidor (Server Actions).

## Solución Rápida

### Paso 1: Diagnosticar el Problema

Ejecuta este script en Supabase SQL Editor:

```sql
-- Ver en docs-auth/DEBUG_PURCHASE_ORDERS_INVENTORY_REPORT_RLS.sql
```

Busca la sección **"🎯 DIAGNÓSTICO"** al final. Si dice:

```
❌ PROBLEMA RLS: Tienes órdenes pero RLS las bloquea
```

Entonces el problema es RLS y necesitas ejecutar el fix.

### Paso 2: Aplicar el Fix

Ejecuta este script en Supabase SQL Editor:

```sql
-- Ver en docs-auth/FIX_PURCHASE_ORDERS_INVENTORY_REPORT_RLS.sql
```

Este script:
1. ✅ Crea función `get_user_company_id()` con SECURITY DEFINER
2. ✅ Recrea políticas RLS para `purchase_orders`
3. ✅ Recrea políticas RLS para `purchase_order_items`
4. ✅ Asegura que RLS está habilitado

### Paso 3: Verificar

1. Refresca la página de la aplicación
2. Ve a Reporte de Liquidación
3. Selecciona el rango de fechas
4. Genera el reporte
5. Las compras deberían aparecer ahora

## ¿Por Qué Pasó Esto?

### Antes (Funcionaba)
- RLS estaba deshabilitado en `profiles` o `company_users`
- Las políticas RLS podían leer directamente de esas tablas
- Todo funcionaba

### Ahora (No Funciona)
- RLS se habilitó en `profiles` o `company_users`
- Las políticas RLS no pueden leer de esas tablas (bloqueadas por su propio RLS)
- Las políticas fallan y bloquean todo acceso

### Solución
- Crear función `get_user_company_id()` con `SECURITY DEFINER`
- Esta función puede leer `company_users` sin importar RLS
- Las políticas usan esta función en lugar de leer directamente

## Diagnóstico Detallado

### 1. Verificar Estado RLS

```sql
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity = true THEN 'RLS Habilitado'
    ELSE 'RLS Deshabilitado'
  END as estado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('purchase_orders', 'purchase_order_items', 'profiles', 'company_users')
ORDER BY tablename;
```

### 2. Ver Políticas Actuales

```sql
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('purchase_orders', 'purchase_order_items')
ORDER BY tablename, cmd;
```

### 3. Verificar Función Helper

```sql
SELECT 
  proname,
  CASE 
    WHEN prosecdef = true THEN 'SECURITY DEFINER ✅'
    ELSE 'Normal ❌'
  END as tipo
FROM pg_proc
WHERE proname = 'get_user_company_id';
```

Si no existe o no es SECURITY DEFINER, ese es el problema.

### 4. Probar Acceso

```sql
-- Esto debería devolver tus órdenes
SELECT COUNT(*) FROM purchase_orders;

-- Esto debería devolver los items
SELECT COUNT(*) FROM purchase_order_items;
```

Si devuelve 0 pero sabes que tienes órdenes, RLS las está bloqueando.

## Verificación Post-Fix

Después de aplicar el fix, ejecuta:

```sql
-- 1. Verificar función
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'get_user_company_id';
-- Debe mostrar: prosecdef = true

-- 2. Verificar políticas
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('purchase_orders', 'purchase_order_items')
ORDER BY tablename, cmd;
-- Debe mostrar 4 políticas por tabla (SELECT, INSERT, UPDATE, DELETE)

-- 3. Probar acceso
SELECT COUNT(*) FROM purchase_orders WHERE status = 'received';
-- Debe mostrar tus órdenes recibidas

-- 4. Probar items
SELECT COUNT(*) FROM purchase_order_items;
-- Debe mostrar los items de tus órdenes
```

## Troubleshooting

### Si Aún No Aparecen las Compras

1. **Verifica company_id**
   ```sql
   -- Tu company_id
   SELECT company_id FROM company_users WHERE user_id = auth.uid();
   
   -- Company_id de las órdenes
   SELECT DISTINCT company_id, COUNT(*) 
   FROM purchase_orders 
   WHERE status = 'received'
   GROUP BY company_id;
   ```
   
   Si no coinciden, estás viendo otra empresa.

2. **Verifica fechas**
   ```sql
   SELECT order_number, received_date 
   FROM purchase_orders 
   WHERE status = 'received'
   ORDER BY received_date DESC;
   ```
   
   Asegúrate que el rango del reporte incluye estas fechas.

3. **Verifica received_date**
   ```sql
   SELECT order_number, status, received_date
   FROM purchase_orders
   WHERE status = 'received' AND received_date IS NULL;
   ```
   
   Si hay resultados, ejecuta:
   ```sql
   UPDATE purchase_orders
   SET received_date = created_at::date
   WHERE status = 'received' AND received_date IS NULL;
   ```

4. **Revisa logs del servidor**
   - Abre el terminal donde corre `npm run dev`
   - Genera el reporte
   - Busca logs que empiecen con `=== calculatePurchases START ===`
   - Verifica company_id, fechas, y cantidad de órdenes encontradas

## Archivos Relacionados

- ✅ `docs-auth/DEBUG_PURCHASE_ORDERS_INVENTORY_REPORT_RLS.sql` - Diagnóstico
- ✅ `docs-auth/FIX_PURCHASE_ORDERS_INVENTORY_REPORT_RLS.sql` - Fix
- ✅ `lib/actions/inventory-report.ts` - Código con logging
- ✅ `DONDE_VER_LOGS_SERVIDOR.md` - Guía para ver logs
- ✅ `DIAGNOSTICO_SIMPLE_COMPRAS.sql` - Diagnóstico básico

## Resumen

1. **Diagnosticar**: Ejecuta `DEBUG_PURCHASE_ORDERS_INVENTORY_REPORT_RLS.sql`
2. **Fix**: Ejecuta `FIX_PURCHASE_ORDERS_INVENTORY_REPORT_RLS.sql`
3. **Verificar**: Genera el reporte de liquidación
4. **Si falla**: Revisa company_id, fechas, y logs del servidor

## Fecha
2026-02-14
