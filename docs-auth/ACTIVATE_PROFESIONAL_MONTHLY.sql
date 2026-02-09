-- Activar Plan Profesional MENSUAL para vanithegameplay
-- Usar plan mensual en lugar de anual para evitar problemas

-- Paso 1: Ver estado actual
SELECT 
  'ANTES - Estado actual:' as info;

SELECT 
  s.id,
  s.status,
  p.name as plan_name,
  p.interval,
  p.price,
  s.created_at
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE c.name ILIKE '%vanithegameplay%'
ORDER BY s.created_at DESC;

-- Paso 2: Obtener ID del plan Profesional MENSUAL
SELECT 
  'Plan Profesional Mensual:' as info;

SELECT 
  id,
  name,
  interval,
  price
FROM plans
WHERE name = 'Profesional'
AND interval = 'month'
AND is_active = true;

-- Paso 3: ELIMINAR todas las suscripciones existentes
DELETE FROM subscriptions
WHERE company_id IN (
  SELECT id FROM companies WHERE name ILIKE '%vanithegameplay%'
);

-- Paso 4: Crear suscripción Profesional MENSUAL
INSERT INTO subscriptions (
  company_id,
  plan_id,
  status,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
)
SELECT 
  c.id,
  p.id, -- Plan Profesional Mensual
  'active',
  NOW(),
  NOW() + INTERVAL '1 month',
  NOW(),
  NOW()
FROM companies c
CROSS JOIN plans p
WHERE c.name ILIKE '%vanithegameplay%'
AND p.name = 'Profesional'
AND p.interval = 'month'
AND p.is_active = true;

-- Paso 5: Verificar resultado
SELECT 
  'DESPUÉS - Nueva suscripción:' as info;

SELECT 
  s.id,
  s.status,
  p.name as plan_name,
  p.interval,
  p.price,
  s.current_period_start,
  s.current_period_end,
  c.name as company_name
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE c.name ILIKE '%vanithegameplay%';
