-- Limpiar suscripciones duplicadas de vanithegameplay
-- Mantener solo el Plan Profesional Anual activo

-- Paso 1: Ver todas las suscripciones actuales de vanithegameplay
SELECT 
  'Suscripciones actuales de vanithegameplay:' as info;

SELECT 
  s.id as subscription_id,
  s.status,
  s.created_at,
  p.name as plan_name,
  p.interval,
  p.price,
  s.current_period_start,
  s.current_period_end
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE c.name ILIKE '%vanithegameplay%'
ORDER BY s.created_at DESC;

-- Paso 2: Cancelar todas las suscripciones que NO sean Profesional Anual
UPDATE subscriptions
SET status = 'canceled'
WHERE company_id IN (
  SELECT id FROM companies WHERE name ILIKE '%vanithegameplay%'
)
AND plan_id != 'a91ab05b-1944-4991-9901-683e9926e9a4' -- Mantener solo Profesional Anual
AND status = 'active';

-- Paso 3: Asegurar que el Plan Profesional Anual esté activo
UPDATE subscriptions
SET 
  status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 year'
WHERE company_id IN (
  SELECT id FROM companies WHERE name ILIKE '%vanithegameplay%'
)
AND plan_id = 'a91ab05b-1944-4991-9901-683e9926e9a4' -- Plan Profesional Anual
AND status != 'active';

-- Paso 4: Verificar el resultado final
SELECT 
  'Resultado final - Solo Plan Profesional activo:' as info;

SELECT 
  s.id as subscription_id,
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
WHERE c.name ILIKE '%vanithegameplay%'
ORDER BY s.status DESC, s.created_at DESC;

-- Paso 5: Ver todos los planes disponibles (sin cambios)
SELECT 
  'Todos los planes siguen disponibles:' as info;

SELECT 
  name,
  interval,
  price,
  is_active
FROM plans
WHERE is_active = true
ORDER BY price;
