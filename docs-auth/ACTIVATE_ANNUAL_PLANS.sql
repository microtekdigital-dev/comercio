-- Activar planes anuales para múltiples empresas
-- Este script te permite activar planes Básico y Profesional anuales

-- ============================================
-- PASO 1: Ver empresas disponibles
-- ============================================
SELECT 
  'Empresas disponibles:' as info;

SELECT 
  c.id as company_id,
  c.name as company_name,
  s.status as current_status,
  p.name as current_plan,
  p.interval as current_interval
FROM companies c
LEFT JOIN subscriptions s ON c.id = s.company_id AND s.status = 'active'
LEFT JOIN plans p ON s.plan_id = p.id
ORDER BY c.name;

-- ============================================
-- PASO 2: Planes anuales disponibles
-- ============================================
SELECT 
  'Planes anuales disponibles:' as info;

SELECT 
  id,
  name,
  price,
  max_users,
  max_products
FROM plans
WHERE interval = 'year'
AND is_active = true
ORDER BY price;

-- ============================================
-- PASO 3: ACTIVAR PLANES
-- ============================================

-- IMPORTANTE: Descomenta las secciones que necesites

-- --------------------------------------------
-- A) ACTIVAR PLAN PROFESIONAL ANUAL para vanithegameplay
-- --------------------------------------------
/*
-- Cancelar suscripción actual
UPDATE subscriptions
SET status = 'canceled'
WHERE company_id IN (
  SELECT id FROM companies WHERE name ILIKE '%vanithegameplay%'
)
AND status = 'active';

-- Activar Plan Profesional Anual
INSERT INTO subscriptions (
  company_id,
  plan_id,
  status,
  current_period_start,
  current_period_end
)
SELECT 
  c.id,
  'a91ab05b-1944-4991-9901-683e9926e9a4', -- Plan Profesional Anual ($144.000)
  'active',
  NOW(),
  NOW() + INTERVAL '1 year'
FROM companies c
WHERE c.name ILIKE '%vanithegameplay%';
*/

-- --------------------------------------------
-- B) ACTIVAR PLAN BÁSICO ANUAL para otra empresa
-- --------------------------------------------
-- REEMPLAZA 'NOMBRE_EMPRESA' con el nombre real de la empresa
/*
-- Cancelar suscripción actual
UPDATE subscriptions
SET status = 'canceled'
WHERE company_id IN (
  SELECT id FROM companies WHERE name ILIKE '%NOMBRE_EMPRESA%'
)
AND status = 'active';

-- Activar Plan Básico Anual
INSERT INTO subscriptions (
  company_id,
  plan_id,
  status,
  current_period_start,
  current_period_end
)
SELECT 
  c.id,
  '3306f168-e3a7-4e3d-91bf-5bc2a2923498', -- Plan Básico Anual ($51.000)
  'active',
  NOW(),
  NOW() + INTERVAL '1 year'
FROM companies c
WHERE c.name ILIKE '%NOMBRE_EMPRESA%';
*/

-- ============================================
-- PASO 4: VERIFICAR ACTIVACIONES
-- ============================================
SELECT 
  'Suscripciones activas después de la activación:' as info;

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
WHERE s.status = 'active'
AND p.interval = 'year'
ORDER BY c.name;

-- ============================================
-- RESUMEN DE PLANES ANUALES
-- ============================================
SELECT 
  'Resumen de planes anuales:' as info;

SELECT 
  p.name as plan_name,
  p.price as precio_anual,
  p.max_users as usuarios,
  p.max_products as productos,
  COUNT(s.id) as empresas_activas
FROM plans p
LEFT JOIN subscriptions s ON p.id = s.plan_id AND s.status = 'active'
WHERE p.interval = 'year'
AND p.is_active = true
GROUP BY p.id, p.name, p.price, p.max_users, p.max_products
ORDER BY p.price;
