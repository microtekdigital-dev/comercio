-- ============================================================================
-- DEBUG: Pantalla en Blanco - Diagnóstico Completo
-- ============================================================================
-- Este script diagnostica por qué el dashboard muestra pantalla en blanco
-- a pesar de que el servidor responde con código 200
-- ============================================================================

-- 1. Verificar estado de RLS en todas las tablas críticas
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Habilitado"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'companies', 'company_users', 'plans', 'subscriptions', 'payments')
ORDER BY tablename;

-- 2. Verificar políticas activas en tablas críticas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'companies', 'company_users', 'plans', 'subscriptions', 'payments')
ORDER BY tablename, policyname;

-- 3. Verificar datos del usuario vanithegameplay
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.company_id,
  p.role,
  c.name as company_name,
  c.slug as company_slug
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.companies c ON c.id = p.company_id
WHERE u.email = 'vanithegameplay@gmail.com';

-- 4. Verificar suscripción activa
SELECT 
  s.id,
  s.company_id,
  s.plan_id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  s.created_at,
  pl.name as plan_name,
  pl.price as plan_price,
  pl.interval as plan_interval
FROM public.subscriptions s
LEFT JOIN public.plans pl ON pl.id = s.plan_id
WHERE s.company_id IN (
  SELECT p.company_id 
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.email = 'vanithegameplay@gmail.com'
)
ORDER BY s.created_at DESC
LIMIT 5;

-- 5. Verificar membership en company_users
SELECT 
  cu.company_id,
  cu.user_id,
  cu.role,
  cu.created_at,
  c.name as company_name
FROM public.company_users cu
LEFT JOIN public.companies c ON c.id = cu.company_id
WHERE cu.user_id IN (
  SELECT u.id 
  FROM auth.users u
  WHERE u.email = 'vanithegameplay@gmail.com'
);

-- 6. Verificar que los planes estén disponibles
SELECT 
  id,
  name,
  price,
  currency,
  interval,
  is_active,
  sort_order
FROM public.plans
WHERE is_active = true
ORDER BY sort_order;

-- 7. Test de acceso: Simular query del layout
-- Este query es el que ejecuta getCompanySubscription()
DO $$
DECLARE
  v_user_id uuid;
  v_company_id uuid;
  v_subscription_count int;
BEGIN
  -- Obtener user_id
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'vanithegameplay@gmail.com';
  
  -- Obtener company_id
  SELECT company_id INTO v_company_id
  FROM public.profiles
  WHERE id = v_user_id;
  
  -- Contar suscripciones accesibles
  SELECT COUNT(*) INTO v_subscription_count
  FROM public.subscriptions
  WHERE company_id = v_company_id;
  
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Company ID: %', v_company_id;
  RAISE NOTICE 'Subscriptions found: %', v_subscription_count;
END $$;

-- 8. Verificar errores recientes en logs (si están disponibles)
-- Nota: Esta tabla puede no existir en todas las instalaciones
SELECT 
  created_at,
  level,
  msg,
  metadata
FROM public.logs
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- 1. RLS debe estar habilitado en todas las tablas críticas
-- 2. Debe haber políticas activas para cada tabla
-- 3. El usuario debe tener company_id asignado
-- 4. Debe existir una suscripción activa
-- 5. Debe existir registro en company_users
-- 6. Los planes deben estar disponibles
-- 7. El test de acceso debe mostrar al menos 1 suscripción
-- ============================================================================
