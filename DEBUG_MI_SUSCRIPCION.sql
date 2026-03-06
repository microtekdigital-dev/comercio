-- Script para identificar TU suscripción específica
-- Ejecutar en Supabase SQL Editor

-- Primero, identifica tu email/usuario
-- Reemplaza 'TU_EMAIL_AQUI' con tu email real
SELECT 
  p.id as profile_id,
  p.company_id,
  p.role,
  au.email,
  c.name as company_name
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
LEFT JOIN companies c ON p.company_id = c.id
WHERE au.email = 'TU_EMAIL_AQUI';  -- <-- REEMPLAZA ESTO

-- Luego, con tu company_id, ver tu suscripción
-- Reemplaza 'TU_COMPANY_ID_AQUI' con el company_id del query anterior
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
  -- Fecha de vencimiento en formato legible
  TO_CHAR(s.current_period_end AT TIME ZONE 'America/Argentina/Buenos_Aires', 'DD/MM/YYYY HH24:MI:SS') as vence_el,
  -- Días restantes
  EXTRACT(DAY FROM (s.current_period_end::timestamp - NOW())) as days_remaining,
  -- Verificar si está vencido
  CASE 
    WHEN s.current_period_end < NOW() THEN 'VENCIDO ❌'
    ELSE 'ACTIVO ✅'
  END as estado_real
FROM subscriptions s
LEFT JOIN plans p ON s.plan_id = p.id
WHERE s.company_id = 'TU_COMPANY_ID_AQUI'  -- <-- REEMPLAZA ESTO
ORDER BY s.created_at DESC;
