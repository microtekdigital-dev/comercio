-- =====================================================
-- Simplificar estados de ventas
-- =====================================================

-- PASO 1: Migrar estados existentes ANTES de cambiar el constraint
-- pending, confirmed -> completed
UPDATE sales 
SET status = 'completed' 
WHERE status IN ('pending', 'confirmed');

-- PASO 2: Eliminar el constraint antiguo
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_status_check;

-- PASO 3: Agregar el nuevo constraint con los estados simplificados
ALTER TABLE sales ADD CONSTRAINT sales_status_check 
  CHECK (status IN ('draft', 'completed', 'cancelled'));

-- Comentario
COMMENT ON COLUMN sales.status IS 'Estado de la venta: draft (borrador), completed (completada), cancelled (cancelada)';
