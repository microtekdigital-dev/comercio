-- Script para verificar si el usuario se creó correctamente

-- Reemplaza 'email@ejemplo.com' con el email del usuario que creaste
-- 1. Verificar si el usuario existe en auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  confirmed_at
FROM auth.users
WHERE email = 'EMAIL_DEL_USUARIO_AQUI'
ORDER BY created_at DESC;

-- 2. Verificar si el perfil se creó
SELECT 
  id,
  email,
  company_id,
  role,
  created_at
FROM public.profiles
WHERE email = 'EMAIL_DEL_USUARIO_AQUI';

-- 3. Verificar si la empresa se creó
SELECT 
  c.id,
  c.name,
  c.created_at,
  p.email as owner_email
FROM public.companies c
LEFT JOIN public.profiles p ON p.company_id = c.id
WHERE p.email = 'EMAIL_DEL_USUARIO_AQUI';

-- 4. Verificar si la suscripción se creó
SELECT 
  s.id,
  s.status,
  s.created_at,
  pl.name as plan_name,
  p.email as user_email
FROM public.subscriptions s
JOIN public.plans pl ON pl.id = s.plan_id
JOIN public.profiles p ON p.company_id = s.company_id
WHERE p.email = 'EMAIL_DEL_USUARIO_AQUI';

-- 5. Ver si hay errores en los logs (si tienes acceso)
-- Esto mostrará los últimos usuarios creados
SELECT 
  u.email,
  u.email_confirmed_at,
  u.created_at,
  CASE 
    WHEN p.id IS NULL THEN 'NO PROFILE'
    WHEN c.id IS NULL THEN 'NO COMPANY'
    WHEN s.id IS NULL THEN 'NO SUBSCRIPTION'
    ELSE 'OK'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.companies c ON c.id = p.company_id
LEFT JOIN public.subscriptions s ON s.company_id = c.id
ORDER BY u.created_at DESC
LIMIT 10;
