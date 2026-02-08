-- ============================================================================
-- VERIFICACIÓN COMPLETA DE CONFIGURACIÓN DE PLANES
-- ============================================================================
-- Este script verifica toda la configuración de planes y detecta problemas
-- con datos null que puedan afectar el funcionamiento del sistema
-- ============================================================================

-- 1. VERIFICAR PLANES ACTIVOS
SELECT 
  '=== PLANES ACTIVOS ===' as seccion,
  id,
  name,
  price,
  currency,
  interval,
  interval_count,
  is_active,
  max_users,
  max_products,
  CASE 
    WHEN price = 0 THEN '✅ Trial (gratis)'
    WHEN interval = 'year' THEN '💰 Plan anual'
    WHEN interval = 'month' THEN '💳 Plan mensual'
    ELSE '⚠️ Tipo desconocido'
  END as tipo_plan,
  CASE
    WHEN name IS NULL THEN '❌ NOMBRE NULL'
    WHEN price IS NULL THEN '❌ PRECIO NULL'
    WHEN currency IS NULL THEN '❌ MONEDA NULL'
    WHEN interval IS NULL THEN '❌ INTERVALO NULL'
    WHEN max_users IS NULL THEN '⚠️ MAX_USERS NULL'
    WHEN max_products IS NULL THEN '⚠️ MAX_PRODUCTS NULL'
    ELSE '✅ Configuración completa'
  END as estado_configuracion
FROM public.plans
WHERE is_active = true
ORDER BY sort_order, price;

-- 2. VERIFICAR SUSCRIPCIONES CON DATOS NULL
SELECT 
  '=== SUSCRIPCIONES CON PROBLEMAS ===' as seccion,
  s.id as subscription_id,
  s.company_id,
  c.name as company_name,
  s.plan_id,
  p.name as plan_name,
  s.status,
  s.current_period_start,
  s.current_period_end,
  CASE
    WHEN s.plan_id IS NULL THEN '❌ PLAN_ID NULL'
    WHEN s.status IS NULL THEN '❌ STATUS NULL'
    WHEN s.current_period_start IS NULL THEN '⚠️ PERIOD_START NULL'
    WHEN s.current_period_end IS NULL THEN '⚠️ PERIOD_END NULL'
    WHEN p.id IS NULL THEN '❌ PLAN NO EXISTE'
    ELSE '✅ OK'
  END as diagnostico
FROM public.subscriptions s
LEFT JOIN public.companies c ON s.company_id = c.id
LEFT JOIN public.plans p ON s.plan_id = p.id
WHERE 
  s.plan_id IS NULL 
  OR s.status IS NULL 
  OR s.current_period_start IS NULL 
  OR s.current_period_end IS NULL
  OR p.id IS NULL
ORDER BY s.created_at DESC;

-- 3. VERIFICAR USUARIOS SIN SUSCRIPCIÓN
SELECT 
  '=== USUARIOS SIN SUSCRIPCIÓN ===' as seccion,
  pr.id as user_id,
  pr.email,
  pr.company_id,
  c.name as company_name,
  pr.role,
  pr.created_at as user_created_at,
  CASE
    WHEN pr.company_id IS NULL THEN '❌ SIN COMPANY_ID'
    WHEN c.id IS NULL THEN '❌ COMPANY NO EXISTE'
    ELSE '⚠️ COMPANY SIN SUSCRIPCIÓN'
  END as problema
FROM public.profiles pr
LEFT JOIN public.companies c ON pr.company_id = c.id
LEFT JOIN public.subscriptions s ON c.id = s.company_id AND s.status IN ('active', 'pending')
WHERE s.id IS NULL
ORDER BY pr.created_at DESC
LIMIT 20;

-- 4. VERIFICAR INTEGRIDAD DE DATOS EN SUBSCRIPTIONS
SELECT 
  '=== ANÁLISIS DE INTEGRIDAD ===' as seccion,
  COUNT(*) as total_subscriptions,
  COUNT(CASE WHEN plan_id IS NULL THEN 1 END) as sin_plan_id,
  COUNT(CASE WHEN status IS NULL THEN 1 END) as sin_status,
  COUNT(CASE WHEN current_period_start IS NULL THEN 1 END) as sin_period_start,
  COUNT(CASE WHEN current_period_end IS NULL THEN 1 END) as sin_period_end,
  COUNT(CASE WHEN company_id IS NULL THEN 1 END) as sin_company_id,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as activas,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as canceladas,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendientes
FROM public.subscriptions;

-- 5. VERIFICAR PLANES CON FEATURES NULL O VACÍAS
SELECT 
  '=== PLANES CON FEATURES INCOMPLETAS ===' as seccion,
  id,
  name,
  price,
  features,
  CASE
    WHEN features IS NULL THEN '❌ FEATURES NULL'
    WHEN jsonb_array_length(features) = 0 THEN '⚠️ FEATURES VACÍAS'
    ELSE '✅ FEATURES OK (' || jsonb_array_length(features)::text || ' items)'
  END as estado_features
FROM public.plans
WHERE is_active = true
ORDER BY sort_order;

-- 6. VERIFICAR SUSCRIPCIONES EXPIRADAS QUE DEBERÍAN ESTAR CANCELADAS
SELECT 
  '=== SUSCRIPCIONES EXPIRADAS ===' as seccion,
  s.id as subscription_id,
  s.company_id,
  c.name as company_name,
  p.name as plan_name,
  s.status,
  s.current_period_end,
  EXTRACT(DAY FROM (NOW() - s.current_period_end)) as dias_expirada,
  CASE
    WHEN s.status = 'active' AND s.current_period_end < NOW() THEN '⚠️ ACTIVA PERO EXPIRADA'
    WHEN s.status = 'cancelled' THEN '✅ CORRECTAMENTE CANCELADA'
    ELSE '✅ VIGENTE'
  END as estado
FROM public.subscriptions s
LEFT JOIN public.companies c ON s.company_id = c.id
LEFT JOIN public.plans p ON s.plan_id = p.id
WHERE s.current_period_end < NOW()
ORDER BY s.current_period_end DESC
LIMIT 20;

-- 7. VERIFICAR CONFIGURACIÓN DE MAX_USERS Y MAX_PRODUCTS
SELECT 
  '=== LÍMITES DE PLANES ===' as seccion,
  name as plan_name,
  price,
  max_users,
  max_products,
  CASE
    WHEN max_users IS NULL OR max_users = 0 THEN '❌ MAX_USERS INVÁLIDO'
    WHEN max_products IS NULL OR max_products = 0 THEN '❌ MAX_PRODUCTS INVÁLIDO'
    WHEN max_users < 1 THEN '❌ MAX_USERS < 1'
    WHEN max_products < 1 THEN '❌ MAX_PRODUCTS < 1'
    ELSE '✅ LÍMITES OK'
  END as estado_limites
FROM public.plans
WHERE is_active = true
ORDER BY price;

-- 8. RESUMEN EJECUTIVO
SELECT 
  '=== RESUMEN EJECUTIVO ===' as seccion,
  (SELECT COUNT(*) FROM public.plans WHERE is_active = true) as planes_activos,
  (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'active') as suscripciones_activas,
  (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'cancelled') as suscripciones_canceladas,
  (SELECT COUNT(*) FROM public.subscriptions WHERE plan_id IS NULL OR status IS NULL) as suscripciones_con_null,
  (SELECT COUNT(*) FROM public.profiles WHERE company_id IS NULL) as usuarios_sin_company,
  (SELECT COUNT(DISTINCT pr.company_id) 
   FROM public.profiles pr 
   LEFT JOIN public.subscriptions s ON pr.company_id = s.company_id AND s.status IN ('active', 'pending')
   WHERE pr.company_id IS NOT NULL AND s.id IS NULL) as companies_sin_suscripcion;
