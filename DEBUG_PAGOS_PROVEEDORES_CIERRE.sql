-- =====================================================
-- DIAGNÓSTICO: Pagos a Proveedores en Cierres de Caja
-- =====================================================

-- 1. Ver todos los pagos a proveedores registrados
SELECT 
  sp.id,
  sp.payment_date,
  sp.amount,
  sp.payment_method,
  s.name as supplier_name,
  sp.created_at
FROM supplier_payments sp
LEFT JOIN suppliers s ON s.id = sp.supplier_id
ORDER BY sp.payment_date DESC, sp.created_at DESC
LIMIT 20;

-- 2. Ver pagos a proveedores EN EFECTIVO
SELECT 
  sp.id,
  sp.payment_date,
  sp.amount,
  sp.payment_method,
  s.name as supplier_name,
  sp.created_at
FROM supplier_payments sp
LEFT JOIN suppliers s ON s.id = sp.supplier_id
WHERE LOWER(sp.payment_method) LIKE '%efectivo%' 
   OR LOWER(sp.payment_method) LIKE '%cash%'
ORDER BY sp.payment_date DESC, sp.created_at DESC
LIMIT 20;

-- 3. Ver cierres de caja con sus pagos a proveedores
SELECT 
  crc.id,
  crc.closure_date,
  crc.shift,
  crc.total_sales_amount,
  crc.supplier_payments_cash,
  crc.created_at,
  crc.closed_by_name
FROM cash_register_closures crc
ORDER BY crc.closure_date DESC, crc.created_at DESC
LIMIT 10;

-- 4. Comparar: Pagos en efectivo del día vs lo registrado en cierre
SELECT 
  crc.closure_date::date as fecha_cierre,
  crc.supplier_payments_cash as registrado_en_cierre,
  COALESCE(SUM(
    CASE 
      WHEN LOWER(sp.payment_method) LIKE '%efectivo%' 
        OR LOWER(sp.payment_method) LIKE '%cash%' 
      THEN sp.amount 
      ELSE 0 
    END
  ), 0) as pagos_efectivo_del_dia
FROM cash_register_closures crc
LEFT JOIN supplier_payments sp ON sp.payment_date::date = crc.closure_date::date
GROUP BY crc.closure_date::date, crc.supplier_payments_cash
ORDER BY crc.closure_date DESC
LIMIT 10;

-- 5. Ver si hay pagos a proveedores SIN reflejar en cierres
SELECT 
  sp.payment_date::date as fecha_pago,
  COUNT(*) as cantidad_pagos,
  SUM(CASE 
    WHEN LOWER(sp.payment_method) LIKE '%efectivo%' 
      OR LOWER(sp.payment_method) LIKE '%cash%' 
    THEN sp.amount 
    ELSE 0 
  END) as total_efectivo
FROM supplier_payments sp
WHERE NOT EXISTS (
  SELECT 1 
  FROM cash_register_closures crc 
  WHERE crc.closure_date::date = sp.payment_date::date
    AND crc.supplier_payments_cash > 0
)
GROUP BY sp.payment_date::date
ORDER BY sp.payment_date DESC
LIMIT 10;
