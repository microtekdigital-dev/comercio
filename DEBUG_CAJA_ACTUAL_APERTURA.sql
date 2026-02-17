-- Script para diagnosticar problemas con cierre de caja
-- Ejecutar este script para ver qué está pasando con los datos

-- 1. Ver todas las aperturas de caja recientes
SELECT 
  id,
  opening_date,
  shift,
  opened_by_name,
  initial_cash_amount,
  created_at,
  company_id
FROM cash_register_openings
WHERE opening_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 2. Ver todos los cierres de caja recientes
SELECT 
  id,
  closure_date,
  shift,
  closed_by_name,
  opening_id,
  total_sales_amount,
  cash_sales,
  supplier_payments_cash,
  cash_counted,
  cash_difference,
  created_at,
  company_id
FROM cash_register_closures
WHERE closure_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 3. Ver pagos a proveedores recientes (todos los métodos)
SELECT 
  sp.id,
  sp.payment_date,
  sp.amount,
  sp.payment_method,
  LOWER(sp.payment_method) as payment_method_lower,
  CASE 
    WHEN LOWER(sp.payment_method) LIKE '%efectivo%' THEN 'EFECTIVO'
    WHEN LOWER(sp.payment_method) LIKE '%cash%' THEN 'EFECTIVO'
    WHEN LOWER(sp.payment_method) LIKE '%tarjeta%' THEN 'TARJETA'
    WHEN LOWER(sp.payment_method) LIKE '%transferencia%' THEN 'TRANSFERENCIA'
    ELSE 'OTRO'
  END as tipo_pago,
  s.name as supplier_name,
  sp.created_at,
  sp.company_id
FROM supplier_payments sp
LEFT JOIN suppliers s ON s.id = sp.supplier_id
WHERE sp.payment_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY sp.created_at DESC;

-- 4. Ver ventas recientes
SELECT 
  id,
  sale_number,
  sale_date,
  total,
  payment_method,
  status,
  created_at,
  company_id
FROM sales
WHERE sale_date >= CURRENT_DATE - INTERVAL '7 days'
  AND status = 'completed'
ORDER BY created_at DESC;

-- 5. Verificar si hay cierres sin apertura vinculada
SELECT 
  c.id as closure_id,
  c.closure_date,
  c.shift,
  c.opening_id,
  CASE 
    WHEN c.opening_id IS NULL THEN 'SIN APERTURA'
    ELSE 'CON APERTURA'
  END as estado_apertura,
  o.initial_cash_amount,
  c.cash_sales,
  c.supplier_payments_cash,
  c.cash_counted,
  c.cash_difference
FROM cash_register_closures c
LEFT JOIN cash_register_openings o ON o.id = c.opening_id
WHERE c.closure_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY c.created_at DESC;

-- 6. Ver movimientos de caja recientes
SELECT 
  cm.id,
  cm.opening_id,
  cm.movement_type,
  cm.amount,
  cm.description,
  cm.created_by_name,
  cm.created_at,
  o.shift,
  o.opening_date
FROM cash_movements cm
LEFT JOIN cash_register_openings o ON o.id = cm.opening_id
WHERE cm.created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY cm.created_at DESC;
