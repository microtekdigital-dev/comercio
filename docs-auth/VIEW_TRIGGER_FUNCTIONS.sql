-- Ver el código de las funciones de los triggers sospechosos

-- PASO 1: Ver register_trial_usage
SELECT 
  '=== REGISTER_TRIAL_USAGE ===' as seccion,
  pg_get_functiondef(oid) as function_code
FROM pg_proc
WHERE proname = 'register_trial_usage';

-- PASO 2: Ver mark_trial_cancelled
SELECT 
  '=== MARK_TRIAL_CANCELLED ===' as seccion,
  pg_get_functiondef(oid) as function_code
FROM pg_proc
WHERE proname = 'mark_trial_cancelled';

-- PASO 3: Ver update_updated_at
SELECT 
  '=== UPDATE_UPDATED_AT ===' as seccion,
  pg_get_functiondef(oid) as function_code
FROM pg_proc
WHERE proname = 'update_updated_at';

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'CÓDIGO DE TRIGGERS';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Revisa el código arriba:';
  RAISE NOTICE '- register_trial_usage: Se ejecuta al INSERT';
  RAISE NOTICE '- mark_trial_cancelled: Se ejecuta al UPDATE';
  RAISE NOTICE '- Busca si crean nuevas suscripciones';
END $$;
