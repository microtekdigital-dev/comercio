-- =====================================================
-- DETECTAR CIERRES DE CAJA DUPLICADOS
-- =====================================================
-- Este script identifica cierres duplicados para la misma apertura
-- o cierres duplicados para la misma fecha/turno

-- 1. Ver cierres con la misma apertura (duplicados reales)
SELECT 
  opening_id,
  COUNT(*) as cantidad_cierres,
  STRING_AGG(id::text, ', ') as closure_ids,
  STRING_AGG(closure_date::text, ', ') as fechas_cierre,
  STRING_AGG(closed_by_name, ', ') as cerrado_por
FROM cash_register_closures
WHERE opening_id IS NOT NULL
GROUP BY opening_id
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- 2. Ver todos los cierres para una apertura específica (reemplaza el ID)
-- SELECT 
--   c.*,
--   o.opening_date,
--   o.shift as opening_shift,
--   o.opened_by_name
-- FROM cash_register_closures c
-- LEFT JOIN cash_register_openings o ON c.opening_id = o.id
-- WHERE c.opening_id = 'REEMPLAZAR_CON_ID_APERTURA'
-- ORDER BY c.created_at;

-- 3. Ver cierres sin apertura vinculada (opening_id NULL)
SELECT 
  id,
  closure_date,
  shift,
  closed_by_name,
  total_sales_amount,
  cash_counted,
  created_at
FROM cash_register_closures
WHERE opening_id IS NULL
ORDER BY created_at DESC;

-- 4. Ver cierres duplicados por fecha y turno (mismo día, mismo turno)
SELECT 
  closure_date,
  shift,
  COUNT(*) as cantidad_cierres,
  STRING_AGG(id::text, ', ') as closure_ids,
  STRING_AGG(closed_by_name, ', ') as cerrado_por,
  STRING_AGG(created_at::text, ', ') as fechas_creacion
FROM cash_register_closures
WHERE shift IS NOT NULL
GROUP BY closure_date, shift
HAVING COUNT(*) > 1
ORDER BY closure_date DESC, shift;

-- 5. Ver resumen general de cierres
SELECT 
  COUNT(*) as total_cierres,
  COUNT(DISTINCT opening_id) as aperturas_con_cierre,
  COUNT(*) FILTER (WHERE opening_id IS NULL) as cierres_sin_apertura,
  COUNT(*) FILTER (WHERE opening_id IS NOT NULL) as cierres_con_apertura
FROM cash_register_closures;

-- 6. Ver aperturas con múltiples cierres (detalle completo)
WITH duplicates AS (
  SELECT opening_id
  FROM cash_register_closures
  WHERE opening_id IS NOT NULL
  GROUP BY opening_id
  HAVING COUNT(*) > 1
)
SELECT 
  o.id as opening_id,
  o.opening_date,
  o.shift as opening_shift,
  o.opened_by_name,
  o.initial_cash_amount,
  c.id as closure_id,
  c.closure_date,
  c.closed_by_name,
  c.cash_counted,
  c.cash_difference,
  c.created_at as closure_created_at
FROM cash_register_openings o
INNER JOIN duplicates d ON o.id = d.opening_id
INNER JOIN cash_register_closures c ON c.opening_id = o.id
ORDER BY o.opening_date DESC, c.created_at;
