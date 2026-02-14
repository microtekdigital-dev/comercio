-- Script de diagnóstico para problemas con órdenes de compra
-- Ejecutar este script en Supabase SQL Editor

-- 1. Verificar información de la empresa y su plan
SELECT 
  c.id as company_id,
  c.name as company_name,
  s.plan_id,
  p.name as plan_name,
  p.features,
  s.status as subscription_status,
  s.created_at as subscription_created,
  s.updated_at as subscription_updated
FROM companies c
LEFT JOIN subscriptions s ON c.id = s.company_id AND s.status = 'active'
LEFT JOIN plans p ON s.plan_id = p.id
WHERE c.name ILIKE '%vanithegameplay%'  -- Reemplazar con el nombre de la empresa
ORDER BY c.created_at DESC;

-- 2. Verificar permisos del usuario en la empresa
SELECT 
  p.id as profile_id,
  p.email,
  p.full_name,
  p.role,
  p.company_id,
  c.name as company_name
FROM profiles p
JOIN companies c ON p.company_id = c.id
WHERE c.name ILIKE '%[NOMBRE_EMPRESA]%'  -- Reemplazar con el nombre de la empresa
ORDER BY p.created_at DESC;

-- 3. Verificar órdenes de compra existentes de la empresa
SELECT 
  po.id,
  po.order_number,
  po.status,
  po.order_date,
  po.total,
  po.created_at,
  s.name as supplier_name
FROM purchase_orders po
LEFT JOIN suppliers s ON po.supplier_id = s.id
WHERE po.company_id IN (
  SELECT id FROM companies WHERE name ILIKE '%[NOMBRE_EMPRESA]%'
)
ORDER BY po.created_at DESC
LIMIT 10;

-- 4. Verificar proveedores de la empresa
SELECT 
  s.id,
  s.name,
  s.status,
  s.created_at
FROM suppliers s
WHERE s.company_id IN (
  SELECT id FROM companies WHERE name ILIKE '%[NOMBRE_EMPRESA]%'
)
ORDER BY s.created_at DESC;

-- 5. Verificar productos de la empresa
SELECT 
  p.id,
  p.name,
  p.sku,
  p.cost,
  p.is_active,
  p.created_at
FROM products p
WHERE p.company_id IN (
  SELECT id FROM companies WHERE name ILIKE '%[NOMBRE_EMPRESA]%'
)
ORDER BY p.created_at DESC
LIMIT 10;

-- 6. Verificar si hay errores en los datos
SELECT 
  'Productos sin costo' as issue,
  COUNT(*) as count
FROM products
WHERE company_id IN (SELECT id FROM companies WHERE name ILIKE '%[NOMBRE_EMPRESA]%')
  AND (cost IS NULL OR cost = 0)
  AND is_active = true

UNION ALL

SELECT 
  'Proveedores inactivos' as issue,
  COUNT(*) as count
FROM suppliers
WHERE company_id IN (SELECT id FROM companies WHERE name ILIKE '%[NOMBRE_EMPRESA]%')
  AND status != 'active'

UNION ALL

SELECT 
  'Órdenes con números duplicados' as issue,
  COUNT(*) as count
FROM (
  SELECT order_number, COUNT(*) as cnt
  FROM purchase_orders
  WHERE company_id IN (SELECT id FROM companies WHERE name ILIKE '%[NOMBRE_EMPRESA]%')
  GROUP BY order_number
  HAVING COUNT(*) > 1
) duplicates;
