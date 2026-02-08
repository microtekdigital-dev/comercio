-- Script de diagnóstico para investigar por qué se reactiva el trial

-- ============================================================================
-- PASO 1: Ver todas las suscripciones de Plusmar con timestamps
-- ============================================================================
SELECT 
  id,
  company_id,
  plan_id,
  status,
  created_at,
  updated_at,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  mp_subscription_id
FROM subscriptions
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
ORDER BY created_at DESC;

-- ============================================================================
-- PASO 2: Ver el trigger actual de handle_new_user
-- ============================================================================
SELECT 
  proname as function_name,
  prosrc as function_code
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ============================================================================
-- PASO 3: Ver todos los triggers en la tabla auth.users
-- ============================================================================
SELECT 
  tgname as trigger_name,
  tgtype,
  tgenabled,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass;

-- ============================================================================
-- PASO 4: Ver el historial de usuarios creados recientemente
-- ============================================================================
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'invite_token' as invite_token,
  raw_user_meta_data->>'company_name' as company_name
FROM auth.users
WHERE email = 'microteklh@gmail.com'
ORDER BY created_at DESC;

-- ============================================================================
-- PASO 5: Ver los perfiles asociados a la empresa Plusmar
-- ============================================================================
SELECT 
  p.id,
  p.email,
  p.role,
  p.created_at,
  u.created_at as user_created_at
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
ORDER BY p.created_at DESC;

-- ============================================================================
-- PASO 6: Verificar si hay emails en trial_used_emails
-- ============================================================================
SELECT * FROM trial_used_emails
WHERE email = 'microteklh@gmail.com';

-- ============================================================================
-- PASO 7: Ver el plan Trial
-- ============================================================================
SELECT 
  id,
  name,
  price,
  interval,
  interval_count,
  is_active
FROM plans
WHERE name = 'Trial';

-- ============================================================================
-- INSTRUCCIONES
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'DIAGNÓSTICO DE REACTIVACIÓN DE TRIAL';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Revisa los resultados arriba para identificar:';
  RAISE NOTICE '1. ¿Cuántas suscripciones tiene Plusmar?';
  RAISE NOTICE '2. ¿Cuándo se crearon?';
  RAISE NOTICE '3. ¿El trigger está actualizado?';
  RAISE NOTICE '4. ¿Se creó un nuevo usuario recientemente?';
  RAISE NOTICE '5. ¿El email está en trial_used_emails?';
  RAISE NOTICE '';
  RAISE NOTICE 'Posibles causas:';
  RAISE NOTICE '- El trigger NO se actualizó correctamente';
  RAISE NOTICE '- Se está creando un nuevo usuario';
  RAISE NOTICE '- Hay código TypeScript creando suscripciones';
  RAISE NOTICE '- El webhook de MercadoPago está creando suscripciones';
END $$;
