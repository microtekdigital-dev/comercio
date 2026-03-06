-- Script de diagnóstico para la suscripción de Microtek
-- Ejecutar en Supabase SQL Editor

-- 1. Ver información de Microtek
SELECT 
  c.id as company_id,
  c.name as company_name,
  c.created_at as company_created
FROM companies c
WHERE c.name ILIKE '%microtek%';

-- 2. Ver suscripción actual de Microtek
SELECT 
  s.id,
  s.company_id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  s.created_at,
  p.name as plan_name,
  p.price,
  -- Fecha de vencimiento en formato legible (Argentina timezone)
  TO_CHAR(s.current_period_end AT TIME ZONE 'America/Argentina/Buenos_Aires', 'DD/MM/YYYY HH24:MI:SS') as vence_el,
  -- Días restantes
  EXTRACT(DAY FROM (s.current_period_end::timestamp - NOW())) as days_remaining,
  -- Horas restantes
  EXTRACT(EPOCH FROM (s.current_period_end::timestamp - NOW())) / 3600 as hours_remaining,
  -- Verificar si está vencido
  CASE 
    WHEN s.current_period_end < NOW() THEN 'VENCIDO ❌'
    ELSE 'ACTIVO ✅'
  END as estado_real,
  -- Hora actual del servidor
  NOW() as server_time,
  TO_CHAR(NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires', 'DD/MM/YYYY HH24:MI:SS') as hora_argentina
FROM subscriptions s
LEFT JOIN plans p ON s.plan_id = p.id
LEFT JOIN companies c ON s.company_id = c.id
WHERE c.name ILIKE '%microtek%'
ORDER BY s.created_at DESC;

-- 3. Ver usuarios de Microtek
SELECT 
  p.id as profile_id,
  au.email,
  p.role,
  p.company_id,
  c.name as company_name
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
LEFT JOIN companies c ON p.company_id = c.id
WHERE c.name ILIKE '%microtek%';
