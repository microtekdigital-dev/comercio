-- Script de diagnóstico específico para problema de acceso con Google Auth
-- El usuario tiene suscripción activa pero no puede acceder
-- Ejecutar en Supabase SQL Editor

-- PASO 1: Verificar el estado completo del usuario
-- REEMPLAZAR 'TU_EMAIL_AQUI@gmail.com' con tu email real
SELECT 
  '=== INFORMACIÓN DEL USUARIO ===' as seccion,
  u.id as user_id,
  u.email,
  u.email_confirmed_at,
  u.last_sign_in_at,
  p.company_id,
  p.role,
  c.name as company_name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN companies c ON c.id = p.company_id
WHERE u.email = 'TU_EMAIL_AQUI@gmail.com';

-- PASO 2: Verificar la suscripción y su validez
SELECT 
  '=== ESTADO DE SUSCRIPCIÓN ===' as seccion,
  s.id as subscription_id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  NOW() as fecha_actual,
  s.current_period_end > NOW() as esta_vigente,
  pl.name as plan_name,
  pl.price as plan_price,
  CASE 
    WHEN s.status = 'active' AND s.current_period_end > NOW() THEN '✓ DEBERÍA TENER ACCESO'
    WHEN s.status = 'active' AND s.current_period_end <= NOW() THEN '✗ SUSCRIPCIÓN EXPIRADA'
    WHEN s.status = 'cancelled' THEN '✗ SUSCRIPCIÓN CANCELADA'
    ELSE '? ESTADO DESCONOCIDO'
  END as diagnostico
FROM subscriptions s
JOIN plans pl ON pl.id = s.plan_id
WHERE s.company_id = (
  SELECT p.company_id 
  FROM profiles p 
  JOIN auth.users u ON u.id = p.id 
  WHERE u.email = 'TU_EMAIL_AQUI@gmail.com'
)
ORDER BY s.created_at DESC
LIMIT 1;

-- PASO 3: Verificar si hay problemas con company_id NULL
SELECT 
  '=== VERIFICACIÓN DE COMPANY_ID ===' as seccion,
  CASE 
    WHEN p.company_id IS NULL THEN '✗ ERROR CRÍTICO: company_id es NULL'
    ELSE '✓ company_id está asignado correctamente'
  END as estado,
  p.company_id,
  p.role
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'TU_EMAIL_AQUI@gmail.com';

-- PASO 4: Verificar membresía en company_users
SELECT 
  '=== VERIFICACIÓN DE COMPANY_USERS ===' as seccion,
  CASE 
    WHEN cu.user_id IS NULL THEN '✗ NO EXISTE EN company_users'
    ELSE '✓ Existe en company_users'
  END as estado,
  cu.company_id,
  cu.role as role_en_company_users
FROM profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN company_users cu ON cu.user_id = u.id AND cu.company_id = p.company_id
WHERE u.email = 'TU_EMAIL_AQUI@gmail.com';

-- PASO 5: Verificar si hay múltiples suscripciones (puede causar conflictos)
SELECT 
  '=== VERIFICACIÓN DE MÚLTIPLES SUSCRIPCIONES ===' as seccion,
  COUNT(*) as total_suscripciones,
  CASE 
    WHEN COUNT(*) > 1 THEN '⚠ ADVERTENCIA: Múltiples suscripciones encontradas'
    WHEN COUNT(*) = 1 THEN '✓ Solo una suscripción'
    ELSE '✗ No hay suscripciones'
  END as diagnostico
FROM subscriptions s
WHERE s.company_id = (
  SELECT p.company_id 
  FROM profiles p 
  JOIN auth.users u ON u.id = p.id 
  WHERE u.email = 'TU_EMAIL_AQUI@gmail.com'
);

-- PASO 6: Ver todas las suscripciones si hay múltiples
SELECT 
  '=== TODAS LAS SUSCRIPCIONES ===' as seccion,
  s.id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  pl.name as plan_name,
  s.created_at
FROM subscriptions s
JOIN plans pl ON pl.id = s.plan_id
WHERE s.company_id = (
  SELECT p.company_id 
  FROM profiles p 
  JOIN auth.users u ON u.id = p.id 
  WHERE u.email = 'TU_EMAIL_AQUI@gmail.com'
)
ORDER BY s.created_at DESC;

-- PASO 7: Verificar políticas RLS que podrían estar bloqueando
SELECT 
  '=== POLÍTICAS RLS EN PROFILES ===' as seccion,
  policyname,
  cmd as comando,
  CASE 
    WHEN cmd = 'SELECT' THEN '✓ Política de lectura'
    ELSE 'Otra política'
  END as tipo
FROM pg_policies
WHERE tablename = 'profiles'
AND schemaname = 'public';

-- PASO 8: Verificar políticas RLS en subscriptions
SELECT 
  '=== POLÍTICAS RLS EN SUBSCRIPTIONS ===' as seccion,
  policyname,
  cmd as comando
FROM pg_policies
WHERE tablename = 'subscriptions'
AND schemaname = 'public';
