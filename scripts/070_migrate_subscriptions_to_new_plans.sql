-- Migrar suscripciones existentes a los nuevos planes
-- Este script actualiza todas las suscripciones activas para que apunten a los nuevos planes

-- IMPORTANTE: Ejecuta este script DESPUÉS de ejecutar seed-plans.sql

-- 1. Migrar suscripciones Trial a nuevo plan Trial
UPDATE subscriptions
SET plan_id = (
  SELECT id FROM plans 
  WHERE name = 'Trial' 
    AND interval = 'month' 
    AND is_active = true
  LIMIT 1
)
WHERE status = 'active'
  AND plan_id IN (
    SELECT id FROM plans 
    WHERE name = 'Trial' 
      AND is_active = false
  );

-- 2. Migrar suscripciones Básico mensuales a nuevo plan Básico mensual
UPDATE subscriptions
SET plan_id = (
  SELECT id FROM plans 
  WHERE name = 'Básico' 
    AND interval = 'month' 
    AND is_active = true
  LIMIT 1
)
WHERE status = 'active'
  AND plan_id IN (
    SELECT id FROM plans 
    WHERE name = 'Básico' 
      AND interval = 'month'
      AND is_active = false
  );

-- 3. Migrar suscripciones Básico anuales a nuevo plan Básico anual
UPDATE subscriptions
SET plan_id = (
  SELECT id FROM plans 
  WHERE name = 'Básico' 
    AND interval = 'year' 
    AND is_active = true
  LIMIT 1
)
WHERE status = 'active'
  AND plan_id IN (
    SELECT id FROM plans 
    WHERE name = 'Básico' 
      AND interval = 'year'
      AND is_active = false
  );

-- 4. Migrar suscripciones Pro mensuales a nuevo plan Pro mensual
UPDATE subscriptions
SET plan_id = (
  SELECT id FROM plans 
  WHERE name = 'Pro' 
    AND interval = 'month' 
    AND is_active = true
  LIMIT 1
)
WHERE status = 'active'
  AND plan_id IN (
    SELECT id FROM plans 
    WHERE name = 'Pro' 
      AND interval = 'month'
      AND is_active = false
  );

-- 5. Migrar suscripciones Pro anuales a nuevo plan Pro anual
UPDATE subscriptions
SET plan_id = (
  SELECT id FROM plans 
  WHERE name = 'Pro' 
    AND interval = 'year' 
    AND is_active = true
  LIMIT 1
)
WHERE status = 'active'
  AND plan_id IN (
    SELECT id FROM plans 
    WHERE name = 'Pro' 
      AND interval = 'year'
      AND is_active = false
  );

-- 6. Migrar suscripciones Empresarial mensuales a nuevo plan Empresarial mensual
UPDATE subscriptions
SET plan_id = (
  SELECT id FROM plans 
  WHERE name = 'Empresarial' 
    AND interval = 'month' 
    AND is_active = true
  LIMIT 1
)
WHERE status = 'active'
  AND plan_id IN (
    SELECT id FROM plans 
    WHERE name = 'Empresarial' 
      AND interval = 'month'
      AND is_active = false
  );

-- 7. Migrar suscripciones Empresarial anuales a nuevo plan Empresarial anual
UPDATE subscriptions
SET plan_id = (
  SELECT id FROM plans 
  WHERE name = 'Empresarial' 
    AND interval = 'year' 
    AND is_active = true
  LIMIT 1
)
WHERE status = 'active'
  AND plan_id IN (
    SELECT id FROM plans 
    WHERE name = 'Empresarial' 
      AND interval = 'year'
      AND is_active = false
  );

-- Verificar el resultado
SELECT 
  COUNT(*) as total_subscriptions,
  p.name as plan_name,
  p.interval,
  p.is_active as plan_is_active,
  p.features
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
GROUP BY p.id, p.name, p.interval, p.is_active, p.features
ORDER BY p.sort_order;

-- Mostrar suscripciones que no se migraron (si hay alguna)
SELECT 
  s.id as subscription_id,
  s.company_id,
  p.name as old_plan_name,
  p.interval,
  p.is_active as plan_is_active
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
  AND p.is_active = false;
