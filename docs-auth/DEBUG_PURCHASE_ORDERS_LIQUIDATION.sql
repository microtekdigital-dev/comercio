-- DEBUG: Órdenes de Compra en Reporte de Liquidación
-- Este script ayuda a diagnosticar por qué las órdenes de compra no aparecen en el reporte

-- PASO 1: Ver todas las órdenes de compra recibidas
SELECT 
  po.id,
  po.order_number,
  po.company_id,
  po.status,
  po.order_date,
  po.received_date,
  po.created_at,
  c.name as company_name
FROM purchase_orders po
LEFT JOIN companies c ON c.id = po.company_id
WHERE po.status = 'received'
  AND po.received_date IS NOT NULL
ORDER BY po.received_date DESC
LIMIT 20;

-- PASO 2: Ver items de órdenes recibidas
SELECT 
  po.order_number,
  po.received_date,
  poi.product_id,
  p.name as product_name,
  poi.variant_id,
  pv.variant_name,
  poi.quantity,
  poi.unit_cost,
  (poi.quantity * poi.unit_cost) as total_value
FROM purchase_orders po
JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
JOIN products p ON p.id = poi.product_id
LEFT JOIN product_variants pv ON pv.id = poi.variant_id
WHERE po.status = 'received'
  AND po.received_date IS NOT NULL
ORDER BY po.received_date DESC
LIMIT 50;

-- PASO 3: Verificar órdenes en un rango de fechas específico
-- CAMBIAR ESTAS FECHAS según el período que estés consultando en el reporte
SELECT 
  po.order_number,
  po.received_date,
  po.status,
  COUNT(poi.id) as items_count,
  SUM(poi.quantity * poi.unit_cost) as total_value
FROM purchase_orders po
LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
WHERE po.status = 'received'
  AND po.received_date IS NOT NULL
  AND po.received_date >= '2026-01-01'  -- CAMBIAR FECHA INICIO
  AND po.received_date <= '2026-02-28'  -- CAMBIAR FECHA FIN
GROUP BY po.id, po.order_number, po.received_date, po.status
ORDER BY po.received_date DESC;

-- PASO 4: Ver el tipo de dato de received_date
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'purchase_orders'
  AND column_name IN ('received_date', 'order_date', 'created_at');

-- PASO 5: Verificar si hay órdenes con received_date pero status != 'received'
SELECT 
  po.order_number,
  po.status,
  po.received_date,
  po.order_date
FROM purchase_orders po
WHERE po.received_date IS NOT NULL
  AND po.status != 'received'
ORDER BY po.received_date DESC
LIMIT 20;

-- PASO 6: Ver todas las órdenes de UNA empresa específica
-- CAMBIAR el company_id por el de tu empresa
SELECT 
  po.order_number,
  po.status,
  po.order_date,
  po.received_date,
  po.created_at,
  COUNT(poi.id) as items_count
FROM purchase_orders po
LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
WHERE po.company_id = 'TU_COMPANY_ID_AQUI'  -- CAMBIAR
GROUP BY po.id, po.order_number, po.status, po.order_date, po.received_date, po.created_at
ORDER BY po.created_at DESC;
