-- ============================================================================
-- DEBUG: Diagnóstico Profundo del Reporte de Liquidación
-- ============================================================================
-- Este script verifica paso a paso por qué las compras no aparecen
-- ============================================================================

-- Paso 1: Verificar que el usuario tiene acceso a company_users
SELECT 
  'Paso 1: Verificación de company_users' as paso,
  cu.user_id,
  cu.company_id,
  cu.role,
  c.name as company_name
FROM company_users cu
INNER JOIN companies c ON cu.company_id = c.id
WHERE cu.user_id = auth.uid();

-- Paso 2: Verificar acceso directo a purchase_orders
SELECT 
  'Paso 2: Acceso directo a purchase_orders' as paso,
  COUNT(*) as total_ordenes,
  COUNT(CASE WHEN status = 'received' THEN 1 END) as ordenes_recibidas,
  COUNT(CASE WHEN received_date IS NOT NULL THEN 1 END) as con_fecha_recepcion
FROM purchase_orders
WHERE company_id = '1420bea3-a484-4a32-a429-bfd5a38063a3';

-- Paso 3: Verificar acceso a purchase_order_items
SELECT 
  'Paso 3: Acceso a purchase_order_items' as paso,
  COUNT(*) as total_items
FROM purchase_order_items poi
WHERE EXISTS (
  SELECT 1 
  FROM purchase_orders po
  WHERE po.id = poi.purchase_order_id
    AND po.company_id = '1420bea3-a484-4a32-a429-bfd5a38063a3'
);

-- Paso 4: Simular la query exacta que usa calculatePurchases
-- Esta es la query EXACTA del código
SELECT 
  'Paso 4: Query exacta de calculatePurchases' as paso,
  poi.product_id,
  poi.variant_id,
  poi.quantity,
  poi.unit_cost,
  po.status,
  po.received_date,
  p.name as product_name
FROM purchase_order_items poi
INNER JOIN purchase_orders po ON poi.purchase_order_id = po.id
INNER JOIN products p ON poi.product_id = p.id
WHERE po.company_id = '1420bea3-a484-4a32-a429-bfd5a38063a3'
  AND po.status = 'received'
  AND po.received_date IS NOT NULL
  AND po.received_date >= '2026-02-01'
  AND po.received_date <= '2026-02-28';

-- Paso 5: Verificar si hay problema con el INNER JOIN de products
SELECT 
  'Paso 5: Verificar JOIN con products' as paso,
  COUNT(*) as items_sin_producto
FROM purchase_order_items poi
INNER JOIN purchase_orders po ON poi.purchase_order_id = po.id
LEFT JOIN products p ON poi.product_id = p.id
WHERE po.company_id = '1420bea3-a484-4a32-a429-bfd5a38063a3'
  AND po.status = 'received'
  AND po.received_date IS NOT NULL
  AND po.received_date >= '2026-02-01'
  AND po.received_date <= '2026-02-28'
  AND p.id IS NULL;

-- Paso 6: Verificar RLS en products
SELECT 
  'Paso 6: Verificar acceso a products' as paso,
  COUNT(*) as total_productos
FROM products
WHERE company_id = '1420bea3-a484-4a32-a429-bfd5a38063a3';

-- Paso 7: Verificar si products tiene RLS habilitado
SELECT 
  'Paso 7: Estado RLS de products' as paso,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'products';

-- Paso 8: Ver políticas RLS de products
SELECT 
  'Paso 8: Políticas RLS de products' as paso,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'products'
ORDER BY cmd, policyname;

-- Paso 9: Probar query SIN el INNER JOIN de products
SELECT 
  'Paso 9: Query SIN products JOIN' as paso,
  poi.product_id,
  poi.variant_id,
  poi.quantity,
  poi.unit_cost,
  po.status,
  po.received_date
FROM purchase_order_items poi
INNER JOIN purchase_orders po ON poi.purchase_order_id = po.id
WHERE po.company_id = '1420bea3-a484-4a32-a429-bfd5a38063a3'
  AND po.status = 'received'
  AND po.received_date IS NOT NULL
  AND po.received_date >= '2026-02-01'
  AND po.received_date <= '2026-02-28';

-- Paso 10: Verificar el product_id específico
SELECT 
  'Paso 10: Verificar producto específico' as paso,
  id,
  name,
  company_id,
  created_at
FROM products
WHERE id = '65df8e2d-6a64-412e-8a44-bddf567b7109';
