-- ============================================================================
-- FIX: Problema de carga infinita después de activar RLS
-- Solución: Políticas RLS más permisivas para subscriptions y plans
-- ============================================================================

-- ========================================
-- PASO 1: ELIMINAR POLÍTICAS RESTRICTIVAS
-- ========================================

-- Eliminar políticas de subscriptions
DROP POLICY IF EXISTS "Company members can view their subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Company admins can create subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Company admins can update their subscriptions" ON public.subscriptions;

-- Eliminar políticas de plans
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.plans;
DROP POLICY IF EXISTS "Only admins can manage plans" ON public.plans;

-- Eliminar políticas de payments
DROP POLICY IF EXISTS "Company members can view their payments" ON public.payments;
DROP POLICY IF EXISTS "Company admins can create payments" ON public.payments;

-- ========================================
-- PASO 2: CREAR POLÍTICAS MÁS PERMISIVAS
-- ========================================

-- PLANS: Todos los usuarios autenticados pueden ver planes activos
CREATE POLICY "Authenticated users can view active plans"
  ON public.plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- PLANS: Solo super_admins pueden modificar planes
CREATE POLICY "Super admins can manage plans"
  ON public.plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- SUBSCRIPTIONS: Los usuarios pueden ver suscripciones de sus empresas
-- IMPORTANTE: Usar LEFT JOIN para evitar bloqueos si company_users no existe
CREATE POLICY "Users can view their company subscriptions"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT p.company_id 
      FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.company_id IS NOT NULL
    )
  );

-- SUBSCRIPTIONS: Los admins pueden crear suscripciones
CREATE POLICY "Admins can create subscriptions"
  ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT p.company_id 
      FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin')
      AND p.company_id IS NOT NULL
    )
  );

-- SUBSCRIPTIONS: Los admins pueden actualizar suscripciones
CREATE POLICY "Admins can update subscriptions"
  ON public.subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT p.company_id 
      FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin')
      AND p.company_id IS NOT NULL
    )
  );

-- SUBSCRIPTIONS: Permitir que los triggers del sistema actualicen suscripciones
CREATE POLICY "System can manage subscriptions"
  ON public.subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- PAYMENTS: Los usuarios pueden ver pagos de sus empresas
CREATE POLICY "Users can view their company payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT p.company_id 
      FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.company_id IS NOT NULL
    )
  );

-- PAYMENTS: Los admins pueden crear pagos
CREATE POLICY "Admins can create payments"
  ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT p.company_id 
      FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('owner', 'admin')
      AND p.company_id IS NOT NULL
    )
  );

-- ========================================
-- PASO 3: VERIFICACIÓN
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
  cmd as operacion,
  roles
FROM pg_policies
WHERE tablename IN ('plans', 'subscriptions', 'payments')
ORDER BY tablename, cmd, policyname;

-- Probar acceso a plans (debe funcionar para todos los usuarios autenticados)
SELECT 
  '✓ PRUEBA DE ACCESO - PLANS' as prueba,
  COUNT(*) as total_planes_visibles
FROM plans
WHERE is_active = true;

-- Mensaje final
SELECT 
  '🎉 CONFIGURACIÓN COMPLETADA' as resultado,
  'RLS configurado con políticas más permisivas' as mensaje,
  'El usuario debe cerrar sesión y volver a iniciar' as siguiente_paso;
