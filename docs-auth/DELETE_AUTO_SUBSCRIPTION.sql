-- Script para eliminar la suscripción que se creó automáticamente
-- Esta suscripción se creó el 2026-02-08 14:13:50 para la empresa Plusmar

-- PASO 1: Verificar la suscripción antes de eliminar
SELECT 
  id,
  company_id,
  plan_id,
  status,
  created_at,
  'Esta es la suscripción que se eliminará' as nota
FROM subscriptions
WHERE id = '6e665a3a-189c-4bd1-9467-7cc667c75675';

-- PASO 2: Eliminar la suscripción automática
DELETE FROM subscriptions 
WHERE id = '6e665a3a-189c-4bd1-9467-7cc667c75675';

-- PASO 3: Verificar que se eliminó correctamente
SELECT 
  COUNT(*) as total_suscripciones,
  'Debe ser 0 si se eliminó correctamente' as nota
FROM subscriptions
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308';

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Suscripción automática ELIMINADA';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'La empresa Plusmar ahora NO tiene suscripción activa';
  RAISE NOTICE 'Tanto el admin como el empleado verán el sistema bloqueado';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANTE: Ejecuta FIX_TRIGGER_NO_RECREATE_SUBSCRIPTION.sql';
  RAISE NOTICE 'para evitar que se vuelva a crear automáticamente';
END $$;
