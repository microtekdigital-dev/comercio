-- Verificar estado del usuario freyanimuetarot@gmail.com
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si el usuario existe en auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  confirmation_sent_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'freyanimuetarot@gmail.com';

-- 2. Verificar perfil del usuario
SELECT 
  id,
  email,
  full_name,
  created_at
FROM public.profiles
WHERE email = 'freyanimuetarot@gmail.com';

-- 3. Verificar empresa asociada
SELECT 
  c.id,
  c.name,
  c.slug,
  c.created_at,
  cu.user_id,
  cu.role
FROM public.companies c
JOIN public.company_users cu ON c.id = cu.company_id
JOIN public.profiles p ON cu.user_id = p.id
WHERE p.email = 'freyanimuetarot@gmail.com';

-- 4. Verificar suscripción
SELECT 
  s.id,
  s.company_id,
  s.plan_id,
  pl.name as plan_name,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.created_at
FROM public.subscriptions s
JOIN public.plans pl ON s.plan_id = pl.id
JOIN public.company_users cu ON s.company_id = cu.company_id
JOIN public.profiles p ON cu.user_id = p.id
WHERE p.email = 'freyanimuetarot@gmail.com';
