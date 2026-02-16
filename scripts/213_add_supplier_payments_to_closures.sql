-- =====================================================
-- Agregar columna para pagos a proveedores en cierres de caja
-- =====================================================

-- Agregar columna para registrar pagos a proveedores en efectivo
ALTER TABLE cash_register_closures 
ADD COLUMN IF NOT EXISTS supplier_payments_cash DECIMAL(12, 2) DEFAULT 0;

-- Comentario
COMMENT ON COLUMN cash_register_closures.supplier_payments_cash IS 'Total de pagos a proveedores en efectivo del día';

-- Actualizar cierres existentes para que tengan 0 en lugar de NULL
UPDATE cash_register_closures 
SET supplier_payments_cash = 0 
WHERE supplier_payments_cash IS NULL;
