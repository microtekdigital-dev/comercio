-- Fix V2 para el trigger prevent_multiple_trials
-- Solución más robusta que maneja correctamente nuevos usuarios y empresas

-- PASO 1: Eliminar el trigger problemático
DROP TRIGGER IF EXISTS trigger_prevent_multiple_trials ON subscriptions;
DROP FUNCTION IF EXISTS prevent_multiple_trials();

-- PASO 2: Crear nueva función que SOLO bloquea si:
-- a) Ya existe una suscripción para esta empresa
-- b) Y esa suscripción NO es la que se está insertando
CREATE OR REPLACE FUNCTION prevent_multiple_trials()
RETURNS TRIGGER AS $$
DECLARE
  v_existing_count INTEGER;
BEGIN
  -- Contar cuántas suscripciones ya existen para esta empresa
  SELECT COUNT(*) INTO v_existing_count
  FROM subscriptions 
  WHERE company_id = NEW.company_id;
  
  -- Si ya existe al menos una suscripción, bloquear
  IF v_existing_count > 0 THEN
    RAISE EXCEPTION 'Company already has a subscription. Cannot create another trial.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 3: Recrear el trigger
CREATE TRIGGER trigger_prevent_multiple_trials
  BEFORE INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_multiple_trials();

-- PASO 4: Verificar instalación
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_prevent_multiple_trials';

-- PASO 5: Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Trigger prevent_multiple_trials actualizado correctamente';
  RAISE NOTICE 'Ahora permite crear suscripciones para nuevas empresas';
  RAISE NOTICE 'Pero bloquea múltiples suscripciones para la misma empresa';
END $$;
