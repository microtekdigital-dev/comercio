-- =====================================================
-- Sistema de Cierre de Caja
-- =====================================================

-- Tabla de Cierres de Caja
CREATE TABLE IF NOT EXISTS cash_register_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  closure_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  shift VARCHAR(50), -- Turno: mañana, tarde, noche, etc.
  closed_by UUID NOT NULL REFERENCES profiles(id),
  closed_by_name VARCHAR(255) NOT NULL, -- Guardamos el nombre por si se elimina el usuario
  
  -- Totales calculados de ventas
  total_sales_count INTEGER NOT NULL DEFAULT 0,
  total_sales_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  
  -- Totales por método de pago (calculados automáticamente)
  cash_sales DECIMAL(12, 2) DEFAULT 0,
  card_sales DECIMAL(12, 2) DEFAULT 0,
  transfer_sales DECIMAL(12, 2) DEFAULT 0,
  other_sales DECIMAL(12, 2) DEFAULT 0,
  
  -- Conteo físico de efectivo (opcional)
  cash_counted DECIMAL(12, 2),
  
  -- Diferencia (opcional, calculado si hay cash_counted)
  cash_difference DECIMAL(12, 2),
  
  notes TEXT,
  currency VARCHAR(3) DEFAULT 'ARS',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_cash_register_closures_company_id ON cash_register_closures(company_id);
CREATE INDEX idx_cash_register_closures_closure_date ON cash_register_closures(closure_date DESC);
CREATE INDEX idx_cash_register_closures_closed_by ON cash_register_closures(closed_by);
CREATE INDEX idx_cash_register_closures_created_at ON cash_register_closures(created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_cash_register_closures_updated_at 
  BEFORE UPDATE ON cash_register_closures
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE cash_register_closures ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden ver los cierres de su empresa
CREATE POLICY "Users can view their company cash register closures"
  ON cash_register_closures
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Los usuarios pueden crear cierres para su empresa
CREATE POLICY "Users can create cash register closures for their company"
  ON cash_register_closures
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Los usuarios pueden actualizar cierres de su empresa
CREATE POLICY "Users can update their company cash register closures"
  ON cash_register_closures
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Los usuarios pueden eliminar cierres de su empresa
CREATE POLICY "Users can delete their company cash register closures"
  ON cash_register_closures
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Comentarios
COMMENT ON TABLE cash_register_closures IS 'Registros de cierres de caja por turno/día';
COMMENT ON COLUMN cash_register_closures.shift IS 'Turno del cierre: mañana, tarde, noche, etc.';
COMMENT ON COLUMN cash_register_closures.cash_counted IS 'Monto físico contado en efectivo (opcional)';
COMMENT ON COLUMN cash_register_closures.cash_difference IS 'Diferencia entre efectivo esperado y contado (opcional)';
