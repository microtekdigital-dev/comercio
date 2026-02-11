-- =====================================================
-- Sistema de Historial de Stock
-- =====================================================

-- Tabla de Historial de Movimientos de Stock
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Tipo de movimiento
  movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN (
    'purchase', -- Ingreso por orden de compra
    'sale', -- Egreso por venta
    'adjustment_in', -- Ajuste manual de ingreso
    'adjustment_out', -- Ajuste manual de egreso
    'return_in', -- Devolución de cliente (ingreso)
    'return_out' -- Devolución a proveedor (egreso)
  )),
  
  -- Cantidad (positiva para ingresos, negativa para egresos)
  quantity DECIMAL(10, 2) NOT NULL,
  
  -- Stock antes y después del movimiento
  stock_before DECIMAL(10, 2) NOT NULL,
  stock_after DECIMAL(10, 2) NOT NULL,
  
  -- Referencias opcionales
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  
  -- Usuario que realizó el movimiento
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_by_name VARCHAR(255) NOT NULL, -- Guardamos el nombre por si se elimina el usuario
  
  -- Notas adicionales
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Índices para búsquedas rápidas
  CONSTRAINT valid_quantity CHECK (quantity != 0)
);

-- Índices
CREATE INDEX idx_stock_movements_company_id ON stock_movements(company_id);
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_movement_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX idx_stock_movements_created_by ON stock_movements(created_by);
CREATE INDEX idx_stock_movements_sale_id ON stock_movements(sale_id) WHERE sale_id IS NOT NULL;
CREATE INDEX idx_stock_movements_purchase_order_id ON stock_movements(purchase_order_id) WHERE purchase_order_id IS NOT NULL;

-- RLS Policies
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden ver los movimientos de su empresa
CREATE POLICY "Users can view their company stock movements"
  ON stock_movements
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Los usuarios pueden crear movimientos para su empresa
CREATE POLICY "Users can create stock movements for their company"
  ON stock_movements
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: No se pueden actualizar movimientos (solo lectura después de crear)
-- Los movimientos de stock son inmutables para mantener la integridad del historial

-- Policy: Solo admins pueden eliminar movimientos (en casos excepcionales)
CREATE POLICY "Admins can delete stock movements"
  ON stock_movements
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Función para registrar movimiento de stock automáticamente
CREATE OR REPLACE FUNCTION log_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_user_id UUID;
  v_user_name VARCHAR(255);
  v_movement_type VARCHAR(50);
  v_quantity DECIMAL(10, 2);
  v_stock_before DECIMAL(10, 2);
  v_stock_after DECIMAL(10, 2);
  v_sale_id UUID := NULL;
  v_purchase_order_id UUID := NULL;
  v_notes TEXT := NULL;
BEGIN
  -- Obtener información del usuario actual
  v_user_id := auth.uid();
  
  SELECT company_id, COALESCE(full_name, email) 
  INTO v_company_id, v_user_name
  FROM profiles 
  WHERE id = v_user_id;
  
  -- Determinar el tipo de movimiento y cantidad
  IF TG_TABLE_NAME = 'products' THEN
    -- Cambio directo en la tabla products (ajuste manual)
    v_stock_before := OLD.stock_quantity;
    v_stock_after := NEW.stock_quantity;
    v_quantity := NEW.stock_quantity - OLD.stock_quantity;
    
    IF v_quantity > 0 THEN
      v_movement_type := 'adjustment_in';
      v_notes := 'Ajuste manual de inventario';
    ELSIF v_quantity < 0 THEN
      v_movement_type := 'adjustment_out';
      v_notes := 'Ajuste manual de inventario';
    ELSE
      -- No hay cambio en cantidad, no registrar
      RETURN NEW;
    END IF;
    
    -- Solo registrar si el producto tiene track_inventory activado
    IF NEW.track_inventory THEN
      INSERT INTO stock_movements (
        company_id,
        product_id,
        movement_type,
        quantity,
        stock_before,
        stock_after,
        created_by,
        created_by_name,
        notes
      ) VALUES (
        v_company_id,
        NEW.id,
        v_movement_type,
        v_quantity,
        v_stock_before,
        v_stock_after,
        v_user_id,
        v_user_name,
        v_notes
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para registrar cambios manuales en stock de productos
CREATE TRIGGER track_product_stock_changes
  AFTER UPDATE OF stock_quantity ON products
  FOR EACH ROW
  WHEN (OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity)
  EXECUTE FUNCTION log_stock_movement();

-- Comentarios
COMMENT ON TABLE stock_movements IS 'Historial completo de movimientos de inventario';
COMMENT ON COLUMN stock_movements.movement_type IS 'Tipo de movimiento: purchase, sale, adjustment_in, adjustment_out, return_in, return_out';
COMMENT ON COLUMN stock_movements.quantity IS 'Cantidad del movimiento (positiva para ingresos, negativa para egresos)';
COMMENT ON COLUMN stock_movements.stock_before IS 'Stock antes del movimiento';
COMMENT ON COLUMN stock_movements.stock_after IS 'Stock después del movimiento';
COMMENT ON COLUMN stock_movements.created_by_name IS 'Nombre del usuario que realizó el movimiento';
