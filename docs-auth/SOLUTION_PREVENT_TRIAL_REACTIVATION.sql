-- ============================================================================
-- SOLUCIÓN DEFINITIVA: Prevenir Reactivación de Trial
-- ============================================================================
-- Este script hace 3 cosas:
-- 1. Elimina todas las suscripciones activas de Plusmar
-- 2. Mantiene las suscripciones canceladas (historial)
-- 3. Agrega el email a trial_used_emails para prevenir recreación
-- ============================================================================

-- PASO 1: Ver el estado actual
SELECT 
  '=== ANTES DE LA LIMPIEZA ===' as seccion,
  id,
  status,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutos_desde_creacion
FROM subscriptions
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
ORDER BY created_at DESC;

-- PASO 2: Eliminar SOLO las suscripciones activas (mantener historial de canceladas)
DELETE FROM subscriptions
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
AND status = 'active';

-- PASO 3: Agregar el email a trial_used_emails para prevenir recreación
-- Esto evita que el trigger cree un nuevo trial si se registra de nuevo
INSERT INTO trial_used_emails (email, trial_started_at)
VALUES ('microteklh@gmail.com', NOW())
ON CONFLICT (email) DO NOTHING;

-- PASO 4: Verificar el resultado
SELECT 
  '=== DESPUÉS DE LA LIMPIEZA ===' as seccion,
  id,
  status,
  created_at
FROM subscriptions
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
ORDER BY created_at DESC;

-- PASO 5: Verificar que el email está en trial_used_emails
SELECT 
  '=== EMAIL EN TRIAL_USED ===' as seccion,
  email
FROM trial_used_emails
WHERE email = 'microteklh@gmail.com';

-- PASO 6: Resumen final
SELECT 
  '=== RESUMEN FINAL ===' as seccion,
  (SELECT COUNT(*) FROM subscriptions WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308') as total_suscripciones,
  (SELECT COUNT(*) FROM subscriptions WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308' AND status = 'active') as activas,
  (SELECT COUNT(*) FROM subscriptions WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308' AND status = 'cancelled') as canceladas,
  (SELECT COUNT(*) FROM trial_used_emails WHERE email = 'microteklh@gmail.com') as email_en_trial_used;

-- ============================================================================
-- MENSAJE DE CONFIRMACIÓN
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'LIMPIEZA COMPLETADA';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Acciones realizadas:';
  RAISE NOTICE '✓ Eliminadas suscripciones activas de Plusmar';
  RAISE NOTICE '✓ Mantenidas suscripciones canceladas (historial)';
  RAISE NOTICE '✓ Email agregado a trial_used_emails';
  RAISE NOTICE '';
  RAISE NOTICE 'Resultado esperado:';
  RAISE NOTICE '- Total suscripciones: 2 (solo canceladas)';
  RAISE NOTICE '- Suscripciones activas: 0';
  RAISE NOTICE '- Email en trial_used: 1';
  RAISE NOTICE '';
  RAISE NOTICE 'Comportamiento futuro:';
  RAISE NOTICE '- El trigger NO creará trial para microteklh@gmail.com';
  RAISE NOTICE '- Si se registra de nuevo, NO tendrá suscripción';
  RAISE NOTICE '- Deberá comprar un plan manualmente';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE:';
  RAISE NOTICE 'Si el trial se vuelve a crear, el problema está en:';
  RAISE NOTICE '1. Webhook de MercadoPago (si hay pagos)';
  RAISE NOTICE '2. Código TypeScript (poco probable)';
  RAISE NOTICE '3. Otro trigger o función en la base de datos';
END $$;
