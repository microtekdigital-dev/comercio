# Fix: Duplicación en Historial de Stock

## Problema Identificado

Cuando se recibe mercadería de una orden de compra, se registran **dos movimientos** en el historial de stock:

1. ✅ **Correcto**: `Compra Automático` - Registrado manualmente por el código
2. ❌ **Duplicado**: `Ajuste + Manual` - Registrado automáticamente por un trigger de base de datos

### Ejemplo del problema:
```
12/02/2026 12:07:29 | Compra Automático | Auricular Gamer Razer Hammerhead | +130 | 31 | Master | Orden de Compra | Recepción de mercadería de orden de compra
12/02/2026 12:07:29 | Ajuste + Manual   | Auricular Gamer Razer Hammerhead | +130 | 31 | Master | - | Ajuste manual de inventario
```

## Causa Raíz

El trigger `track_product_stock_changes` en la base de datos registra automáticamente **cualquier cambio** en la columna `stock_quantity` de la tabla `products` como un "ajuste manual".

Cuando la función `receiveItems()` en `lib/actions/purchase-orders.ts` actualiza el stock:

1. Primero registra manualmente el movimiento con tipo `purchase` ✅
2. Luego actualiza `products.stock_quantity`
3. El trigger detecta el cambio y crea otro registro con tipo `adjustment_in` ❌

## Solución

Hacer el trigger más inteligente para que **detecte duplicados** antes de registrar. El trigger verificará si ya existe un movimiento reciente (últimos 3 segundos) con el mismo producto, cantidad y stock final. Si existe, no creará un duplicado.

Esto permite:
- ✅ Registrar automáticamente ajustes manuales de stock (cuando editas directamente el producto)
- ✅ Evitar duplicados cuando el código ya registró el movimiento (órdenes de compra, ventas, etc.)

### Script de corrección

Ejecutar el script completo en `scripts/180_fix_duplicate_stock_movements.sql` que incluye:

```sql
-- Función mejorada que detecta duplicados
CREATE OR REPLACE FUNCTION log_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
  v_recent_movement_count INTEGER;
BEGIN
  -- Verificar si ya existe un movimiento reciente (últimos 3 segundos)
  SELECT COUNT(*)
  INTO v_recent_movement_count
  FROM stock_movements
  WHERE product_id = NEW.id
    AND stock_after = v_stock_after
    AND ABS(quantity) = ABS(v_quantity)
    AND created_at > NOW() - INTERVAL '3 seconds';
  
  -- Si ya existe, no crear duplicado
  IF v_recent_movement_count > 0 THEN
    RETURN NEW;
  END IF;
  
  -- Registrar el movimiento solo si no es duplicado...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Pasos para Aplicar la Solución

### 1. Ejecutar el Script SQL

Ve a tu proyecto en Supabase:
1. Abre el **SQL Editor**
2. Copia y pega el contenido del archivo `scripts/180_fix_duplicate_stock_movements.sql`
3. Ejecuta el script

### 2. Verificar la Solución

Después de ejecutar el script:

1. **Prueba 1: Orden de compra** (no debe duplicar)
   - Crea una nueva orden de compra
   - Recibe la mercadería
   - Ve al historial de stock del producto
   - Verifica que solo aparezca **un movimiento** de tipo "Compra"

2. **Prueba 2: Ajuste manual** (debe funcionar)
   - Ve a un producto
   - Edita manualmente el stock (ej: cambia de 100 a 110)
   - Ve al historial de stock
   - Verifica que aparezca **un movimiento** de tipo "Ajuste +"

## Movimientos que se Registran Automáticamente

Después de aplicar el fix, estos son los movimientos que se registran desde el código:

| Acción | Tipo de Movimiento | Función |
|--------|-------------------|---------|
| Recibir orden de compra | `purchase` | `receiveItems()` |
| Completar venta | `sale` | `createSale()` |
| Ajuste manual de stock | `adjustment_in` / `adjustment_out` | `createStockAdjustment()` |
| Devolución de cliente | `return_in` | (futuro) |
| Devolución a proveedor | `return_out` | (futuro) |

## Limpieza de Datos (Opcional)

Si quieres eliminar los movimientos duplicados existentes, puedes ejecutar:

```sql
-- Ver movimientos duplicados
SELECT 
  sm1.id,
  sm1.product_id,
  p.name as product_name,
  sm1.movement_type,
  sm1.quantity,
  sm1.created_at,
  sm1.notes
FROM stock_movements sm1
JOIN products p ON p.id = sm1.product_id
WHERE sm1.movement_type = 'adjustment_in'
  AND sm1.notes = 'Ajuste manual de inventario'
  AND EXISTS (
    SELECT 1 FROM stock_movements sm2
    WHERE sm2.product_id = sm1.product_id
      AND sm2.movement_type = 'purchase'
      AND sm2.purchase_order_id IS NOT NULL
      AND sm2.created_at::date = sm1.created_at::date
      AND ABS(EXTRACT(EPOCH FROM (sm2.created_at - sm1.created_at))) < 5
  )
ORDER BY sm1.created_at DESC;

-- CUIDADO: Solo ejecuta esto después de revisar los resultados de arriba
-- Eliminar movimientos duplicados de tipo adjustment_in que coinciden con purchases
DELETE FROM stock_movements
WHERE id IN (
  SELECT sm1.id
  FROM stock_movements sm1
  WHERE sm1.movement_type = 'adjustment_in'
    AND sm1.notes = 'Ajuste manual de inventario'
    AND EXISTS (
      SELECT 1 FROM stock_movements sm2
      WHERE sm2.product_id = sm1.product_id
        AND sm2.movement_type = 'purchase'
        AND sm2.purchase_order_id IS NOT NULL
        AND sm2.created_at::date = sm1.created_at::date
        AND ABS(EXTRACT(EPOCH FROM (sm2.created_at - sm1.created_at))) < 5
    )
);
```

## Resultado Esperado

Después de aplicar el fix:
- ✅ Un solo movimiento por cada recepción de mercadería (no duplicados)
- ✅ Los ajustes manuales de stock siguen funcionando correctamente
- ✅ Historial de stock limpio y preciso
- ✅ El trigger detecta y previene duplicados automáticamente

## Cómo Funciona la Detección de Duplicados

El trigger mejorado verifica antes de crear un registro:

1. ¿Existe un movimiento en los últimos 3 segundos?
2. ¿Del mismo producto?
3. ¿Con la misma cantidad?
4. ¿Con el mismo stock final?

Si todas las respuestas son SÍ → No crea duplicado
Si alguna respuesta es NO → Crea el movimiento (es un ajuste manual real)

## Archivos Relacionados

- `scripts/180_fix_duplicate_stock_movements.sql` - Script de solución
- `scripts/140_create_stock_history.sql` - Script original con el trigger
- `lib/actions/purchase-orders.ts` - Función `receiveItems()`
- `lib/actions/stock-movements.ts` - Funciones de gestión de stock
