-- ============================================================================
-- BUSCAR TODOS LOS TRIGGERS Y FUNCIONES QUE PUEDAN CREAR SUSCRIPCIONES
-- ============================================================================

-- PASO 1: Ver todos los triggers en la tabla subscriptions
SELECT 
  '=== TRIGGERS EN SUBSCRIPTIONS ===' as seccion,
  tgname as trigger_name,
  tgtype,
  tgenabled as enabled,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'public.subscriptions'::regclass;

-- PASO 2: Ver todos los triggers en la tabla auth.users
SELECT 
  '=== TRIGGERS EN AUTH.USERS ===' as seccion,
  tgname as trigger_name,
  tgtype,
  tgenabled as enabled,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass;

-- PASO 3: Buscar todas las funciones que contengan "subscription" en su código
SELECT 
  '=== FUNCIONES CON SUBSCRIPTION ===' as seccion,
  proname as function_name,
  CASE 
    WHEN prosrc LIKE '%INSERT INTO%subscriptions%' THEN '⚠️  CREA SUSCRIPCIONES'
    WHEN prosrc LIKE '%UPDATE%subscriptions%' THEN '✓ Solo actualiza'
    ELSE '✓ Solo lee'
  END as accion
FROM pg_proc
WHERE prosrc ILIKE '%subscription%'
AND proname NOT LIKE 'pg_%'
ORDER BY proname;

-- PASO 4: Ver el código completo de handle_new_user
SELECT 
  '=== CÓDIGO DE HANDLE_NEW_USER ===' as seccion,
  CASE 
    WHEN prosrc LIKE '%INSERT INTO%subscriptions%' THEN '⚠️  SÍ CREA SUSCRIPCIONES'
    ELSE '✓ NO crea suscripciones'
  END as crea_suscripciones,
  CASE 
    WHEN prosrc LIKE '%v_is_new_company%' THEN '✓ Tiene validación de empresa nueva'
    ELSE '✗ NO tiene validación'
  END as tiene_validacion
FROM pg_proc
WHERE proname = 'handle_new_user';

-- PASO 5: Buscar políticas RLS que puedan afectar subscriptions
SELECT 
  '=== POLÍTICAS RLS EN SUBSCRIPTIONS ===' as seccion,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'subscriptions';

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'ANÁLISIS DE TRIGGERS Y FUNCIONES';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Revisa los resultados arriba:';
  RAISE NOTICE '';
  RAISE NOTICE '1. TRIGGERS EN SUBSCRIPTIONS:';
  RAISE NOTICE '   - Si hay triggers, pueden estar creando/modificando suscripciones';
  RAISE NOTICE '';
  RAISE NOTICE '2. TRIGGERS EN AUTH.USERS:';
  RAISE NOTICE '   - handle_new_user es el único que debería estar';
  RAISE NOTICE '';
  RAISE NOTICE '3. FUNCIONES CON SUBSCRIPTION:';
  RAISE NOTICE '   - Si dice "CREA SUSCRIPCIONES", investiga esa función';
  RAISE NOTICE '';
  RAISE NOTICE '4. HANDLE_NEW_USER:';
  RAISE NOTICE '   - Debe decir "SÍ CREA SUSCRIPCIONES" (es normal)';
  RAISE NOTICE '   - Debe decir "Tiene validación de empresa nueva"';
END $$;
