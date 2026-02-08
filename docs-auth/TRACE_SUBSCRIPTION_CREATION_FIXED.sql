-- RASTREAR LA CREACIÓN DE SUSCRIPCIONES - VERSIÓN CORREGIDA

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
-- PASO 2: Crear función de auditoría
-- ============================================================================
CREATE OR REPLACE FUNCTION audit_subscription_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_session_user TEXT;
  v_current_user TEXT;
BEGIN
  -- Capturar los valores de las funciones
  v_session_user := session_user::TEXT;
  v_current_user := current_user::TEXT;
  
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
      v_session_user,
      v_current_user,
      pg_backend_pid()
    );
    
    RAISE NOTICE '🚨 NUEVA SUSCRIPCIÓN CREADA: id=%, company=%, plan=%, status=%, user=%', 
      NEW.id, NEW.company_id, NEW.plan_id, NEW.status, v_current_user;
    
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
      v_session_user,
      v_current_user,
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
      v_session_user,
      v_current_user,
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
  'TRIGGER DE AUDITORÍA CREADO' as mensaje,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'subscriptions'
AND trigger_name = 'audit_subscription_trigger';

-- ============================================================================
-- INSTRUCCIONES
-- ============================================================================
SELECT '=============================================='::TEXT as instrucciones
UNION ALL SELECT 'TRIGGER DE AUDITORÍA ACTIVADO'
UNION ALL SELECT '=============================================='
UNION ALL SELECT ''
UNION ALL SELECT 'AHORA SIGUE ESTOS PASOS:'
UNION ALL SELECT '1. Elimina las suscripciones activas'
UNION ALL SELECT '2. Refresca /dashboard/billing'
UNION ALL SELECT '3. Consulta el log de auditoría'
UNION ALL SELECT ''
UNION ALL SELECT 'Query para ver el log:'
UNION ALL SELECT 'SELECT * FROM subscription_audit_log'
UNION ALL SELECT 'WHERE company_id = ''deaf584c-8964-4ec4-a4f3-a0310aa6e308'''
UNION ALL SELECT 'ORDER BY created_at DESC LIMIT 5;';
