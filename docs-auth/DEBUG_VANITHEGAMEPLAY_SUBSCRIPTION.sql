-- Diagnóstico de suscripción para vanithegameplay
-- Verificar por qué el plan anual no se activó

-- 1. Ver todas las suscripciones de vanithegameplay
SELECT 
  s.id,
  s.status,
  s.created_at,
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
ORDER BY s.created_at DESC;

-- 2. Ver el perfil del usuario
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.company_id,
  c.name as company_name
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.email ILIKE '%vanithegameplay%'
   OR c.name ILIKE '%vanithegameplay%';

-- 3. Ver todos los planes anuales disponibles
SELECT 
  id,
  name,
  interval,
  price,
  is_active,
  max_users,
  max_products
FROM plans
WHERE interval = 'year'
AND is_active = true
ORDER BY price;

-- 4. Ver pagos relacionados (si existen)
SELECT 
  pay.id,
  pay.amount,
  pay.status as payment_status,
  pay.created_at,
  s.status as subscription_status,
  p.name as plan_name,
  c.name as company_name
FROM payments pay
JOIN subscriptions s ON pay.subscription_id = s.id
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE c.name ILIKE '%vanithegameplay%'
ORDER BY pay.created_at DESC;
