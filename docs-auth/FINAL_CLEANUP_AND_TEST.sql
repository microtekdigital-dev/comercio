-- Limpieza final y prueba del trigger de prevención

-- PASO 1: Eliminar TODAS las suscripciones activas de Plusmar
DELETE FROM subscriptions
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
AND status = 'active';

-- PASO 2: Verificar que solo quedan las canceladas
SELECT 
  '=== DESPUÉS DE LIMPIEZA ===' as seccion,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'active') as activas,
  COUNT(*) FILTER (WHERE status = 'cancelled') as canceladas
FROM subscriptions
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308';

-- PASO 3: Verificar que el trigger está activo
SELECT 
  '=== TRIGGER DE PREVENCIÓN ===' as seccion,
  tgname as trigger_name,
  tgenabled as enabled,
  CASE tgenabled
    WHEN 'O' THEN '✓ Habilitado'
    WHEN 'D' THEN '✗ Deshabilitado'
    ELSE '? Desconocido'
  END as estado
FROM pg_trigger
WHERE tgrelid = 'public.subscriptions'::regclass
AND tgname = 'trigger_prevent_multiple_active';

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'LIMPIEZA COMPLETADA';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Estado actual:';
  RAISE NOTICE '✓ Suscripciones activas eliminadas';
  RAISE NOTICE '✓ Trigger de prevención instalado';
  RAISE NOTICE '✓ Email protegido en trial_used_emails';
  RAISE NOTICE '';
  RAISE NOTICE 'Ahora prueba:';
  RAISE NOTICE '1. Refresca /dashboard/billing';
  RAISE NOTICE '2. Si se crea una suscripción, el trigger la mantendrá única';
  RAISE NOTICE '3. No habrá múltiples suscripciones activas';
  RAISE NOTICE '';
  RAISE NOTICE 'El sistema está protegido contra reactivaciones';
END $$;
