-- ============================================================================
-- DEBUG: Ejecutar PASO POR PASO
-- ============================================================================
-- Ejecuta cada query por separado para ver dónde falla
-- ============================================================================

-- PASO 1: Verificar company_users
-- Copia y ejecuta esta query primero:
/*
SELECT 
  'Paso 1: Verificación de company_users' as paso,
  cu.user_id,
  cu.company_id,
  cu.role,
  c.name as company_name
FROM company_users cu
INNER JOIN companies c ON cu.company_id = c.id
WHERE cu.user_id = auth.uid();
*/

-- PASO 2: Verificar purchase_orders
-- Después ejecuta esta:
/*
SELECT 
  'Paso 2: Acceso directo a purchase_orders' as paso,
  COUNT(*) as total_ordenes,
  COUNT(CASE WHEN status = 'received' THEN 1 END) as ordenes_recibidas,
  COUNT(CASE WHEN received_date IS NOT NULL THEN 1 END) as con_fecha_recepcion
FROM purchase_orders
WHERE company_id = '1420bea3-a484-4a32-a429-bfd5a38063a3';
*/

-- PASO 3: Verificar purchase_order_items
/*
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
*/

-- PASO 4: Query exacta (LA MÁS IMPORTANTE)
/*
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
*/

-- PASO 9: Query SIN products JOIN
/*
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
*/
