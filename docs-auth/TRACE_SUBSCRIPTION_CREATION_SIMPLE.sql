-- RASTREAR LA CREACIÓN DE SUSCRIPCIONES - VERSIÓN SIMPLE
-- Este script crea un trigger de auditoría para ver QUIÉN y CÓMO crea subscriptions

-- ============================================================================
-- PASO 1: Crear tabla de auditoría
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID,
  company_id UUID,
  plan_id UUID,
  action TEXT,
  old_status TEXT,
  new_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  db_user TEXT,
  db_current_user TEXT,
  backend_pid INTEGER
);

-- ============================================================================
-- PASO 2: Crear función de auditoría SIMPLE
-- ============================================================================
CREATE OR REPLACE FUNCTION audit_subscription_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO subscription_audit_log (
      subscription_id,
      company_id,
      plan_id,
      action,
      old_status,
      new_status,
      db_user,
      db_current_user,
      backend_pid
    ) VALUES (
      NEW.id,
      NEW.company_id,
      NEW.plan_id,
      'INSERT',
      NULL,
      NEW.status,
      session_user,
      current_user,
      pg_backend_pid()
    );
    
    RAISE NOTICE '🚨 NUEVA SUSCRIPCIÓN CREADA: id=%, company=%, plan=%, status=%', 
      NEW.id, NEW.company_id, NEW.plan_id, NEW.status;
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO subscription_audit_log (
      subscription_id,
      company_id,
      plan_id,
      action,
      old_status,
      new_status,
      db_user,
      db_current_user,
      backend_pid
    ) VALUES (
      NEW.id,
      NEW.company_id,
      NEW.plan_id,
      'UPDATE',
      OLD.status,
      NEW.status,
      session_user,
      current_user,
      pg_backend_pid()
    );
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO subscription_audit_log (
      subscription_id,
      company_id,
      plan_id,
      action,
      old_status,
      new_status,
      db_user,
      db_current_user,
      backend_pid
    ) VALUES (
      OLD.id,
      OLD.company_id,
      OLD.plan_id,
      'DELETE',
      OLD.status,
      NULL,
      session_user,
      current_user,
      pg_backend_pid()
    );
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PASO 3: Crear trigger de auditoría
-- ============================================================================
DROP TRIGGER IF EXISTS audit_subscription_trigger ON subscriptions;

CREATE TRIGGER audit_subscription_trigger
AFTER INSERT OR UPDATE OR DELETE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION audit_subscription_changes();

-- ============================================================================
-- PASO 4: Verificar que el trigger está activo
-- ============================================================================
SELECT 
  '=== TRIGGER DE AUDITORÍA CREADO ===' as mensaje,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'subscriptions'
AND trigger_name = 'audit_subscription_trigger';

-- ============================================================================
-- MENSAJE FINAL
-- ============================================================================
SELECT '==============================================';
SELECT 'TRIGGER DE AUDITORÍA ACTIVADO';
SELECT '==============================================';
SELECT '';
SELECT 'AHORA SIGUE ESTOS PASOS:';
SELECT '1. Elimina todas las suscripciones activas de Plusmar';
SELECT '2. Refresca la página /dashboard/billing';
SELECT '3. Ejecuta: SELECT * FROM subscription_audit_log ORDER BY created_at DESC LIMIT 5;';
SELECT '4. Verás EXACTAMENTE quién creó la suscripción';
