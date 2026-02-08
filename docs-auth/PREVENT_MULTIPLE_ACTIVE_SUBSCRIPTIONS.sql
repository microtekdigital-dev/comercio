-- Crear trigger para prevenir múltiples suscripciones activas por empresa

CREATE OR REPLACE FUNCTION prevent_multiple_active_subscriptions()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se está insertando una suscripción activa
  IF NEW.status IN ('active', 'pending') THEN
    -- Cancelar todas las suscripciones activas existentes para esta empresa
    UPDATE subscriptions
    SET 
      status = 'cancelled',
      cancel_at_period_end = false,
      current_period_end = NOW(),
      updated_at = NOW()
    WHERE company_id = NEW.company_id
    AND id != NEW.id
    AND status IN ('active', 'pending');
    
    RAISE NOTICE 'Suscripciones anteriores canceladas para empresa: %', NEW.company_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_prevent_multiple_active ON subscriptions;
CREATE TRIGGER trigger_prevent_multiple_active
  BEFORE INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_multiple_active_subscriptions();

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'TRIGGER DE PREVENCIÓN CREADO';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Este trigger:';
  RAISE NOTICE '✓ Cancela suscripciones activas anteriores';
  RAISE NOTICE '✓ Solo permite 1 suscripción activa por empresa';
  RAISE NOTICE '✓ Se ejecuta ANTES de insertar';
  RAISE NOTICE '';
  RAISE NOTICE 'Ahora prueba crear/refrescar y solo habrá 1 activa';
END $$;
