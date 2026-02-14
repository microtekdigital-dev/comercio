-- =====================================================
-- Sistema de Apertura de Caja
-- =====================================================

-- Tabla de Aperturas de Caja
CREATE TABLE IF NOT EXISTS cash_register_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  opening_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  shift VARCHAR(50) NOT NULL, -- Turno: Mañana, Tarde, Noche
  opened_by UUID NOT NULL REFERENCES profiles(id),
  opened_by_name VARCHAR(255) NOT NULL, -- Guardamos el nombre por si se elimina el usuario
  initial_cash_amount DECIMAL(10, 2) NOT NULL CHECK (initial_cash_amount > 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_cash_register_openings_company_id ON cash_register_openings(company_id);
CREATE INDEX idx_cash_register_openings_company_date_shift ON cash_register_openings(company_id, opening_date, shift);
CREATE INDEX idx_cash_register_openings_created_at ON cash_register_openings(created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_cash_register_openings_updated_at 
  BEFORE UPDATE ON cash_register_openings
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE cash_register_openings ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden ver las aperturas de su empresa
CREATE POLICY "Users can view their company cash register openings"
  ON cash_register_openings
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Los usuarios pueden crear aperturas para su empresa
CREATE POLICY "Users can create cash register openings for their company"
  ON cash_register_openings
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Los usuarios pueden actualizar aperturas de su empresa
CREATE POLICY "Users can update their company cash register openings"
  ON cash_register_openings
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Los usuarios pueden eliminar aperturas de su empresa
CREATE POLICY "Users can delete their company cash register openings"
  ON cash_register_openings
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Comentarios
COMMENT ON TABLE cash_register_openings IS 'Registros de aperturas de caja por turno';
COMMENT ON COLUMN cash_register_openings.opening_date IS 'Fecha y hora de apertura de caja';
COMMENT ON COLUMN cash_register_openings.shift IS 'Turno de la apertura: Mañana, Tarde, Noche';
COMMENT ON COLUMN cash_register_openings.initial_cash_amount IS 'Monto inicial de efectivo en la caja';
COMMENT ON COLUMN cash_register_openings.notes IS 'Notas u observaciones de la apertura';


-- =====================================================
-- Agregar columna opening_id a cash_register_closures
-- =====================================================

-- Agregar columna opening_id (nullable para compatibilidad con cierres antiguos)
ALTER TABLE cash_register_closures 
ADD COLUMN IF NOT EXISTS opening_id UUID REFERENCES cash_register_openings(id) ON DELETE SET NULL;

-- Crear índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_cash_register_closures_opening_id ON cash_register_closures(opening_id);

-- Comentario
COMMENT ON COLUMN cash_register_closures.opening_id IS 'Referencia a la apertura de caja correspondiente (opcional)';
