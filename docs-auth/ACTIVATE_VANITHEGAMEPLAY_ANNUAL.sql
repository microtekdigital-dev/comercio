-- Activar suscripción anual para vanithegameplay
-- IMPORTANTE: Ejecutar primero DEBUG_VANITHEGAMEPLAY_SUBSCRIPTION.sql para ver el estado actual

-- Paso 1: Identificar la empresa y el plan
-- Ejecutar esto primero para obtener los IDs necesarios

SELECT 
  'Company ID:' as info,
  c.id as company_id,
  c.name as company_name
FROM companies c
WHERE c.name ILIKE '%vanithegameplay%';

-- Paso 2: Ver qué plan anual quiere activar
SELECT 
  'Planes anuales disponibles:' as info;

SELECT 
  id as plan_id,
  name,
  interval,
  price,
  max_users,
  max_products
FROM plans
WHERE interval = 'year'
AND is_active = true
ORDER BY price;

-- Paso 3: Ver suscripciones actuales
SELECT 
  'Suscripciones actuales:' as info;

SELECT 
  s.id as subscription_id,
  s.status,
  p.name as plan_name,
  p.interval
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE c.name ILIKE '%vanithegameplay%'
ORDER BY s.created_at DESC;

-- Paso 4: ACTIVAR LA SUSCRIPCIÓN
-- Reemplazar los valores según lo que viste en los pasos anteriores

-- Opción A: Si ya existe una suscripción pero está en estado 'pending' o 'incomplete'
-- Reemplazar 'SUBSCRIPTION_ID_AQUI' con el ID de la suscripción
/*
UPDATE subscriptions
SET 
  status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 year'
WHERE id = 'SUBSCRIPTION_ID_AQUI';
*/

-- Opción B: Si necesitas crear una nueva suscripción anual
-- Reemplazar 'COMPANY_ID_AQUI' y 'PLAN_ID_AQUI' con los IDs correctos
/*
-- Primero, cancelar suscripciones activas anteriores
UPDATE subscriptions
SET status = 'canceled'
WHERE company_id = 'COMPANY_ID_AQUI'
AND status = 'active';

-- Luego, crear la nueva suscripción anual
INSERT INTO subscriptions (
  company_id,
  plan_id,
  status,
  current_period_start,
  current_period_end
) VALUES (
  'COMPANY_ID_AQUI',
  'PLAN_ID_AQUI', -- ID del plan anual que quieres activar
  'active',
  NOW(),
  NOW() + INTERVAL '1 year'
);
*/

-- Paso 5: Verificar que se activó correctamente
SELECT 
  'Verificación final:' as info;

SELECT 
  s.id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  p.name as plan_name,
  p.interval,
  p.price,
  c.name as company_name
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE c.name ILIKE '%vanithegameplay%'
AND s.status = 'active'
ORDER BY s.created_at DESC;
