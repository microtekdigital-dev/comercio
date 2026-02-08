-- Buscar TODAS las funciones y triggers que crean suscripciones

-- PASO 1: Buscar funciones que contengan "INSERT INTO" y "subscriptions"
SELECT 
  '=== FUNCIONES QUE INSERTAN EN SUBSCRIPTIONS ===' as seccion,
  proname as function_name,
  CASE 
    WHEN prosrc LIKE '%INSERT INTO%subscriptions%' 
      OR prosrc LIKE '%INSERT INTO public.subscriptions%'
    THEN '⚠️  CREA SUSCRIPCIONES'
    ELSE '✓ No crea suscripciones'
  END as accion,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE (prosrc ILIKE '%subscriptions%' 
   AND (prosrc ILIKE '%INSERT%' OR prosrc ILIKE '%insert%'))
AND proname NOT LIKE 'pg_%'
ORDER BY proname;

-- PASO 2: Ver TODOS los triggers en la tabla subscriptions
SELECT 
  '=== TRIGGERS EN SUBSCRIPTIONS ===' as seccion,
  t.tgname as trigger_name,
  CASE t.tgtype
    WHEN 2 THEN 'BEFORE'
    WHEN 4 THEN 'AFTER'
    ELSE 'OTHER'
  END as timing,
  CASE 
    WHEN t.tgtype & 4 = 4 THEN 'INSERT'
    WHEN t.tgtype & 8 = 8 THEN 'DELETE'
    WHEN t.tgtype & 16 = 16 THEN 'UPDATE'
    ELSE 'OTHER'
  END as event,
  p.proname as function_name,
  t.tgenabled as enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.subscriptions'::regclass
ORDER BY t.tgname;

-- PASO 3: Ver TODOS los triggers en auth.users (pueden crear suscripciones)
SELECT 
  '=== TRIGGERS EN AUTH.USERS ===' as seccion,
  t.tgname as trigger_name,
  p.proname as function_name,
  t.tgenabled as enabled,
  CASE 
    WHEN p.prosrc LIKE '%subscriptions%' THEN '⚠️  Menciona subscriptions'
    ELSE '✓ No menciona subscriptions'
  END as menciona_subscriptions
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'auth.users'::regclass
ORDER BY t.tgname;

-- PASO 4: Buscar triggers en otras tablas que puedan crear suscripciones
SELECT 
  '=== OTROS TRIGGERS QUE MENCIONAN SUBSCRIPTIONS ===' as seccion,
  c.relname as table_name,
  t.tgname as trigger_name,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE p.prosrc ILIKE '%subscriptions%'
AND c.relname NOT IN ('subscriptions', 'users')
AND c.relnamespace = 'public'::regnamespace
ORDER BY c.relname, t.tgname;

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'ANÁLISIS COMPLETO';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Revisa los resultados arriba:';
  RAISE NOTICE '';
  RAISE NOTICE '1. FUNCIONES QUE INSERTAN:';
  RAISE NOTICE '   - Si dice "CREA SUSCRIPCIONES", esa función es sospechosa';
  RAISE NOTICE '   - Revisa el código (definition) para ver cuándo se ejecuta';
  RAISE NOTICE '';
  RAISE NOTICE '2. TRIGGERS EN SUBSCRIPTIONS:';
  RAISE NOTICE '   - Pueden estar creando suscripciones automáticamente';
  RAISE NOTICE '   - Revisa la función asociada';
  RAISE NOTICE '';
  RAISE NOTICE '3. TRIGGERS EN AUTH.USERS:';
  RAISE NOTICE '   - handle_new_user es normal';
  RAISE NOTICE '   - Otros triggers son sospechosos';
  RAISE NOTICE '';
  RAISE NOTICE '4. OTROS TRIGGERS:';
  RAISE NOTICE '   - Cualquier trigger que mencione subscriptions';
END $$;
