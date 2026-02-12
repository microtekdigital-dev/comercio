-- =====================================================
-- Fix: Eliminar duplicación de movimientos de stock
-- =====================================================
-- Problema: El trigger track_product_stock_changes registra
-- automáticamente todos los cambios de stock, causando duplicados
-- cuando el código ya registró el movimiento (órdenes de compra, ventas)
-- =====================================================

-- Solución: Eliminar el trigger automático
-- Los movimientos de stock se registrarán ÚNICAMENTE desde el código:
-- 1. Órdenes de compra → receiveItems() en purchase-orders.ts
-- 2. Ventas → createSale() en sales.ts  
-- 3. Ajustes manuales → updateProduct() en products.ts
-- =====================================================

DROP TRIGGER IF EXISTS track_product_stock_changes ON products;
DROP FUNCTION IF EXISTS log_stock_movement();

-- Comentario explicativo
COMMENT ON TABLE stock_movements IS 'Historial completo de movimientos de inventario. Los movimientos se registran manualmente desde el código de la aplicación para evitar duplicaciones.';

