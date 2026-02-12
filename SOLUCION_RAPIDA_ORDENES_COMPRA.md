# Solución Rápida: Error de Órdenes de Compra Duplicadas

## 🚨 Error Actual

```
duplicate key value violates unique constraint "purchase_orders_order_number_key"
```

## ✅ Solución en 3 Pasos

### Paso 1: Ejecutar Script SQL (URGENTE)

1. Abre **Supabase Dashboard** → **SQL Editor**
2. Copia y pega el contenido de: `docs-auth/EMERGENCY_FIX_PURCHASE_ORDERS.sql`
3. Haz clic en **Run**

O ejecuta esto directamente:

```sql
-- Eliminar trigger problemático
DROP TRIGGER IF EXISTS auto_purchase_order_number ON purchase_orders;
DROP FUNCTION IF EXISTS generate_purchase_order_number() CASCADE;

-- Hacer order_number nullable
ALTER TABLE purchase_orders ALTER COLUMN order_number DROP NOT NULL;
```

### Paso 2: Reiniciar la Aplicación

```bash
# Detener el servidor
Ctrl + C

# Limpiar caché de Next.js
rm -rf .next

# Reiniciar
npm run dev
```

### Paso 3: Probar

Intenta crear una nueva orden de compra. Debería funcionar.

## 🔍 Verificar que Funcionó

Ejecuta en Supabase SQL Editor:

```sql
-- Debe retornar 0 filas (trigger eliminado)
SELECT * FROM pg_trigger WHERE tgname = 'auto_purchase_order_number';

-- Debe retornar 0 filas (sin duplicados)
SELECT order_number, COUNT(*)
FROM purchase_orders
GROUP BY order_number
HAVING COUNT(*) > 1;
```

## 📝 Qué Cambió

**Antes:**
- Trigger SQL generaba números automáticamente
- Race condition causaba duplicados

**Ahora:**
- La aplicación genera números con lógica de reintentos
- Si hay duplicado, reintenta automáticamente hasta 10 veces
- Más confiable y fácil de debuggear

## 🆘 Si Aún Falla

1. **Verifica que el código se actualizó:**
   - Abre `lib/actions/purchase-orders.ts`
   - Busca `maxAttempts = 10`
   - Si no está, el código no se actualizó

2. **Limpia duplicados manualmente:**
```sql
-- Ver duplicados
SELECT order_number, array_agg(id) as ids
FROM purchase_orders
GROUP BY order_number
HAVING COUNT(*) > 1;

-- Renombrar duplicados
UPDATE purchase_orders
SET order_number = order_number || '-FIX'
WHERE id = 'ID_DEL_DUPLICADO_AQUI';
```

3. **Verifica permisos RLS:**
```sql
-- Ver políticas de purchase_orders
SELECT * FROM pg_policies WHERE tablename = 'purchase_orders';
```

## 📚 Documentación Completa

- `docs-auth/FIX_PURCHASE_ORDER_DUPLICATES.md` - Explicación detallada
- `scripts/170_fix_purchase_order_number_race_condition.sql` - Script completo
- `docs-auth/EMERGENCY_FIX_PURCHASE_ORDERS.sql` - Fix de emergencia

## ✨ Resultado Esperado

Después de aplicar la solución:
- ✅ Crear órdenes funciona sin errores
- ✅ Números únicos garantizados
- ✅ Múltiples usuarios pueden crear órdenes simultáneamente
- ✅ Reintentos automáticos si hay conflicto
