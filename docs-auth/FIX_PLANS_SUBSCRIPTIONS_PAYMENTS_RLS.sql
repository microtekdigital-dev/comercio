-- ============================================================================
-- CRÍTICO: Habilitar RLS en plans, subscriptions y payments
-- Estas tablas son fundamentales para el sistema de suscripciones
-- ============================================================================

-- ========================================
-- PASO 1: HABILITAR RLS EN LAS 3 TABLAS
-- ========================================

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PASO 2: POLÍTICAS PARA PLANS
-- ========================================

-- Todos pueden ver los planes activos (para la página de precios)
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.plans;
CREATE POLICY "Anyone can view active plans"
  ON public.plans
  FOR SELECT
  USING (is_active = true);

-- Solo admins pueden modificar planes (opcional, por si necesitas gestión desde la app)
DROP POLICY IF EXISTS "Only admins can manage plans" ON public.plans;
CREATE POLICY "Only admins can manage plans"
  ON public.plans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- ========================================
-- PASO 3: POLÍTICAS PARA SUBSCRIPTIONS
-- ========================================

-- Los miembros de la empresa pueden ver sus suscripciones
DROP POLICY IF EXISTS "Company members can view their subscriptions" ON public.subscriptions;
CREATE POLICY "Company members can view their subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

-- Los admins de la empresa pueden crear suscripciones
DROP POLICY IF EXISTS "Company admins can create subscriptions" ON public.subscriptions;
CREATE POLICY "Company admins can create subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM public.company_users 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Los admins de la empresa pueden actualizar sus suscripciones
DROP POLICY IF EXISTS "Company admins can update their subscriptions" ON public.subscriptions;
CREATE POLICY "Company admins can update their subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.company_users 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ========================================
-- PASO 4: POLÍTICAS PARA PAYMENTS
-- ========================================

-- Los miembros de la empresa pueden ver sus pagos
DROP POLICY IF EXISTS "Company members can view their payments" ON public.payments;
CREATE POLICY "Company members can view their payments"
  ON public.payments
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id 
      FROM public.company_users 
      WHERE user_id = auth.uid()
    )
  );

-- Los admins de la empresa pueden crear pagos
DROP POLICY IF EXISTS "Company admins can create payments" ON public.payments;
CREATE POLICY "Company admins can create payments"
  ON public.payments
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM public.company_users 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ========================================
-- PASO 5: VERIFICACIÓN
-- ========================================

-- Verificar que RLS esté habilitado
SELECT 
  '✓ VERIFICACIÓN DE RLS' as paso,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✓ HABILITADO'
    ELSE '✗ DESHABILITADO'
  END as estado_rls
FROM pg_tables
WHERE tablename IN ('plans', 'subscriptions', 'payments')
  AND schemaname = 'public'
ORDER BY tablename;

-- Verificar políticas creadas
SELECT 
  '✓ POLÍTICAS CREADAS' as paso,
  tablename,
  policyname,
  cmd as operacion
FROM pg_policies
WHERE tablename IN ('plans', 'subscriptions', 'payments')
ORDER BY tablename, cmd, policyname;

-- Verificar acceso para vanithegameplay
SELECT 
  '✓ PRUEBA DE ACCESO - vanithegameplay' as prueba,
  s.id as subscription_id,
  p.name as plan_name,
  s.status,
  s.current_period_start,
  s.current_period_end,
  c.name as company_name
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
JOIN companies c ON s.company_id = c.id
WHERE s.company_id IN (
  SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com'
)
AND s.status = 'active';

-- Verificación FINAL de todas las tablas críticas
SELECT 
  '🎉 VERIFICACIÓN FINAL' as resultado,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✓ Habilitado'
    ELSE '❌ DESHABILITADO'
  END as estado_rls
FROM pg_tables
WHERE tablename IN (
  'plans',
  'subscriptions',
  'payments',
  'profiles',
  'company_users',
  'companies',
  'products',
  'suppliers',
  'purchase_orders',
  'sales',
  'customers'
)
AND schemaname = 'public'
ORDER BY 
  CASE WHEN rowsecurity = false THEN 0 ELSE 1 END,
  tablename;

-- Mensaje final
SELECT 
  '🎉 CONFIGURACIÓN COMPLETADA' as resultado,
  'RLS habilitado en plans, subscriptions y payments' as mensaje,
  'El usuario debe cerrar sesión y volver a iniciar' as siguiente_paso;
