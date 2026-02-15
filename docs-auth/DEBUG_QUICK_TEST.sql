-- ============================================================================
-- TEST RÁPIDO: Comparar query CON y SIN products JOIN
-- ============================================================================

-- TEST 1: Query SIN products (debería funcionar)
SELECT 
  'TEST 1: SIN products JOIN' as test,
  COUNT(*) as total_registros
FROM purchase_order_items poi
INNER JOIN purchase_orders po ON poi.purchase_order_id = po.id
WHERE po.company_id = '1420bea3-a484-4a32-a429-bfd5a38063a3'
  AND po.status = 'received'
  AND po.received_date IS NOT NULL
  AND po.received_date >= '2026-02-01'
  AND po.received_date <= '2026-02-28';

-- TEST 2: Query CON products (probablemente devuelve 0)
SELECT 
  'TEST 2: CON products JOIN' as test,
  COUNT(*) as total_registros
FROM purchase_order_items poi
INNER JOIN purchase_orders po ON poi.purchase_order_id = po.id
INNER JOIN products p ON poi.product_id = p.id
WHERE po.company_id = '1420bea3-a484-4a32-a429-bfd5a38063a3'
  AND po.status = 'received'
  AND po.received_date IS NOT NULL
  AND po.received_date >= '2026-02-01'
  AND po.received_date <= '2026-02-28';

-- TEST 3: Ver si hay items sin producto válido
SELECT 
  'TEST 3: Items sin producto' as test,
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
