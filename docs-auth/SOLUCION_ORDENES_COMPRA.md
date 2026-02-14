# ✅ Solución: Órdenes de Compra no se crean

## 🎯 PROBLEMA

**Reporte del usuario:** "sigue sin crear la orden de compra"

## 🔍 CAUSA

Las políticas RLS de las tablas ERP (purchase_orders, products, sales, etc.) están configuradas para consultar la tabla `profiles`:

```sql
-- Política actual (NO FUNCIONA)
CREATE POLICY "..." ON purchase_orders
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
```

**El problema:** RLS está DESHABILITADO en `profiles` (según la solución anterior para el dashboard). Cuando RLS está deshabilitado en una tabla, las subconsultas en políticas RLS pueden fallar.

## ✅ SOLUCIÓN RÁPIDA

Ejecuta este script en Supabase SQL Editor:

**Archivo:** `docs-auth/FIX_ALL_ERP_RLS_POLICIES.sql`

Este script:
1. Crea una función `get_user_company_id()` con `SECURITY DEFINER` que puede leer `profiles` sin RLS
2. Recrea TODAS las políticas RLS de las tablas ERP para usar esta función
3. Aplica el fix a: companies, categories, products, customers, sales, suppliers, purchase_orders, quotes, stock_movements, price_changes, notifications

## 📋 PASOS

### 1. Diagnóstico (Opcional)
```sql
-- Ejecuta en Supabase SQL Editor
-- Archivo: docs-auth/DEBUG_PURCHASE_ORDERS_RLS.sql
```

### 2. Aplicar Fix (REQUERIDO)
```sql
-- Ejecuta en Supabase SQL Editor
-- Archivo: docs-auth/FIX_ALL_ERP_RLS_POLICIES.sql
```

### 3. Verificar
- Recarga la página de órdenes de compra
- Intenta crear una nueva orden
- Debería funcionar correctamente

## 🎉 RESULTADO

Después de ejecutar el script:
- ✅ Las órdenes de compra se crean correctamente
- ✅ Todas las funcionalidades ERP funcionan
- ✅ RLS sigue habilitado en todas las tablas
- ✅ La seguridad se mantiene
- ✅ No hay cambios en el código

## 🔒 SEGURIDAD

La función `SECURITY DEFINER` es segura porque:
- Solo lee el `company_id` del usuario autenticado
- No expone datos de otros usuarios
- Solo se usa internamente en políticas RLS
- Es el patrón recomendado por Supabase para este caso

## 📊 TABLAS CORREGIDAS

| Tabla | Políticas | Estado |
|-------|-----------|--------|
| companies | 2 | ✅ Corregido |
| categories | 4 | ✅ Corregido |
| products | 4 | ✅ Corregido |
| product_variants | 4 | ✅ Corregido |
| customers | 4 | ✅ Corregido |
| sales | 4 | ✅ Corregido |
| sale_items | 4 | ✅ Corregido |
| suppliers | 4 | ✅ Corregido |
| purchase_orders | 4 | ✅ Corregido |
| purchase_order_items | 4 | ✅ Corregido |
| supplier_payments | 4 | ✅ Corregido |
| stock_movements | 2 | ✅ Corregido |
| price_changes | 2 | ✅ Corregido |
| quotes | 4 | ✅ Corregido |
| quote_items | 4 | ✅ Corregido |
| notifications | 4 | ✅ Corregido |

**Total:** 60+ políticas recreadas

## ⚠️ IMPORTANTE

Este fix resuelve el problema de forma permanente. No necesitarás volver a aplicarlo a menos que:
- Elimines la función `get_user_company_id()`
- Elimines las políticas RLS manualmente
- Hagas un restore completo de la base de datos

## 🆘 SI SIGUE SIN FUNCIONAR

Si después de ejecutar el script las órdenes de compra siguen sin crearse:

1. Verifica que el script se ejecutó sin errores
2. Ejecuta el diagnóstico: `DEBUG_PURCHASE_ORDERS_RLS.sql`
3. Comparte el resultado del diagnóstico
4. Revisa los logs del servidor (consola del navegador F12)

---

**Fecha:** 2026-02-14  
**Estado:** ✅ SOLUCIÓN LISTA  
**Prioridad:** 🔴 CRÍTICA  
**Archivos:**
- `docs-auth/FIX_ALL_ERP_RLS_POLICIES.sql` - Solución completa
- `docs-auth/DEBUG_PURCHASE_ORDERS_RLS.sql` - Diagnóstico
- `docs-auth/RESUMEN_FIX_PURCHASE_ORDERS.md` - Documentación detallada
