-- Script de diagnóstico completo para problema de acceso con Google Auth
-- Ejecutar en Supabase SQL Editor

-- 1. Ver información completa del usuario
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.last_sign_in_at,
  u.created_at,
  p.company_id,
  p.role,
  c.name as company_name,
  s.status as subscription_status,
  s.current_period_end,
  pl.name as plan_name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN companies c ON c.id = p.company_id
LEFT JOIN subscriptions s ON s.company_id = c.id
LEFT JOIN plans pl ON pl.id = s.plan_id
WHERE u.email = 'TU_EMAIL_AQUI@gmail.com';  -- REEMPLAZAR CON TU EMAIL

-- 2. Verificar si la fecha de expiración está en el futuro
SELECT 
  s.current_period_end,
  NOW() as fecha_actual,
  s.current_period_end > NOW() as esta_vigente,
  CASE 
    WHEN s.current_period_end > NOW() THEN 'VIGENTE'
    ELSE 'EXPIRADO'
  END as estado_real
FROM subscriptions s
JOIN profiles p ON p.company_id = s.company_id
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'TU_EMAIL_AQUI@gmail.com';  -- REEMPLAZAR CON TU EMAIL

-- 3. Verificar políticas RLS en la tabla profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';

-- 4. Verificar si el perfil tiene company_id NULL
SELECT 
  p.id,
  p.company_id,
  p.role,
  CASE 
    WHEN p.company_id IS NULL THEN 'ERROR: company_id es NULL'
    ELSE 'OK'
  END as estado_company
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'TU_EMAIL_AQUI@gmail.com';  -- REEMPLAZAR CON TU EMAIL

-- 5. Verificar políticas RLS en subscriptions
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'subscriptions';
