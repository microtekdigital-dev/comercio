-- ============================================================================
-- VERIFICACIÓN FINAL DEL SISTEMA DE PLANES
-- ============================================================================

-- 1. RESUMEN GENERAL
SELECT 
  '=== RESUMEN GENERAL ===' as seccion,
  (SELECT COUNT(*) FROM public.plans WHERE is_active = true) as planes_activos,
  (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'active') as suscripciones_activas,
  (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'cancelled') as suscripciones_canceladas,
  (SELECT COUNT(*) FROM public.subscriptions WHERE plan_id IS NULL OR status IS NULL) as suscripciones_con_null,
  (SELECT COUNT(*) FROM public.profiles WHERE company_id IS NULL) as usuarios_sin_company,
  (SELECT COUNT(DISTINCT c.id) 
   FROM public.companies c 
   LEFT JOIN public.subscriptions s ON c.id = s.company_id AND s.status IN ('active', 'pending')
   WHERE s.id IS NULL) as companies_sin_suscripcion_activa;

-- 2. VERIFICAR PLANES TIENEN LÍMITES CONFIGURADOS
SELECT 
  '=== PLANES CON LÍMITES ===' as seccion,
  name,
  price,
  max_users,
  max_products,
  CASE
    WHEN max_users IS NULL OR max_users = 0 THEN '❌ MAX_USERS INVÁLIDO'
    WHEN max_products IS NULL OR max_products = 0 THEN '❌ MAX_PRODUCTS INVÁLIDO'
    ELSE '✅ OK'
  END as estado
FROM public.plans
WHERE is_active = true
ORDER BY price;

-- 3. VERIFICAR SUSCRIPCIONES ACTIVAS
SELECT 
  '=== SUSCRIPCIONES ACTIVAS ===' as seccion,
  c.name as company_name,
  p.name as plan_name,
  s.status,
  s.current_period_end,
  EXTRACT(DAY FROM (s.current_period_end - NOW())) as dias_restantes,
  CASE
    WHEN s.current_period_end > NOW() THEN '✅ VIGENTE'
    ELSE '⚠️ EXPIRADA'
  END as estado
FROM public.subscriptions s
LEFT JOIN public.companies c ON s.company_id = c.id
LEFT JOIN public.plans p ON s.plan_id = p.id
WHERE s.status = 'active'
ORDER BY s.current_period_end;

-- 4. VERIFICAR COMPANIES SIN SUSCRIPCIÓN ACTIVA
SELECT 
  '=== COMPANIES SIN SUSCRIPCIÓN ACTIVA ===' as seccion,
  c.name as company_name,
  c.created_at,
  (SELECT COUNT(*) FROM public.profiles WHERE company_id = c.id) as usuarios,
  (SELECT COUNT(*) FROM public.subscriptions WHERE company_id = c.id AND status = 'cancelled') as trials_cancelados,
  CASE
    WHEN (SELECT COUNT(*) FROM public.subscriptions WHERE company_id = c.id AND status = 'cancelled') > 0
    THEN '✅ CANCELÓ TRIAL - Debe pagar'
    WHEN c.created_at > NOW() - INTERVAL '1 hour'
    THEN '🆕 RECIÉN CREADA - Esperando trigger'
    ELSE '⚠️ REVISAR'
  END as diagnostico
FROM public.companies c
LEFT JOIN public.subscriptions s ON c.id = s.company_id AND s.status IN ('active', 'pending')
WHERE s.id IS NULL
ORDER BY c.created_at DESC;

-- 5. VERIFICAR TRIGGER ESTÁ INSTALADO
SELECT 
  '=== TRIGGER DE CREACIÓN ===' as seccion,
  tgname as trigger_name,
  tgenabled as enabled,
  CASE 
    WHEN tgenabled = 'O' THEN '✅ HABILITADO'
    WHEN tgenabled = 'D' THEN '❌ DESHABILITADO'
    ELSE '⚠️ ESTADO: ' || tgenabled::text
  END as estado
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 6. ESTADO FINAL
SELECT 
  '=== ✅ VERIFICACIÓN COMPLETA ===' as resultado,
  CASE
    WHEN (SELECT COUNT(*) FROM public.plans WHERE is_active = true AND (max_users IS NULL OR max_products IS NULL)) = 0
      AND (SELECT COUNT(*) FROM public.subscriptions WHERE plan_id IS NULL OR status IS NULL) = 0
      AND (SELECT COUNT(*) FROM public.profiles WHERE company_id IS NULL) = 0
    THEN '✅ SISTEMA FUNCIONANDO CORRECTAMENTE'
    ELSE '⚠️ HAY PROBLEMAS - Revisar secciones anteriores'
  END as estado_sistema;
