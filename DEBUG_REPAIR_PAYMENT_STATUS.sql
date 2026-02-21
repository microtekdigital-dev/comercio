-- Script para diagnosticar el estado de pago de una reparación
-- Ejecutar en Supabase SQL Editor

-- PASO 1: Ver todas las reparaciones con sus totales
SELECT 
  ro.id,
  ro.order_number,
  ro.status,
  ro.labor_cost,
  -- Calcular total de repuestos
  COALESCE(SUM(ri.subtotal), 0) as total_parts,
  -- Calcular costo total
  ro.labor_cost + COALESCE(SUM(ri.subtotal), 0) as total_cost,
  -- Calcular total pagado
  (SELECT COALESCE(SUM(rp.amount), 0) 
   FROM repair_payments rp 
   WHERE rp.repair_order_id = ro.id) as total_paid,
  -- Calcular balance
  (ro.labor_cost + COALESCE(SUM(ri.subtotal), 0)) - 
  (SELECT COALESCE(SUM(rp.amount), 0) 
   FROM repair_payments rp 
   WHERE rp.repair_order_id = ro.id) as balance
FROM repair_orders ro
LEFT JOIN repair_items ri ON ri.repair_order_id = ro.id
GROUP BY ro.id, ro.order_number, ro.status, ro.labor_cost
ORDER BY ro.order_number DESC
LIMIT 20;

-- PASO 2: Ver detalles de una reparación específica (reemplazar con el número de orden)
-- Cambiar '1' por el número de orden que está mostrando incorrectamente
SELECT 
  'Orden de Reparación' as tipo,
  ro.order_number,
  ro.status,
  ro.labor_cost
FROM repair_orders ro
WHERE ro.order_number = 1; -- CAMBIAR ESTE NÚMERO

-- PASO 3: Ver los items/repuestos de esa reparación
SELECT 
  'Items/Repuestos' as tipo,
  ri.id,
  ri.product_id,
  ri.quantity,
  ri.unit_price,
  ri.subtotal
FROM repair_items ri
JOIN repair_orders ro ON ro.id = ri.repair_order_id
WHERE ro.order_number = 1; -- CAMBIAR ESTE NÚMERO

-- PASO 4: Ver los pagos de esa reparación
SELECT 
  'Pagos' as tipo,
  rp.id,
  rp.amount,
  rp.payment_method,
  rp.payment_date,
  rp.notes
FROM repair_payments rp
JOIN repair_orders ro ON ro.id = rp.repair_order_id
WHERE ro.order_number = 1 -- CAMBIAR ESTE NÚMERO
ORDER BY rp.payment_date;

-- PASO 5: Cálculo completo para verificar
SELECT 
  ro.order_number,
  ro.labor_cost as mano_de_obra,
  COALESCE(SUM(ri.subtotal), 0) as total_repuestos,
  ro.labor_cost + COALESCE(SUM(ri.subtotal), 0) as costo_total,
  (SELECT COALESCE(SUM(rp.amount), 0) 
   FROM repair_payments rp 
   WHERE rp.repair_order_id = ro.id) as total_pagado,
  (ro.labor_cost + COALESCE(SUM(ri.subtotal), 0)) - 
  (SELECT COALESCE(SUM(rp.amount), 0) 
   FROM repair_payments rp 
   WHERE rp.repair_order_id = ro.id) as saldo_pendiente,
  CASE 
    WHEN (SELECT COALESCE(SUM(rp.amount), 0) 
          FROM repair_payments rp 
          WHERE rp.repair_order_id = ro.id) >= 
         (ro.labor_cost + COALESCE(SUM(ri.subtotal), 0))
    THEN 'COBRADO'
    WHEN (SELECT COALESCE(SUM(rp.amount), 0) 
          FROM repair_payments rp 
          WHERE rp.repair_order_id = ro.id) > 0
    THEN 'PAGO PARCIAL'
    ELSE 'NO COBRADO'
  END as estado_pago
FROM repair_orders ro
LEFT JOIN repair_items ri ON ri.repair_order_id = ro.id
WHERE ro.order_number = 1 -- CAMBIAR ESTE NÚMERO
GROUP BY ro.id, ro.order_number, ro.labor_cost;
