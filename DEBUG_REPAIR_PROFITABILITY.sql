-- Script para diagnosticar por qué no aparecen datos en Rentabilidad por Reparación
-- Ejecutar en Supabase SQL Editor

-- 1. Ver todas las reparaciones con estado 'repaired' o 'delivered'
SELECT 
  ro.id,
  ro.order_number,
  ro.status,
  ro.received_date,
  ro.delivered_date,
  ro.repair_completed_date,
  ro.labor_cost,
  c.name as customer_name
FROM repair_orders ro
LEFT JOIN customers c ON c.id = ro.customer_id
WHERE ro.status IN ('repaired', 'delivered')
ORDER BY ro.received_date DESC;

-- 2. Ver items de reparaciones (repuestos)
SELECT 
  ri.repair_order_id,
  ro.order_number,
  ri.product_name,
  ri.quantity,
  ri.unit_price,
  ri.subtotal
FROM repair_items ri
JOIN repair_orders ro ON ro.id = ri.repair_order_id
WHERE ro.status IN ('repaired', 'delivered')
ORDER BY ro.order_number;

-- 3. Ver pagos de reparaciones
SELECT 
  rp.repair_order_id,
  ro.order_number,
  rp.amount,
  rp.payment_method,
  rp.payment_date
FROM repair_payments rp
JOIN repair_orders ro ON ro.id = rp.repair_order_id
WHERE ro.status IN ('repaired', 'delivered')
ORDER BY ro.order_number;

-- 4. Ver resumen completo de rentabilidad
SELECT 
  ro.order_number,
  ro.status,
  c.name as customer_name,
  ro.labor_cost,
  COALESCE(SUM(ri.subtotal), 0) as parts_cost,
  ro.labor_cost + COALESCE(SUM(ri.subtotal), 0) as total_cost,
  COALESCE(
    (SELECT SUM(amount) FROM repair_payments WHERE repair_order_id = ro.id),
    0
  ) as total_paid
FROM repair_orders ro
LEFT JOIN customers c ON c.id = ro.customer_id
LEFT JOIN repair_items ri ON ri.repair_order_id = ro.id
WHERE ro.status IN ('repaired', 'delivered')
GROUP BY ro.id, ro.order_number, ro.status, c.name, ro.labor_cost
ORDER BY ro.order_number;

-- 5. Verificar si hay reparaciones sin items ni pagos
SELECT 
  ro.order_number,
  ro.status,
  COUNT(ri.id) as item_count,
  COUNT(rp.id) as payment_count
FROM repair_orders ro
LEFT JOIN repair_items ri ON ri.repair_order_id = ro.id
LEFT JOIN repair_payments rp ON rp.repair_order_id = ro.id
WHERE ro.status IN ('repaired', 'delivered')
GROUP BY ro.id, ro.order_number, ro.status
HAVING COUNT(ri.id) = 0 OR COUNT(rp.id) = 0;
