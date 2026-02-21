-- Script para diagnosticar por qué los ingresos de reparaciones no aparecen en el dashboard

-- PASO 1: Ver todas las reparaciones completadas
SELECT 
    ro.id,
    ro.order_number,
    ro.status,
    ro.received_date,
    ro.delivered_date,
    ro.repair_completed_date,
    ro.labor_cost,
    ro.created_at
FROM repair_orders ro
WHERE ro.status IN ('repaired', 'delivered')
ORDER BY ro.created_at DESC
LIMIT 10;

-- PASO 2: Ver los pagos de esas reparaciones
SELECT 
    ro.order_number,
    ro.status,
    ro.delivered_date,
    rp.payment_date,
    rp.amount,
    rp.payment_method
FROM repair_orders ro
LEFT JOIN repair_payments rp ON rp.repair_order_id = ro.id
WHERE ro.status IN ('repaired', 'delivered')
ORDER BY ro.created_at DESC
LIMIT 20;

-- PASO 3: Ver reparaciones del mes actual
SELECT 
    ro.id,
    ro.order_number,
    ro.status,
    ro.delivered_date,
    ro.repair_completed_date,
    ro.created_at,
    COALESCE(SUM(rp.amount), 0) as total_pagado
FROM repair_orders ro
LEFT JOIN repair_payments rp ON rp.repair_order_id = ro.id
WHERE ro.status IN ('repaired', 'delivered')
  AND ro.created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY ro.id, ro.order_number, ro.status, ro.delivered_date, ro.repair_completed_date, ro.created_at
ORDER BY ro.created_at DESC;

-- PASO 4: Calcular ingresos totales de reparaciones del mes
SELECT 
    COUNT(DISTINCT ro.id) as total_reparaciones,
    COALESCE(SUM(rp.amount), 0) as ingresos_totales
FROM repair_orders ro
LEFT JOIN repair_payments rp ON rp.repair_order_id = ro.id
WHERE ro.status IN ('repaired', 'delivered')
  AND ro.created_at >= DATE_TRUNC('month', CURRENT_DATE);

-- PASO 5: Ver si hay reparaciones sin delivered_date
SELECT 
    COUNT(*) as reparaciones_sin_delivered_date
FROM repair_orders
WHERE status IN ('repaired', 'delivered')
  AND delivered_date IS NULL;

-- INSTRUCCIONES:
-- 1. Ejecuta este script en Supabase SQL Editor
-- 2. Revisa los resultados de cada paso
-- 3. Verifica si las reparaciones tienen delivered_date
-- 4. Si delivered_date es NULL, ese es el problema
