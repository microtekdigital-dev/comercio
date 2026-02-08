-- Script para ver TODAS las suscripciones y encontrar el problema
-- Reemplaza 'EMAIL_DEL_ADMIN' con el email del admin que canceló

-- 1. Ver el usuario y su empresa
SELECT 
  'USUARIO Y EMPRESA' as seccion,
  u.email,
  u.id as user_id,
  p.role,
  p.company_id,
  c.name as company_name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN companies c ON c.id = p.company_id
WHERE u.email = 'EMAIL_DEL_ADMIN';

-- 2. Ver TODAS las suscripciones de esa empresa (ordenadas por fecha)
SELECT 
  'TODAS LAS SUSCRIPCIONES' as seccion,
  s.id as subscription_id,
  s.status,
  s.created_at,
  s.current_period_start,
  s.current_period_end,
  pl.name as plan_name,
  CASE 
    WHEN s.created_at = (
      SELECT MAX(created_at) 
      FROM subscriptions 
      WHERE company_id = s.company_id
    ) THEN '← MÁS RECIENTE'
    ELSE ''
  END as nota
FROM subscriptions s
LEFT JOIN plans pl ON pl.id = s.plan_id
WHERE s.company_id = (
  SELECT company_id 
  FROM profiles 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'EMAIL_DEL_ADMIN')
)
ORDER BY s.created_at DESC;

-- 3. Ver qué suscripción está obteniendo el layout
SELECT 
  'SUSCRIPCIÓN QUE VE EL LAYOUT' as seccion,
  s.id as subscription_id,
  s.status,
  s.created_at,
  pl.name as plan_name
FROM subscriptions s
LEFT JOIN plans pl ON pl.id = s.plan_id
WHERE s.company_id = (
  SELECT company_id 
  FROM profiles 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'EMAIL_DEL_ADMIN')
)
ORDER BY s.created_at DESC
LIMIT 1;

-- 4. Contar cuántas suscripciones hay
SELECT 
  'RESUMEN' as seccion,
  COUNT(*) as total_suscripciones,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as activas,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as canceladas
FROM subscriptions
WHERE company_id = (
  SELECT company_id 
  FROM profiles 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'EMAIL_DEL_ADMIN')
);
