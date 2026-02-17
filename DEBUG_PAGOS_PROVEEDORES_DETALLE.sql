-- Script para diagnosticar por qué no aparecen los pagos a proveedores en el detalle del cierre de caja

-- PASO 1: Ver todos los pagos a proveedores recientes con su método de pago
SELECT 
  sp.id,
  sp.payment_date,
  sp.amount,
  sp.payment_method,
  LOWER(sp.payment_method) as payment_method_lower,
  CASE 
    WHEN LOWER(sp.payment_method) LIKE '%efectivo%' THEN '✓ ES EFECTIVO'
    WHEN LOWER(sp.payment_method) LIKE '%cash%' THEN '✓ ES EFECTIVO'
    ELSE '✗ NO ES EFECTIVO'
  END as tipo_detectado,
  s.name as supplier_name,
  sp.created_at,
  sp.company_id
FROM supplier_payments sp
LEFT JOIN suppliers s ON s.id = sp.supplier_id
WHERE sp.payment_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY sp.payment_date DESC, sp.created_at DESC;

-- PASO 2: Ver los cierres de caja recientes y cuánto tienen en supplier_payments_cash
SELECT 
  id,
  closure_date,
  shift,
  supplier_payments_cash,
  total_sales_amount,
  cash_sales,
  created_at,
  company_id
FROM cash_register_closures
WHERE closure_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY closure_date DESC, created_at DESC;

-- PASO 3: Cruzar cierres con pagos para ver si coinciden
SELECT 
  c.id as closure_id,
  c.closure_date,
  c.shift,
  c.supplier_payments_cash as monto_registrado_en_cierre,
  c.created_at as cierre_created_at,
  COUNT(sp.id) as cantidad_pagos_encontrados,
  SUM(CASE 
    WHEN LOWER(sp.payment_method) LIKE '%efectivo%' OR LOWER(sp.payment_method) LIKE '%cash%' 
    THEN sp.amount 
    ELSE 0 
  END) as total_efectivo_calculado,
  STRING_AGG(
    s.name || ': $' || sp.amount::text || ' (' || sp.payment_method || ')', 
    ', '
  ) as detalle_pagos
FROM cash_register_closures c
LEFT JOIN supplier_payments sp ON 
  sp.company_id = c.company_id 
  AND sp.payment_date::date = c.closure_date::date
  AND sp.created_at < c.created_at
LEFT JOIN suppliers s ON s.id = sp.supplier_id
WHERE c.closure_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY c.id, c.closure_date, c.shift, c.supplier_payments_cash, c.created_at
ORDER BY c.created_at DESC;

-- PASO 4: Ver si hay pagos que se crearon DESPUÉS del cierre (estos NO aparecerán)
SELECT 
  c.id as closure_id,
  c.closure_date,
  c.created_at as cierre_created_at,
  sp.id as payment_id,
  sp.amount,
  sp.payment_method,
  s.name as supplier_name,
  sp.created_at as payment_created_at,
  CASE 
    WHEN sp.created_at < c.created_at THEN '✓ ANTES DEL CIERRE'
    ELSE '✗ DESPUÉS DEL CIERRE (NO APARECERÁ)'
  END as timing
FROM cash_register_closures c
LEFT JOIN supplier_payments sp ON 
  sp.company_id = c.company_id 
  AND sp.payment_date::date = c.closure_date::date
LEFT JOIN suppliers s ON s.id = sp.supplier_id
WHERE c.closure_date >= CURRENT_DATE - INTERVAL '7 days'
  AND sp.id IS NOT NULL
ORDER BY c.created_at DESC, sp.created_at DESC;

-- PASO 5: Verificar la estructura de la tabla supplier_payments
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'supplier_payments'
  AND table_schema = 'public'
ORDER BY ordinal_position;
