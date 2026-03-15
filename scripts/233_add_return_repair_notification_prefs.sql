-- Agregar columnas de preferencias para devoluciones y reparaciones
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS sale_return_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS repair_status_change_enabled BOOLEAN NOT NULL DEFAULT true;
