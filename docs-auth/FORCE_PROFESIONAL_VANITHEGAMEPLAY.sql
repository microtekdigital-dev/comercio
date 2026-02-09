-- Forzar activación de Plan Profesional Anual para vanithegameplay
-- Este script elimina TODAS las suscripciones y crea una nueva Profesional Anual

-- Paso 1: Ver estado actual
SELECT 
  'ANTES - Estado actual:' as info;

SELECT 
  s.id,
  s.status,
  p.name as plan_name,
  p.interval,
  s.created_at
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE c.name ILIKE '%vanithegameplay%'
ORDER BY s.created_at DESC;

-- Paso 2: ELIMINAR todas las suscripciones existentes de vanithegameplay
DELETE FROM subscriptions
WHERE company_id IN (
  SELECT id FROM companies WHERE name ILIKE '%vanithegameplay%'
);

-- Paso 3: Crear nueva suscripción Profesional Anual
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
  'a91ab05b-1944-4991-9901-683e9926e9a4', -- Plan Profesional Anual
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  NOW(),
  NOW()
FROM companies c
WHERE c.name ILIKE '%vanithegameplay%';

-- Paso 4: Verificar resultado
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

-- Paso 5: Verificar que el plan existe
SELECT 
  'Verificar que el Plan Profesional Anual existe:' as info;

SELECT 
  id,
  name,
  interval,
  price,
  is_active
FROM plans
WHERE id = 'a91ab05b-1944-4991-9901-683e9926e9a4';
