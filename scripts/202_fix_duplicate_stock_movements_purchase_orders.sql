-- =====================================================
-- Fix: Eliminar duplicación de movimientos de stock en órdenes de compra
-- =====================================================

-- El problema: El trigger track_product_stock_changes registra automáticamente
-- cambios en products.stock_quantity, pero el código de receiveItems() también
-- inserta manualmente en stock_movements, causando duplicación.

-- Solución: Eliminar el trigger ya que el código maneja explícitamente
-- los movimientos de stock con más contexto (purchase_order_id, sale_id, etc.)

-- Eliminar los triggers existentes
DROP TRIGGER IF EXISTS track_product_stock_changes ON products;
DROP TRIGGER IF EXISTS track_variant_stock_changes ON product_variants;

-- Eliminar la función asociada (ya no se usa)
-- Usar CASCADE para eliminar cualquier dependencia restante
DROP FUNCTION IF EXISTS log_stock_movement() CASCADE;

-- Nota: Los movimientos de stock ahora se registran explícitamente en el código:
-- - receiveItems() para órdenes de compra
-- - Ventas para salidas de stock
-- - Ajustes manuales cuando sea necesario

-- Esto da más control y evita duplicaciones, además de permitir
-- incluir información contextual como purchase_order_id y sale_id
