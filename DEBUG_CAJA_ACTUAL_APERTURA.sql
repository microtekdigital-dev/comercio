-- Script de diagnóstico para Caja Actual
-- Ejecutar en Supabase SQL Editor

-- Reemplazar 'TU_COMPANY_ID' con tu company_id real

-- 1. Ver todas las aperturas
SELECT 
  id,
  opening_date,
  shift,
  initial_cash_amount,
  opened_by_name,
  created_at
FROM cash_register_openings
WHERE company_id = 'TU_COMPANY_ID'
ORDER BY opening_date DESC
LIMIT 5;

-- 2. Ver todos los cierres
SELECT 
  id,
  closure_date,
  shift,
  opening_id,
  cash_sales,
  created_at
FROM cash_register_closures
WHERE company_id = 'TU_COMPANY_ID'
ORDER BY closure_date DESC
LIMIT 5;

-- 3. Identificar apertura activa (sin cierre)
WITH active_opening AS (
  SELECT o.id, o.opening_date, o.initial_cash_amount, o.shift
  FROM cash_register_openings o
  WHERE o.company_id = 'TU_COMPANY_ID'
    AND NOT EXISTS (
      SELECT 1 FROM cash_register_closures c
      WHERE c.opening_id = o.id
    )
  ORDER BY o.opening_date DESC
  LIMIT 1
)
SELECT * FROM active_opening;

-- 4. Ver ventas en efectivo desde la apertura activa
WITH active_opening AS (
  SELECT o.id, o.opening_date, o.initial_cash_amount
  FROM cash_register_openings o
  WHERE o.company_id = 'TU_COMPANY_ID'
    AND NOT EXISTS (
      SELECT 1 FROM cash_register_closures c
      WHERE c.opening_id = o.id
    )
  ORDER BY o.opening_date DESC
  LIMIT 1
)
SELECT 
  s.id,
  s.sale_date,
  s.total,
  s.payment_method,
  s.status,
  s.created_at
FROM sales s, active_opening ao
WHERE s.company_id = 'TU_COMPANY_ID'
  AND s.status = 'completed'
  AND s.sale_date >= DATE(ao.opening_date)
  AND (
    LOWER(s.payment_method) LIKE '%efectivo%' 
    OR LOWER(s.payment_method) LIKE '%cash%'
  )
ORDER BY s.sale_date DESC;

-- 5. Ver pagos a proveedores en efectivo desde la apertura
WITH active_opening AS (
  SELECT o.id, o.opening_date
  FROM cash_register_openings o
  WHERE o.company_id = 'TU_COMPANY_ID'
    AND NOT EXISTS (
      SELECT 1 FROM cash_register_closures c
      WHERE c.opening_id = o.id
    )
  ORDER BY o.opening_date DESC
  LIMIT 1
)
SELECT 
  sp.id,
  sp.payment_date,
  sp.amount,
  sp.payment_method,
  sp.created_at
FROM supplier_payments sp, active_opening ao
WHERE sp.company_id = 'TU_COMPANY_ID'
  AND sp.payment_date >= DATE(ao.opening_date)
  AND (
    LOWER(sp.payment_method) LIKE '%efectivo%' 
    OR LOWER(sp.payment_method) LIKE '%cash%'
  )
ORDER BY sp.payment_date DESC;

-- 6. Ver movimientos de caja de la apertura activa
WITH active_opening AS (
  SELECT o.id
  FROM cash_register_openings o
  WHERE o.company_id = 'TU_COMPANY_ID'
    AND NOT EXISTS (
      SELECT 1 FROM cash_register_closures c
      WHERE c.opening_id = o.id
    )
  ORDER BY o.opening_date DESC
  LIMIT 1
)
SELECT 
  cm.id,
  cm.movement_type,
  cm.amount,
  cm.description,
  cm.created_at
FROM cash_movements cm, active_opening ao
WHERE cm.company_id = 'TU_COMPANY_ID'
  AND cm.opening_id = ao.id
ORDER BY cm.created_at DESC;

-- 7. Cálculo completo del saldo actual
WITH active_opening AS (
  SELECT o.id, o.opening_date, o.initial_cash_amount
  FROM cash_register_openings o
  WHERE o.company_id = 'TU_COMPANY_ID'
    AND NOT EXISTS (
      SELECT 1 FROM cash_register_closures c
      WHERE c.opening_id = o.id
    )
  ORDER BY o.opening_date DESC
  LIMIT 1
),
cash_sales AS (
  SELECT COALESCE(SUM(s.total), 0) as total
  FROM sales s, active_opening ao
  WHERE s.company_id = 'TU_COMPANY_ID'
    AND s.status = 'completed'
    AND s.sale_date >= DATE(ao.opening_date)
    AND (
      LOWER(s.payment_method) LIKE '%efectivo%' 
      OR LOWER(s.payment_method) LIKE '%cash%'
    )
),
supplier_payments_cash AS (
  SELECT COALESCE(SUM(sp.amount), 0) as total
  FROM supplier_payments sp, active_opening ao
  WHERE sp.company_id = 'TU_COMPANY_ID'
    AND sp.payment_date >= DATE(ao.opening_date)
    AND (
      LOWER(sp.payment_method) LIKE '%efectivo%' 
      OR LOWER(sp.payment_method) LIKE '%cash%'
    )
),
cash_income AS (
  SELECT COALESCE(SUM(cm.amount), 0) as total
  FROM cash_movements cm, active_opening ao
  WHERE cm.company_id = 'TU_COMPANY_ID'
    AND cm.opening_id = ao.id
    AND cm.movement_type = 'income'
),
cash_withdrawals AS (
  SELECT COALESCE(SUM(cm.amount), 0) as total
  FROM cash_movements cm, active_opening ao
  WHERE cm.company_id = 'TU_COMPANY_ID'
    AND cm.opening_id = ao.id
    AND cm.movement_type = 'withdrawal'
)
SELECT 
  ao.initial_cash_amount as "Monto Inicial",
  cs.total as "Ventas Efectivo",
  spc.total as "Pagos Proveedores",
  ci.total as "Ingresos",
  cw.total as "Retiros",
  (ao.initial_cash_amount + cs.total - spc.total + ci.total - cw.total) as "Caja Actual Calculada"
FROM active_opening ao, cash_sales cs, supplier_payments_cash spc, cash_income ci, cash_withdrawals cw;
