-- SOLUCIÓN TEMPORAL: Desactivar el trigger prevent_multiple_trials
-- Este trigger está bloqueando la creación de nuevos usuarios
-- La prevención de múltiples trials se manejará de otra forma

-- Eliminar el trigger problemático
DROP TRIGGER IF EXISTS trigger_prevent_multiple_trials ON subscriptions;
DROP FUNCTION IF EXISTS prevent_multiple_trials();

-- Verificar que se eliminó
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_prevent_multiple_trials';

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Trigger prevent_multiple_trials ELIMINADO';
  RAISE NOTICE 'Ahora los nuevos usuarios podrán registrarse';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'NOTA: La prevención de múltiples trials ahora se maneja mediante:';
  RAISE NOTICE '1. La tabla trial_used_emails que rastrea emails usados';
  RAISE NOTICE '2. La función handle_new_user() que verifica antes de crear trial';
  RAISE NOTICE '3. El código de la aplicación que previene reactivación';
END $$;
