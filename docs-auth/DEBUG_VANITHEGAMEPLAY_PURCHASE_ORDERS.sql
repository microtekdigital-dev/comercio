-- Script de diagnóstico para problemas con órdenes de compra de vanithegameplay
-- Ejecutar este script en Supabase SQL Editor

-- 1. Verificar información de la empresa y su plan
SELECT 
  c.id as company_id,
  c.name as company_name,
  s.plan_id,
  p.name as plan_name,
  p.features,
  s.status as subscription_status,
  s.current_period_start,
  s.current_period_end
FROM companies c
LEFT JOIN subscriptions s ON c.id = s.company_id AND s.status = 'active'
LEFT JOIN plans p ON s.plan_id = p.id
WHERE c.id IN (
  SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com'
)
ORDER BY c.created_at DESC;

-- 2. Verificar permisos del usuario
SELECT 
  p.id as profile_id,
  p.email,
  p.full_name,
  p.role,
  p.company_id,
  c.name as company_name
FROM profiles p
JOIN companies c ON p.company_id = c.id
WHERE p.email = 'vanithegameplay@gmail.com';

-- 3. Verificar órdenes de compra existentes
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
  SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com'
)
ORDER BY po.created_at DESC
LIMIT 10;

-- 4. Verificar proveedores
SELECT 
  s.id,
  s.name,
  s.status,
  s.created_at
FROM suppliers s
WHERE s.company_id IN (
  SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com'
)
ORDER BY s.created_at DESC;

-- 5. Verificar productos
SELECT 
  p.id,
  p.name,
  p.sku,
  p.cost,
  p.price,
  p.is_active,
  p.has_variants,
  p.created_at
FROM products p
WHERE p.company_id IN (
  SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com'
)
ORDER BY p.created_at DESC
LIMIT 10;

-- 6. Verificar si hay productos con variantes
SELECT 
  p.id as product_id,
  p.name as product_name,
  pv.id as variant_id,
  pv.variant_name,
  pv.stock_quantity
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE p.company_id IN (
  SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com'
)
  AND p.has_variants = true
ORDER BY p.created_at DESC
LIMIT 20;

-- 7. Verificar si hay errores en los datos
SELECT 
  'Productos sin costo' as issue,
  COUNT(*) as count
FROM products
WHERE company_id IN (SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com')
  AND (cost IS NULL OR cost = 0)
  AND is_active = true

UNION ALL

SELECT 
  'Proveedores inactivos' as issue,
  COUNT(*) as count
FROM suppliers
WHERE company_id IN (SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com')
  AND status != 'active'

UNION ALL

SELECT 
  'Órdenes con números duplicados' as issue,
  COUNT(*) as count
FROM (
  SELECT order_number, COUNT(*) as cnt
  FROM purchase_orders
  WHERE company_id IN (SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com')
  GROUP BY order_number
  HAVING COUNT(*) > 1
) duplicates

UNION ALL

SELECT 
  'Productos con variantes pero sin variantes creadas' as issue,
  COUNT(*) as count
FROM products p
WHERE p.company_id IN (SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com')
  AND p.has_variants = true
  AND NOT EXISTS (
    SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id
  );

-- 8. Verificar acceso a órdenes de compra según el plan
SELECT 
  'Acceso a órdenes de compra' as verificacion,
  p.name as plan_nombre,
  p.interval as plan_intervalo,
  CASE 
    WHEN p.name IN ('Profesional', 'Empresarial', 'Pro') THEN 'PERMITIDO ✓'
    WHEN p.name = 'Básico' THEN 'NO PERMITIDO (requiere plan Profesional o superior) ✗'
    WHEN p.name = 'Trial' THEN 'NO PERMITIDO (requiere plan de pago) ✗'
    ELSE 'ESTADO DESCONOCIDO'
  END as estado_acceso,
  p.features
FROM profiles prof
JOIN companies c ON prof.company_id = c.id
LEFT JOIN subscriptions s ON c.id = s.company_id AND s.status = 'active'
LEFT JOIN plans p ON s.plan_id = p.id
WHERE prof.email = 'vanithegameplay@gmail.com';
