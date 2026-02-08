-- Script para verificar TODAS las suscripciones de una empresa
-- Reemplaza 'EMAIL_DEL_ADMIN' con el email del admin

-- Ver todas las suscripciones de la empresa
SELECT 
  c.name as company_name,
  c.id as company_id,
  s.id as subscription_id,
  s.status,
  s.created_at,
  s.current_period_start,
  s.current_period_end,
  pl.name as plan_name
FROM companies c
LEFT JOIN subscriptions s ON s.company_id = c.id
LEFT JOIN plans pl ON pl.id = s.plan_id
WHERE c.id = (
  SELECT company_id 
  FROM profiles 
  WHERE id = (
    SELECT id FROM auth.users WHERE email = 'EMAIL_DEL_ADMIN'
  )
)
ORDER BY s.created_at DESC;

-- Ver todos los usuarios de la empresa
SELECT 
  u.email,
  p.role,
  p.company_id,
  c.name as company_name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN companies c ON c.id = p.company_id
WHERE p.company_id = (
  SELECT company_id 
  FROM profiles 
  WHERE id = (
    SELECT id FROM auth.users WHERE email = 'EMAIL_DEL_ADMIN'
  )
);
