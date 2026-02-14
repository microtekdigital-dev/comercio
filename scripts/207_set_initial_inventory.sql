-- =====================================================
-- Script SIMPLE para establecer inventario inicial
-- =====================================================
-- Versión simplificada que actualiza directamente el stock
-- El trigger automáticamente creará los movimientos
-- =====================================================

-- OPCIÓN 1: Actualizar UN producto específico
-- ⚠️ Reemplaza los valores según tu caso
UPDATE products 
SET stock_quantity = 100  -- Nueva cantidad
WHERE sku = 'PROD-001'    -- SKU del producto
  AND company_id = 'YOUR_COMPANY_ID';  -- ⚠️ REEMPLAZAR

-- OPCIÓN 2: Actualizar MÚLTIPLES productos con CASE
-- ⚠️ Ajusta los SKUs y cantidades según tu inventario
UPDATE products 
SET stock_quantity = CASE sku
  WHEN 'PROD-001' THEN 100
  WHEN 'PROD-002' THEN 50
  WHEN 'PROD-003' THEN 200
  WHEN 'PROD-004' THEN 75
  WHEN 'PROD-005' THEN 150
  -- Agrega más productos aquí...
  ELSE stock_quantity  -- Mantener el stock actual si no está en la lista
END
WHERE company_id = 'YOUR_COMPANY_ID'  -- ⚠️ REEMPLAZAR
  AND sku IN ('PROD-001', 'PROD-002', 'PROD-003', 'PROD-004', 'PROD-005')
  AND track_inventory = true;

-- OPCIÓN 3: Establecer TODO el inventario a CERO (útil para empezar de cero)
-- ⚠️ CUIDADO: Esto pondrá todos los productos en 0
UPDATE products 
SET stock_quantity = 0
WHERE company_id = 'YOUR_COMPANY_ID'  -- ⚠️ REEMPLAZAR
  AND track_inventory = true;

-- =====================================================
-- VERIFICACIÓN: Ver los productos actualizados
-- =====================================================
SELECT 
  sku,
  name,
  stock_quantity,
  updated_at
FROM products
WHERE company_id = 'YOUR_COMPANY_ID'  -- ⚠️ REEMPLAZAR
  AND track_inventory = true
ORDER BY sku;

-- =====================================================
-- VERIFICACIÓN: Ver los movimientos de stock creados
-- =====================================================
SELECT 
  p.sku,
  p.name,
  sm.movement_type,
  sm.quantity,
  sm.stock_before,
  sm.stock_after,
  sm.created_at
FROM stock_movements sm
INNER JOIN products p ON sm.product_id = p.id
WHERE sm.company_id = 'YOUR_COMPANY_ID'  -- ⚠️ REEMPLAZAR
  AND sm.created_at > now() - interval '1 hour'  -- Últimos movimientos
ORDER BY sm.created_at DESC
LIMIT 50;
