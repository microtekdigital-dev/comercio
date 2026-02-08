-- Fix para el trigger prevent_multiple_trials
-- El trigger actual bloquea la creación de nuevos usuarios
-- Necesitamos modificarlo para que solo bloquee duplicados en la MISMA empresa

-- Eliminar el trigger y función anteriores
DROP TRIGGER IF EXISTS trigger_prevent_multiple_trials ON subscriptions;
DROP FUNCTION IF EXISTS prevent_multiple_trials();

-- Crear nueva función mejorada
CREATE OR REPLACE FUNCTION prevent_multiple_trials()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo verificar si ya existe OTRA suscripción para la MISMA empresa
  -- (excluyendo la que se está insertando)
  IF EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE company_id = NEW.company_id 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    -- Si ya existe una suscripción para esta empresa, bloquear
    RAISE EXCEPTION 'Company already has a subscription. Cannot create another trial.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger
CREATE TRIGGER trigger_prevent_multiple_trials
  BEFORE INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_multiple_trials();

-- Verificar que el trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_prevent_multiple_trials';
