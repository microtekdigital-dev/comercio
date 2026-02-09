-- Diagnóstico de plan y features
-- Verificar por qué no aparecen las funcionalidades del plan Profesional

-- 1. Ver tu suscripción activa
SELECT 
  s.id as subscription_id,
  s.status,
  s.company_id,
  c.name as company_name,
  p.name as plan_name,
  p.interval,
  p.price,
  p.max_users,
  p.max_products,
  p.features,
  s.current_period_start,
  s.current_period_end
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
ORDER BY s.created_at DESC;

-- 2. Ver todos los planes disponibles
SELECT 
  id,
  name,
  interval,
  price,
  max_users,
  max_products,
  is_active,
  features
FROM plans
WHERE is_active = true
ORDER BY sort_order;

-- 3. Verificar si el plan se llama "Profesional" o "Pro"
SELECT DISTINCT name 
FROM plans 
WHERE is_active = true;
