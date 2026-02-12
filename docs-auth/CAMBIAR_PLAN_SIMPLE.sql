-- ============================================
-- CAMBIAR PLAN DE USUARIO - VERSIÓN SIMPLE
-- ============================================
-- Usa este script cuando solo necesitas cambiar rápidamente el plan

-- 1. BUSCAR USUARIO POR EMAIL
-- Reemplaza 'email@ejemplo.com' con el email del usuario
WITH user_info AS (
  SELECT 
    u.id as user_id,
    u.email,
    cu.company_id,
    c.name as company_name
  FROM auth.users u
  JOIN public.company_users cu ON cu.user_id = u.id
  JOIN public.companies c ON c.id = cu.company_id
  WHERE u.email = 'email@ejemplo.com'
)
SELECT * FROM user_info;

-- 2. VER PLANES DISPONIBLES
-- Trial, Básico, Profesional, Empresarial
SELECT id, name, price, interval FROM public.plans WHERE is_active = true;

-- 3. CAMBIAR A PLAN ESPECÍFICO
-- Opción A: Cambiar a Plan Trial (7 días gratis)
UPDATE public.subscriptions
SET 
  plan_id = (SELECT id FROM public.plans WHERE name = 'Trial' LIMIT 1),
  status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '7 days',
  updated_at = NOW()
WHERE company_id = (
  SELECT cu.company_id 
  FROM auth.users u
  JOIN public.company_users cu ON cu.user_id = u.id
  WHERE u.email = 'email@ejemplo.com'
  LIMIT 1
)
AND status = 'active';

-- Opción B: Cambiar a Plan Básico
UPDATE public.subscriptions
SET 
  plan_id = (SELECT id FROM public.plans WHERE name = 'Básico' LIMIT 1),
  status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 month',
  updated_at = NOW()
WHERE company_id = (
  SELECT cu.company_id 
  FROM auth.users u
  JOIN public.company_users cu ON cu.user_id = u.id
  WHERE u.email = 'email@ejemplo.com'
  LIMIT 1
)
AND status = 'active';

-- Opción C: Cambiar a Plan Profesional
UPDATE public.subscriptions
SET 
  plan_id = (SELECT id FROM public.plans WHERE name = 'Profesional' LIMIT 1),
  status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 month',
  updated_at = NOW()
WHERE company_id = (
  SELECT cu.company_id 
  FROM auth.users u
  JOIN public.company_users cu ON cu.user_id = u.id
  WHERE u.email = 'email@ejemplo.com'
  LIMIT 1
)
AND status = 'active';

-- Opción D: Cambiar a Plan Empresarial
UPDATE public.subscriptions
SET 
  plan_id = (SELECT id FROM public.plans WHERE name = 'Empresarial' LIMIT 1),
  status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 month',
  updated_at = NOW()
WHERE company_id = (
  SELECT cu.company_id 
  FROM auth.users u
  JOIN public.company_users cu ON cu.user_id = u.id
  WHERE u.email = 'email@ejemplo.com'
  LIMIT 1
)
AND status = 'active';

-- 4. VERIFICAR EL CAMBIO
SELECT 
  u.email,
  c.name as company_name,
  p.name as plan_actual,
  s.status,
  s.current_period_end as vence_el
FROM auth.users u
JOIN public.company_users cu ON cu.user_id = u.id
JOIN public.companies c ON c.id = cu.company_id
JOIN public.subscriptions s ON s.company_id = c.id AND s.status = 'active'
JOIN public.plans p ON p.id = s.plan_id
WHERE u.email = 'email@ejemplo.com';
