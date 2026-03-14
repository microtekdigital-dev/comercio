-- =====================================================
-- POS Offline Sales Queue - Tabla y RLS Policies
-- Tarea 19.1: Seguridad multi-tenant para cola offline
-- Requirements: 10.1-10.5
-- =====================================================

-- Crear tabla offline_sales_queue si no existe
CREATE TABLE IF NOT EXISTS offline_sales_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sale_data JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'synced', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at TIMESTAMPTZ,
  error_message TEXT
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_offline_sales_queue_company_id
  ON offline_sales_queue(company_id);

CREATE INDEX IF NOT EXISTS idx_offline_sales_queue_status
  ON offline_sales_queue(status);

CREATE INDEX IF NOT EXISTS idx_offline_sales_queue_created_at
  ON offline_sales_queue(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_offline_sales_queue_company_status
  ON offline_sales_queue(company_id, status);

-- Comentarios
COMMENT ON TABLE offline_sales_queue IS 'Cola de ventas offline pendientes de sincronización (Plan Empresarial)';
COMMENT ON COLUMN offline_sales_queue.sale_data IS 'Datos completos de la venta en formato JSON para sincronización posterior';
COMMENT ON COLUMN offline_sales_queue.status IS 'Estado de sincronización: pending, synced, error';
COMMENT ON COLUMN offline_sales_queue.synced_at IS 'Timestamp de cuando la venta fue sincronizada exitosamente';
COMMENT ON COLUMN offline_sales_queue.error_message IS 'Mensaje de error si la sincronización falló';

-- =====================================================
-- Habilitar Row Level Security
-- =====================================================
ALTER TABLE offline_sales_queue ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies - Aislamiento multi-tenant
-- Patrón: validar company_id contra el perfil del usuario autenticado
-- =====================================================

-- Policy SELECT: los usuarios solo pueden ver la cola de su empresa
CREATE POLICY "Users can view their company offline sales queue"
  ON offline_sales_queue
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy INSERT: los usuarios solo pueden insertar en la cola de su empresa
CREATE POLICY "Users can insert into their company offline sales queue"
  ON offline_sales_queue
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy UPDATE: los usuarios solo pueden actualizar registros de su empresa
CREATE POLICY "Users can update their company offline sales queue"
  ON offline_sales_queue
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
