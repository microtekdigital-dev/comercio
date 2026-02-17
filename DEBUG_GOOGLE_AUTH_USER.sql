-- Script para diagnosticar problema de acceso con Google Auth
-- Ejecutar en Supabase SQL Editor

-- 1. Buscar tu usuario por email (reemplaza con tu email de Google)
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'TU_EMAIL_AQUI@gmail.com';  -- REEMPLAZAR CON TU EMAIL

-- 2. Verificar si tienes un perfil creado
SELECT 
  p.id,
  p.company_id,
  p.role,
  p.created_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'TU_EMAIL_AQUI@gmail.com';  -- REEMPLAZAR CON TU EMAIL

-- 3. Verificar si tienes una empresa
SELECT 
  c.id,
  c.name,
  c.created_at
FROM companies c
JOIN profiles p ON p.company_id = c.id
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'TU_EMAIL_AQUI@gmail.com';  -- REEMPLAZAR CON TU EMAIL

-- 4. Verificar si tienes una suscripción
SELECT 
  s.id,
  s.plan_id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  pl.name as plan_name
FROM subscriptions s
JOIN profiles p ON p.company_id = s.company_id
JOIN auth.users u ON u.id = p.id
JOIN plans pl ON pl.id = s.plan_id
WHERE u.email = 'TU_EMAIL_AQUI@gmail.com';  -- REEMPLAZAR CON TU EMAIL

-- 5. Ver el trigger que debería crear todo automáticamente
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%handle_new_user%';
