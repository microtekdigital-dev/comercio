-- Script para actualizar trial_used_emails y asegurar que el email está protegido

-- Ver el estado actual
SELECT 
  '=== ESTADO ACTUAL ===' as seccion,
  email,
  trial_started_at,
  trial_cancelled_at,
  reason
FROM trial_used_emails
WHERE email = 'microteklh@gmail.com';

-- Actualizar el registro para asegurar que tiene trial_cancelled_at
UPDATE trial_used_emails
SET 
  trial_cancelled_at = COALESCE(trial_cancelled_at, NOW()),
  reason = COALESCE(reason, 'cancelled_by_user'),
  updated_at = NOW()
WHERE email = 'microteklh@gmail.com'
AND trial_cancelled_at IS NULL;

-- Ver el resultado
SELECT 
  '=== DESPUÉS DE ACTUALIZAR ===' as seccion,
  email,
  trial_started_at,
  trial_cancelled_at,
  reason,
  'Email protegido - NO puede crear otro trial' as estado
FROM trial_used_emails
WHERE email = 'microteklh@gmail.com';

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'EMAIL PROTEGIDO';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'El email microteklh@gmail.com está en trial_used_emails';
  RAISE NOTICE 'El trigger NO creará otro trial para este email';
  RAISE NOTICE '';
  RAISE NOTICE 'Si el trial se vuelve a activar:';
  RAISE NOTICE '→ NO es por el trigger handle_new_user';
  RAISE NOTICE '→ Ejecuta MONITOR_REACTIVATION.sql para investigar';
END $$;
