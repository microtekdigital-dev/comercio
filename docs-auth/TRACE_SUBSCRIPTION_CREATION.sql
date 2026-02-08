-- RASTREAR LA CREACIÓN DE SUSCRIPCIONES EN TIEMPO REAL
-- Este script crea un trigger de auditoría para ver QUIÉN y CÓMO crea subscriptions

-- ============================================================================
-- PASO 1: Crear tabla de auditoría
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID,
  company_id UUID,
  plan_id UUID,
  action TEXT, -- 'INSERT', 'UPDATE', 'DELETE'
  old_status TEXT,
  new_status TEXT,
  created_by TEXT, -- Usuario que ejecutó la acción
  created_at TIMESTAMPTZ DEFAULT NOW(),
  session_user TEXT DEFAULT session_user,
  current_user TEXT DEFAULT current_user,
  application_name TEXT,
  client_addr INET,
  backend_pid INTEGER DEFAULT pg_backend_pid(),
  stack_trace TEXT
);

-- ============================================================================
-- PASO 2: Crear función de auditoría
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
      created_by,
      application_name,
      client_addr,
      stack_trace
    ) VALUES (
      NEW.id,
      NEW.company_id,
      NEW.plan_id,
      'INSERT',
      NULL,
      NEW.status,
      current_user,
      current_setting('application_name', true),
      inet_client_addr(),
      current_query()
    );
    
    RAISE NOTICE '🚨 NUEVA SUSCRIPCIÓN CREADA: id=%, company=%, plan=%, status=%, user=%', 
      NEW.id, NEW.company_id, NEW.plan_id, NEW.status, current_user;
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO subscription_audit_log (
      subscription_id,
      company_id,
      plan_id,
      action,
      old_status,
      new_status,
      created_by,
      application_name,
      client_addr,
      stack_trace
    ) VALUES (
      NEW.id,
      NEW.company_id,
      NEW.plan_id,
      'UPDATE',
      OLD.status,
      NEW.status,
      current_user,
      current_setting('application_name', true),
      inet_client_addr(),
      current_query()
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
      created_by,
      application_name,
      client_addr,
      stack_trace
    ) VALUES (
      OLD.id,
      OLD.company_id,
      OLD.plan_id,
      'DELETE',
      OLD.status,
      NULL,
      current_user,
      current_setting('application_name', true),
      inet_client_addr(),
      current_query()
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
  '=== TRIGGER DE AUDITORÍA CREADO ===' as seccion,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'subscriptions'
AND trigger_name = 'audit_subscription_trigger';

-- ============================================================================
-- INSTRUCCIONES DE USO
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'TRIGGER DE AUDITORÍA ACTIVADO';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Ahora:';
  RAISE NOTICE '1. Elimina todas las suscripciones activas';
  RAISE NOTICE '2. Refresca la página /dashboard/billing';
  RAISE NOTICE '3. Ejecuta: SELECT * FROM subscription_audit_log ORDER BY created_at DESC;';
  RAISE NOTICE '4. Verás EXACTAMENTE quién y cómo creó la suscripción';
  RAISE NOTICE '';
  RAISE NOTICE 'El log incluirá:';
  RAISE NOTICE '- Usuario que ejecutó la acción (created_by)';
  RAISE NOTICE '- Aplicación que hizo la llamada (application_name)';
  RAISE NOTICE '- IP del cliente (client_addr)';
  RAISE NOTICE '- Query SQL completo (stack_trace)';
  RAISE NOTICE '- PID del proceso backend (backend_pid)';
END $$;
