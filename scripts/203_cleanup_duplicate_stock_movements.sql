-- =====================================================
-- Limpieza: Eliminar movimientos de stock duplicados
-- =====================================================
-- Este script elimina registros duplicados en stock_movements
-- que fueron creados por el trigger automático antes de deshabilitarlo
-- =====================================================

-- Paso 1: Identificar duplicados (para revisión)
-- Ejecuta esto primero para ver cuántos duplicados tienes
SELECT 
  company_id,
  product_id,
  variant_id,
  movement_type,
  quantity,
  purchase_order_id,
  sale_id,
  created_at::date as fecha,
  COUNT(*) as cantidad_duplicados
FROM stock_movements
GROUP BY 
  company_id,
  product_id,
  variant_id,
  movement_type,
  quantity,
  purchase_order_id,
  sale_id,
  created_at::date
HAVING COUNT(*) > 1
ORDER BY cantidad_duplicados DESC;

-- =====================================================
-- Paso 2: Eliminar duplicados manteniendo el más reciente
-- =====================================================
-- ADVERTENCIA: Este comando eliminará datos. Asegúrate de tener un backup.
-- =====================================================

-- Eliminar duplicados de órdenes de compra
DELETE FROM stock_movements
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY 
          company_id,
          product_id,
          COALESCE(variant_id::text, 'null'),
          purchase_order_id,
          quantity,
          DATE(created_at)
        ORDER BY created_at DESC
      ) as rn
    FROM stock_movements
    WHERE purchase_order_id IS NOT NULL
  ) t
  WHERE rn > 1
);

-- Eliminar duplicados de ventas
DELETE FROM stock_movements
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY 
          company_id,
          product_id,
          COALESCE(variant_id::text, 'null'),
          sale_id,
          quantity,
          DATE(created_at)
        ORDER BY created_at DESC
      ) as rn
    FROM stock_movements
    WHERE sale_id IS NOT NULL
  ) t
  WHERE rn > 1
);

-- Eliminar duplicados de ajustes manuales (sin purchase_order_id ni sale_id)
DELETE FROM stock_movements
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY 
          company_id,
          product_id,
          COALESCE(variant_id::text, 'null'),
          movement_type,
          quantity,
          DATE(created_at)
        ORDER BY created_at DESC
      ) as rn
    FROM stock_movements
    WHERE purchase_order_id IS NULL 
      AND sale_id IS NULL
  ) t
  WHERE rn > 1
);

-- =====================================================
-- Paso 3: Verificar resultados
-- =====================================================

-- Ver cuántos registros quedan
SELECT 
  movement_type,
  COUNT(*) as total_movimientos
FROM stock_movements
GROUP BY movement_type
ORDER BY movement_type;

-- Verificar que no quedan duplicados
SELECT 
  company_id,
  product_id,
  variant_id,
  movement_type,
  quantity,
  purchase_order_id,
  sale_id,
  created_at::date as fecha,
  COUNT(*) as cantidad
FROM stock_movements
GROUP BY 
  company_id,
  product_id,
  variant_id,
  movement_type,
  quantity,
  purchase_order_id,
  sale_id,
  created_at::date
HAVING COUNT(*) > 1;

-- Si este último query no devuelve resultados, ¡la limpieza fue exitosa!
