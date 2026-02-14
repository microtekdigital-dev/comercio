-- Script para diagnosticar y corregir el acceso a órdenes de compra de vanithegameplay
-- Ejecutar este script en Supabase SQL Editor

-- PASO 1: Verificar el plan actual del usuario
SELECT 
  c.id as company_id,
  c.name as company_name,
  s.id as subscription_id,
  s.status as subscription_status,
  p.id as plan_id,
  p.name as plan_name,
  p.interval,
  p.price,
  s.current_period_start,
  s.current_period_end,
  p.features
FROM companies c
LEFT JOIN subscriptions s ON c.id = s.company_id AND s.status = 'active'
LEFT JOIN plans p ON s.plan_id = p.id
WHERE c.id IN (
  SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com'
)
ORDER BY s.created_at DESC;

-- PASO 2: Verificar si el plan tiene las características correctas
-- Los planes Profesional y Empresarial deben incluir "Órdenes de compra" en features
SELECT 
  id,
  name,
  interval,
  price,
  features,
  CASE 
    WHEN features::text LIKE '%rdenes de compra%' THEN 'SÍ tiene órdenes de compra'
    WHEN features::text LIKE '%purchase_orders%' THEN 'SÍ tiene purchase_orders'
    ELSE 'NO tiene órdenes de compra'
  END as tiene_ordenes
FROM plans
WHERE name IN ('Profesional', 'Empresarial')
ORDER BY name, interval;

-- PASO 3: Si el usuario tiene plan Profesional o Empresarial pero no puede acceder,
-- verificar que la suscripción esté activa
SELECT 
  'Estado de suscripción' as verificacion,
  s.status,
  s.current_period_start,
  s.current_period_end,
  CASE 
    WHEN s.status = 'active' THEN 'Suscripción activa ✓'
    WHEN s.status = 'cancelled' THEN 'Suscripción cancelada ✗'
    WHEN s.status = 'expired' THEN 'Suscripción expirada ✗'
    ELSE 'Estado: ' || s.status
  END as estado_detallado
FROM subscriptions s
WHERE s.company_id IN (
  SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com'
)
ORDER BY s.created_at DESC
LIMIT 1;

-- PASO 4: Verificar que el plan tenga max_users y max_products configurados
SELECT 
  id,
  name,
  interval,
  max_users,
  max_products,
  CASE 
    WHEN max_users IS NULL THEN 'FALTA max_users'
    WHEN max_products IS NULL THEN 'FALTA max_products'
    ELSE 'Configuración OK'
  END as estado_limites
FROM plans
WHERE name IN ('Profesional', 'Empresarial')
ORDER BY name, interval;

-- PASO 5: Si falta configuración, aplicar fix
-- Actualizar límites de usuarios y productos si no existen
UPDATE plans
SET 
  max_users = CASE 
    WHEN name = 'Básico' THEN 3
    WHEN name = 'Profesional' THEN 10
    WHEN name = 'Empresarial' THEN 999999
    ELSE max_users
  END,
  max_products = CASE 
    WHEN name = 'Básico' THEN 500
    WHEN name = 'Profesional' THEN 2000
    WHEN name = 'Empresarial' THEN 999999
    ELSE max_products
  END
WHERE name IN ('Básico', 'Profesional', 'Empresarial')
  AND (max_users IS NULL OR max_products IS NULL);

-- PASO 6: Verificación final
SELECT 
  'Verificación final' as paso,
  c.name as empresa,
  p.name as plan,
  p.interval,
  s.status as estado_suscripcion,
  p.max_users as limite_usuarios,
  p.max_products as limite_productos,
  CASE 
    WHEN p.name IN ('Profesional', 'Empresarial') THEN 'TIENE ACCESO a órdenes de compra ✓'
    ELSE 'NO tiene acceso a órdenes de compra ✗'
  END as acceso_ordenes_compra
FROM companies c
JOIN subscriptions s ON c.id = s.company_id AND s.status = 'active'
JOIN plans p ON s.plan_id = p.id
WHERE c.id IN (
  SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com'
);
