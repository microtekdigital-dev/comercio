-- DEBUG: Órdenes de Compra en Reporte de Liquidación
-- Este script ayuda a diagnosticar por qué las órdenes recibidas no aparecen en el reporte

-- 1. Ver todas las órdenes de compra con estado "received"
SELECT 
  po.id,
  po.order_number,
  po.company_id,
  po.status,
  po.order_date,
  po.received_date,
  po.total,
  c.name as company_name
FROM purchase_orders po
LEFT JOIN companies c ON c.id = po.company_id
WHERE po.status = 'received'
ORDER BY po.received_date DESC;

-- 2. Ver items de órdenes recibidas
SELECT 
  po.order_number,
  po.status,
  po.received_date,
  poi.product_name,
  poi.quantity,
  poi.unit_cost,
  p.name as product_name_from_table
FROM purchase_orders po
JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
LEFT JOIN products p ON p.id = poi.product_id
WHERE po.status = 'received'
ORDER BY po.received_date DESC;

-- 3. Verificar si received_date es NULL
SELECT 
  order_number,
  status,
  order_date,
  received_date,
  CASE 
    WHEN received_date IS NULL THEN 'NULL'
    ELSE 'HAS DATE'
  END as date_status
FROM purchase_orders
WHERE status = 'received';

-- 4. Ver órdenes recibidas en un rango de fechas específico
-- Ajusta las fechas según tu período de reporte
SELECT 
  po.order_number,
  po.status,
  po.received_date,
  COUNT(poi.id) as item_count,
  SUM(poi.quantity) as total_quantity
FROM purchase_orders po
LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
WHERE po.status = 'received'
  AND po.received_date >= '2024-01-01'  -- Ajusta esta fecha
  AND po.received_date <= '2026-12-31'  -- Ajusta esta fecha
GROUP BY po.id, po.order_number, po.status, po.received_date
ORDER BY po.received_date DESC;

-- 5. Verificar la consulta exacta que usa el reporte
-- Esta es la consulta que debería funcionar
SELECT 
  poi.product_id,
  poi.variant_id,
  poi.quantity,
  poi.unit_cost,
  po.status,
  po.received_date,
  p.name as product_name,
  p.category_id
FROM purchase_order_items poi
JOIN purchase_orders po ON po.id = poi.purchase_order_id
JOIN products p ON p.id = poi.product_id
WHERE po.status = 'received'
  AND po.received_date IS NOT NULL
  AND po.received_date >= '2024-01-01'::date  -- Ajusta esta fecha
  AND po.received_date <= '2026-12-31'::date  -- Ajusta esta fecha
ORDER BY po.received_date DESC;

-- 6. Ver si hay problema con el tipo de dato
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'purchase_orders'
  AND column_name IN ('order_date', 'received_date', 'expected_date');
