-- Script: 240_create_audit_logs.sql
-- Crea la tabla audit_logs con índices y políticas RLS

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  module      TEXT NOT NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_created
  ON audit_logs(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_module
  ON audit_logs(company_id, module);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user
  ON audit_logs(company_id, user_id);

-- Habilitar RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden leer entradas de su propia empresa
CREATE POLICY "audit_logs_admin_read" ON audit_logs
  FOR SELECT
  USING (
    company_id = (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
    AND (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) = 'admin'
  );

-- Cualquier usuario autenticado de la empresa puede insertar
CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT
  WITH CHECK (
    company_id = (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Sin políticas de UPDATE ni DELETE: la tabla es inmutable
