-- Activar plan anual para vanithegameplay
-- Este script activa el plan Profesional Anual por defecto

-- Paso 1: Ver el estado actual de vanithegameplay
SELECT 
  'Estado actual de vanithegameplay:' as info;

SELECT 
  c.id as company_id,
  c.name as company_name,
  s.id as subscription_id,
  s.status,
  p.name as plan_name,
  p.interval,
  p.price,
  s.current_period_start,
  s.current_period_end
FROM companies c
LEFT JOIN subscriptions s ON c.id = s.company_id AND s.status = 'active'
LEFT JOIN plans p ON s.plan_id = p.id
WHERE c.name ILIKE '%vanithegameplay%';

-- Paso 2: Cancelar suscripción Trial actual (si existe)
UPDATE subscriptions
SET status = 'canceled'
WHERE company_id IN (
  SELECT id FROM companies WHERE name ILIKE '%vanithegameplay%'
)
AND status = 'active';

-- Paso 3: Activar Plan Profesional Anual ($144.000/año)
INSERT INTO subscriptions (
  company_id,
  plan_id,
  status,
  current_period_start,
  current_period_end
)
SELECT 
  c.id,
  'a91ab05b-1944-4991-9901-683e9926e9a4', -- Plan Profesional Anual
  'active',
  NOW(),
  NOW() + INTERVAL '1 year'
FROM companies c
WHERE c.name ILIKE '%vanithegameplay%';

-- ALTERNATIVA: Si prefieres Plan Empresarial Anual ($184.000/año)
-- Comenta el INSERT de arriba y descomenta este:
/*
INSERT INTO subscriptions (
  company_id,
  plan_id,
  status,
  current_period_start,
  current_period_end
)
SELECT 
  c.id,
  '9a0350da-9929-47d3-a770-5f50c4982810', -- Plan Empresarial Anual
  'active',
  NOW(),
  NOW() + INTERVAL '1 year'
FROM companies c
WHERE c.name ILIKE '%vanithegameplay%';
*/

-- Paso 4: Verificar que se activó correctamente
SELECT 
  'Verificación - Plan activado:' as info;

SELECT 
  c.name as company_name,
  s.status,
  p.name as plan_name,
  p.interval,
  p.price,
  s.current_period_start,
  s.current_period_end,
  p.max_users,
  p.max_products
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE c.name ILIKE '%vanithegameplay%'
AND s.status = 'active'
ORDER BY s.created_at DESC;
