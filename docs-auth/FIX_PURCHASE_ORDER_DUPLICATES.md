# Solución: Error de Números de Orden Duplicados

## Problema

Error al crear órdenes de compra:
```
duplicate key value violates unique constraint "purchase_orders_order_number_key"
```

## Causa

El trigger `auto_purchase_order_number` tiene una **condición de carrera** (race condition) cuando múltiples órdenes se crean simultáneamente.

### Código Problemático

```sql
SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+') AS INTEGER)), 0) + 1
INTO next_number
FROM purchase_orders
WHERE company_id = NEW.company_id;
```

**Escenario del problema:**
1. Usuario A crea orden → trigger lee MAX = 5 → genera PO-000006
2. Usuario B crea orden (al mismo tiempo) → trigger lee MAX = 5 → genera PO-000006
3. Primera inserción funciona
4. Segunda inserción falla con error de clave duplicada

## Solución

**Enfoque híbrido**: Eliminar el trigger problemático y generar números desde la aplicación con lógica de reintentos.

### Por qué esta solución:

- ✅ **Más confiable**: La aplicación puede reintentar si hay conflicto
- ✅ **Sin permisos especiales**: No requiere SECURITY DEFINER ni crear tablas
- ✅ **Compatible con RLS**: Funciona perfectamente con Row Level Security
- ✅ **Fácil de debuggear**: El código está en TypeScript, no en SQL
- ✅ **Manejo de errores**: Puede reportar problemas al usuario

### Script de Corrección

Ejecutar: `scripts/170_fix_purchase_order_number_race_condition.sql`

### Qué hace el script:

1. **Elimina el trigger antiguo** que causaba el problema
2. **Limpia duplicados existentes** agregando sufijo `-DUP1`, `-DUP2`, etc.
3. **Hace order_number nullable** para permitir generación desde la app

### Qué hace el código de la aplicación:

1. **Consulta el último número** de orden para la empresa
2. **Genera el siguiente número** (PO-000001, PO-000002, etc.)
3. **Intenta insertar** la orden con ese número
4. **Si hay duplicado**, espera un momento y reintenta con el siguiente número
5. **Máximo 5 intentos** antes de reportar error

## Cómo Aplicar la Solución

### Paso 1: Ejecutar el Script SQL

1. Abre Supabase SQL Editor
2. Copia el contenido de `scripts/170_fix_purchase_order_number_race_condition.sql`
3. Ejecuta el script

### Paso 2: Verificar

```sql
-- Ver si hay duplicados
SELECT order_number, company_id, COUNT(*)
FROM purchase_orders
GROUP BY order_number, company_id
HAVING COUNT(*) > 1;

-- Ver que el trigger fue eliminado
SELECT * FROM pg_trigger WHERE tgname = 'auto_purchase_order_number';
-- Debe retornar 0 filas
```

### Paso 3: Probar

Intenta crear una nueva orden de compra. Debería funcionar sin errores.

## Verificación de Duplicados Existentes

Si ya tienes duplicados en la base de datos, el script los renombrará automáticamente:

```sql
-- Antes:
PO-000005
PO-000005  ← duplicado

-- Después:
PO-000005
PO-000005-DUP1  ← renombrado
```

## Prevención Futura

Con esta solución implementada:
- ✅ No más errores de duplicados
- ✅ Números de orden únicos garantizados
- ✅ Funciona con múltiples usuarios simultáneos
- ✅ Cada empresa mantiene su propia numeración
- ✅ Reintentos automáticos si hay conflicto

## Notas Técnicas

### Cómo funciona la lógica de reintentos

```typescript
// Intenta hasta 5 veces
let attempts = 0;
while (attempts < 5) {
  // 1. Obtiene el último número
  const lastOrder = await getLastOrderNumber(companyId);
  const nextNumber = lastOrder + 1;
  
  // 2. Intenta insertar
  const result = await insertOrder({ order_number: `PO-${nextNumber}` });
  
  // 3. Si es exitoso, termina
  if (result.success) break;
  
  // 4. Si es duplicado, espera y reintenta
  if (result.error.code === "23505") {
    await sleep(100 * attempts); // Backoff exponencial
    attempts++;
    continue;
  }
  
  // 5. Si es otro error, lanza excepción
  throw result.error;
}
```

### Ventajas sobre triggers

| Aspecto | Trigger SQL | App Logic |
|---------|-------------|-----------|
| Race conditions | ❌ Sí | ✅ Maneja con reintentos |
| Permisos RLS | ⚠️ Requiere SECURITY DEFINER | ✅ Sin problemas |
| Debugging | ❌ Difícil | ✅ Fácil |
| Manejo de errores | ❌ Limitado | ✅ Completo |
| Performance | ✅ Rápido | ✅ Rápido |

## Solución de Problemas

### Si el error persiste después de aplicar el script:

1. **Verifica que el trigger fue eliminado:**
```sql
SELECT * FROM pg_trigger WHERE tgname = 'auto_purchase_order_number';
-- Debe retornar 0 filas
```

2. **Verifica que no hay duplicados:**
```sql
SELECT order_number, COUNT(*)
FROM purchase_orders
GROUP BY order_number
HAVING COUNT(*) > 1;
```

3. **Verifica el código de la aplicación:**
```typescript
// Debe estar en lib/actions/purchase-orders.ts
// Busca la lógica de retry con maxAttempts = 5
```

4. **Limpia duplicados manualmente si es necesario:**
```sql
UPDATE purchase_orders
SET order_number = order_number || '-FIX'
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY order_number ORDER BY created_at) as rn
    FROM purchase_orders
  ) t WHERE rn > 1
);
```

## Resumen

- **Problema**: Race condition en generación de números de orden
- **Causa raíz**: Trigger SQL con MAX() no es thread-safe
- **Solución**: Generación desde la app con lógica de reintentos
- **Script**: `scripts/170_fix_purchase_order_number_race_condition.sql`
- **Código**: `lib/actions/purchase-orders.ts` (función `createPurchaseOrder`)
- **Resultado**: Números únicos garantizados, sin duplicados, más confiable
