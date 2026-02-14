-- ============================================================================
-- TEST: Acceso RLS - Verificar que el usuario puede acceder a sus datos
-- ============================================================================
-- Este script prueba el acceso del usuario a través de RLS
-- simulando las queries que ejecuta el dashboard
-- ============================================================================

-- Configurar el contexto de usuario para simular autenticación
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Obtener el ID del usuario vanithegameplay
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'vanithegameplay@gmail.com';
  
  -- Establecer el contexto de autenticación
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_id::text)::text, true);
  
  RAISE NOTICE 'Testing access for user: %', v_user_id;
END $$;

-- ============================================================================
-- TEST 1: Acceso a profiles
-- ============================================================================
SELECT 
  '✅ TEST 1: Profiles' as test,
  COUNT(*) as records_found,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS'
    ELSE '❌ FAIL - No se puede acceder a profiles'
  END as result
FROM public.profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'vanithegameplay@gmail.com');

-- ============================================================================
-- TEST 2: Acceso a companies
-- ============================================================================
SELECT 
  '✅ TEST 2: Companies' as test,
  COUNT(*) as records_found,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS'
    ELSE '❌ FAIL - No se puede acceder a companies'
  END as result
FROM public.companies
WHERE id IN (
  SELECT company_id 
  FROM public.profiles 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'vanithegameplay@gmail.com')
);

-- ============================================================================
-- TEST 3: Acceso a company_users
-- ============================================================================
SELECT 
  '✅ TEST 3: Company Users' as test,
  COUNT(*) as records_found,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS'
    ELSE '❌ FAIL - No se puede acceder a company_users'
  END as result
FROM public.company_users
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'vanithegameplay@gmail.com');

-- ============================================================================
-- TEST 4: Acceso a plans (debe ser público)
-- ============================================================================
SELECT 
  '✅ TEST 4: Plans' as test,
  COUNT(*) as records_found,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS'
    ELSE '❌ FAIL - No se puede acceder a plans'
  END as result
FROM public.plans
WHERE is_active = true;

-- ============================================================================
-- TEST 5: Acceso a subscriptions
-- ============================================================================
SELECT 
  '✅ TEST 5: Subscriptions' as test,
  COUNT(*) as records_found,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS'
    ELSE '❌ FAIL - No se puede acceder a subscriptions'
  END as result
FROM public.subscriptions
WHERE company_id IN (
  SELECT company_id 
  FROM public.profiles 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'vanithegameplay@gmail.com')
);

-- ============================================================================
-- TEST 6: Acceso a payments
-- ============================================================================
SELECT 
  '✅ TEST 6: Payments' as test,
  COUNT(*) as records_found,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS'
    ELSE '⚠️ WARNING - No payments found (puede ser normal)'
  END as result
FROM public.payments
WHERE company_id IN (
  SELECT company_id 
  FROM public.profiles 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'vanithegameplay@gmail.com')
);

-- ============================================================================
-- TEST 7: Query completa de suscripción (como en getCompanySubscription)
-- ============================================================================
SELECT 
  '✅ TEST 7: Full Subscription Query' as test,
  s.id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  pl.name as plan_name,
  pl.price as plan_price,
  CASE 
    WHEN s.id IS NOT NULL THEN '✅ PASS'
    ELSE '❌ FAIL - Query completa falla'
  END as result
FROM public.subscriptions s
LEFT JOIN public.plans pl ON pl.id = s.plan_id
WHERE s.company_id IN (
  SELECT company_id 
  FROM public.profiles 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'vanithegameplay@gmail.com')
)
ORDER BY s.created_at DESC
LIMIT 1;

-- ============================================================================
-- RESUMEN DE RESULTADOS
-- ============================================================================
SELECT 
  '📊 RESUMEN' as section,
  'Si todos los tests muestran ✅ PASS, el problema NO es RLS' as conclusion,
  'Si algún test muestra ❌ FAIL, ese es el problema' as action;

-- ============================================================================
-- INSTRUCCIONES:
-- ============================================================================
-- 1. Ejecuta este script completo en Supabase SQL Editor
-- 2. Revisa los resultados de cada TEST
-- 3. Si todos pasan, el problema es del lado del cliente (JavaScript)
-- 4. Si alguno falla, ese es el problema de RLS que debemos corregir
-- ============================================================================
