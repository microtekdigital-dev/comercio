-- ============================================================================
-- DIAGNÓSTICO: Problema de carga infinita después de activar RLS
-- ============================================================================

-- Verificar que el usuario actual tiene sesión
SELECT 
  '🔍 VERIFICACIÓN DE SESIÓN' as paso,
  auth.uid() as user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ NO HAY SESIÓN ACTIVA'
    ELSE '✓ Sesión activa'
  END as estado_sesion;

-- Verificar que el usuario está en profiles
SELECT 
  '🔍 VERIFICACIÓN DE PROFILE' as paso,
  p.id,
  p.email,
  p.company_id,
  p.role,
  CASE 
    WHEN p.company_id IS NULL THEN '⚠️ SIN EMPRESA ASIGNADA'
    ELSE '✓ Empresa asignada'
  END as estado_empresa
FROM profiles p
WHERE p.id = auth.uid();

-- Verificar que el usuario está en company_users
SELECT 
  '🔍 VERIFICACIÓN DE COMPANY_USERS' as paso,
  cu.user_id,
  cu.company_id,
  cu.role,
  c.name as company_name
FROM company_users cu
JOIN companies c ON cu.company_id = c.id
WHERE cu.user_id = auth.uid();

-- Verificar políticas RLS de subscriptions
SELECT 
  '🔍 POLÍTICAS RLS - SUBSCRIPTIONS' as paso,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'subscriptions'
ORDER BY policyname;

-- Verificar políticas RLS de plans
SELECT 
  '🔍 POLÍTICAS RLS - PLANS' as paso,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'plans'
ORDER BY policyname;

-- Verificar políticas RLS de payments
SELECT 
  '🔍 POLÍTICAS RLS - PAYMENTS' as paso,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'payments'
ORDER BY policyname;

-- Intentar acceder a subscriptions (simulando la consulta del código)
SELECT 
  '🔍 PRUEBA DE ACCESO - SUBSCRIPTIONS' as paso,
  s.id,
  s.status,
  s.company_id,
  p.name as plan_name
FROM subscriptions s
LEFT JOIN plans p ON s.plan_id = p.id
WHERE s.company_id IN (
  SELECT company_id 
  FROM company_users 
  WHERE user_id = auth.uid()
)
ORDER BY s.created_at DESC
LIMIT 1;

-- Verificar si hay problemas con la política de plans
SELECT 
  '🔍 PRUEBA DE ACCESO - PLANS' as paso,
  id,
  name,
  price,
  is_active
FROM plans
WHERE is_active = true
ORDER BY sort_order;

-- Mensaje final
SELECT 
  '📋 DIAGNÓSTICO COMPLETADO' as resultado,
  'Revisa los resultados anteriores para identificar el problema' as mensaje;
