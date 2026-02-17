-- =====================================================
-- DIAGNÓSTICO: Verificar Pagos a Proveedores para un Cierre Específico
-- =====================================================
-- Reemplaza 'TU_CLOSURE_ID' con el ID del cierre que estás viendo

-- 1. Ver información del cierre
SELECT 
  crc.id,
  crc.closure_date,
  crc.shift,
  crc.total_sales_amount,
  crc.total_sales_count,
  crc.supplier_payments_cash,
  crc.created_at,
  crc.closed_by_name
FROM cash_register_closures crc
WHERE crc.id = 'TU_CLOSURE_ID';  -- REEMPLAZAR CON EL ID DEL CIERRE

-- 2. Ver pagos a proveedores en la fecha del cierre
WITH closure_info AS (
  SELECT 
    closure_date,
    created_at,
    company_id
  FROM cash_register_closures
  WHERE id = 'TU_CLOSURE_ID'  -- REEMPLAZAR CON EL ID DEL CIERRE
)
SELECT 
  sp.id,
  sp.payment_date,
  sp.amount,
  sp.payment_method,
  s.name as supplier_name,
  sp.reference_number,
  sp.created_at,
  CASE 
    WHEN LOWER(sp.payment_method) LIKE '%efectivo%' 
      OR LOWER(sp.payment_method) LIKE '%cash%' 
    THEN 'SÍ - Debería aparecer'
    ELSE 'NO - Otro método de pago'
  END as deberia_aparecer_en_cierre
FROM supplier_payments sp
LEFT JOIN suppliers s ON s.id = sp.supplier_id
CROSS JOIN closure_info ci
WHERE sp.company_id = ci.company_id
  AND sp.payment_date::date = ci.closure_date::date
ORDER BY sp.created_at;

-- 3. Ver si hay cierres anteriores en la misma fecha
WITH closure_info AS (
  SELECT 
    closure_date,
    created_at,
    company_id
  FROM cash_register_closures
  WHERE id = 'TU_CLOSURE_ID'  -- REEMPLAZAR CON EL ID DEL CIERRE
)
SELECT 
  crc.id,
  crc.closure_date,
  crc.shift,
  crc.supplier_payments_cash,
  crc.created_at,
  CASE 
    WHEN crc.created_at < ci.created_at THEN 'ANTERIOR'
    WHEN crc.created_at = ci.created_at THEN 'ESTE CIERRE'
    ELSE 'POSTERIOR'
  END as orden
FROM cash_register_closures crc
CROSS JOIN closure_info ci
WHERE crc.company_id = ci.company_id
  AND crc.closure_date::date = ci.closure_date::date
ORDER BY crc.created_at;

-- 4. Calcular cuánto DEBERÍA tener el cierre en pagos a proveedores
WITH closure_info AS (
  SELECT 
    id,
    closure_date,
    created_at,
    company_id,
    supplier_payments_cash
  FROM cash_register_closures
  WHERE id = 'TU_CLOSURE_ID'  -- REEMPLAZAR CON EL ID DEL CIERRE
),
previous_closure AS (
  SELECT 
    MAX(crc.created_at) as last_closure_time
  FROM cash_register_closures crc
  CROSS JOIN closure_info ci
  WHERE crc.company_id = ci.company_id
    AND crc.closure_date::date = ci.closure_date::date
    AND crc.created_at < ci.created_at
)
SELECT 
  ci.id as closure_id,
  ci.supplier_payments_cash as registrado_en_cierre,
  COALESCE(SUM(
    CASE 
      WHEN LOWER(sp.payment_method) LIKE '%efectivo%' 
        OR LOWER(sp.payment_method) LIKE '%cash%' 
      THEN sp.amount 
      ELSE 0 
    END
  ), 0) as deberia_tener,
  COALESCE(SUM(
    CASE 
      WHEN LOWER(sp.payment_method) LIKE '%efectivo%' 
        OR LOWER(sp.payment_method) LIKE '%cash%' 
      THEN sp.amount 
      ELSE 0 
    END
  ), 0) - ci.supplier_payments_cash as diferencia,
  CASE 
    WHEN pc.last_closure_time IS NOT NULL 
    THEN 'Hay cierre anterior - solo pagos después de ' || pc.last_closure_time::text
    ELSE 'No hay cierre anterior - todos los pagos del día'
  END as nota
FROM closure_info ci
LEFT JOIN previous_closure pc ON true
LEFT JOIN supplier_payments sp ON 
  sp.company_id = ci.company_id
  AND sp.payment_date::date = ci.closure_date::date
  AND (pc.last_closure_time IS NULL OR sp.created_at > pc.last_closure_time)
GROUP BY ci.id, ci.supplier_payments_cash, pc.last_closure_time;

-- 5. Ver TODOS los pagos a proveedores (cualquier método) del día
WITH closure_info AS (
  SELECT 
    closure_date,
    company_id
  FROM cash_register_closures
  WHERE id = 'TU_CLOSURE_ID'  -- REEMPLAZAR CON EL ID DEL CIERRE
)
SELECT 
  sp.id,
  sp.payment_date,
  sp.amount,
  sp.payment_method,
  s.name as supplier_name,
  sp.reference_number,
  sp.notes
FROM supplier_payments sp
LEFT JOIN suppliers s ON s.id = sp.supplier_id
CROSS JOIN closure_info ci
WHERE sp.company_id = ci.company_id
  AND sp.payment_date::date = ci.closure_date::date
ORDER BY sp.created_at;
