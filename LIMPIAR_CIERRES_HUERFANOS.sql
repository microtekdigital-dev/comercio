-- =====================================================
-- LIMPIAR CIERRES HUÉRFANOS (SIN APERTURA VINCULADA)
-- =====================================================
-- Situación actual:
-- - 8 cierres totales
-- - 2 cierres correctos (con opening_id)
-- - 6 cierres huérfanos (opening_id NULL) ← ESTOS SE VAN A ELIMINAR

-- =====================================================
-- PASO 1: IDENTIFICAR LOS CIERRES HUÉRFANOS
-- =====================================================
-- Ejecuta esto primero para ver qué cierres se van a eliminar

SELECT 
  id,
  closure_date,
  shift,
  closed_by_name,
  total_sales_amount,
  cash_counted,
  cash_difference,
  created_at,
  '❌ SIN APERTURA' as estado
FROM cash_register_closures
WHERE opening_id IS NULL
ORDER BY created_at DESC;

-- =====================================================
-- PASO 2: VER LOS CIERRES CORRECTOS (NO SE TOCAN)
-- =====================================================
-- Estos son los que tienen opening_id y NO se van a eliminar

SELECT 
  c.id as closure_id,
  c.closure_date,
  c.shift as closure_shift,
  c.closed_by_name,
  c.cash_counted,
  c.created_at as closure_created,
  '✅ CON APERTURA' as estado,
  o.id as opening_id,
  o.opening_date,
  o.shift as opening_shift,
  o.opened_by_name,
  o.initial_cash_amount
FROM cash_register_closures c
INNER JOIN cash_register_openings o ON c.opening_id = o.id
ORDER BY c.created_at DESC;

-- =====================================================
-- PASO 3: BACKUP DE LOS DATOS ANTES DE ELIMINAR
-- =====================================================
-- Guarda esta información por si necesitas recuperar algo

SELECT 
  'BACKUP - Cierres a eliminar' as nota,
  id,
  company_id,
  closure_date,
  shift,
  closed_by,
  closed_by_name,
  total_sales_count,
  total_sales_amount,
  cash_sales,
  card_sales,
  transfer_sales,
  other_sales,
  cash_counted,
  cash_difference,
  notes,
  currency,
  opening_id,
  created_at,
  updated_at
FROM cash_register_closures
WHERE opening_id IS NULL
ORDER BY created_at;

-- =====================================================
-- PASO 4: ELIMINAR LOS CIERRES HUÉRFANOS
-- =====================================================
-- ⚠️ IMPORTANTE: Solo descomenta esto después de:
-- 1. Verificar el PASO 1 (ver qué se va a eliminar)
-- 2. Guardar el PASO 3 (backup de los datos)
-- 3. Estar seguro de que quieres eliminar estos registros

/*
DELETE FROM cash_register_closures
WHERE opening_id IS NULL;
*/

-- =====================================================
-- PASO 5: VERIFICACIÓN POST-LIMPIEZA
-- =====================================================
-- Ejecuta esto después de eliminar para confirmar

-- Debería mostrar: 2 cierres totales, 2 con apertura, 0 sin apertura
SELECT 
  COUNT(*) as total_cierres,
  COUNT(DISTINCT opening_id) as aperturas_con_cierre,
  COUNT(*) FILTER (WHERE opening_id IS NULL) as cierres_sin_apertura,
  COUNT(*) FILTER (WHERE opening_id IS NOT NULL) as cierres_con_apertura
FROM cash_register_closures;

-- Verificar que no hay duplicados
SELECT 
  opening_id,
  COUNT(*) as cantidad_cierres
FROM cash_register_closures
WHERE opening_id IS NOT NULL
GROUP BY opening_id
HAVING COUNT(*) > 1;
-- Resultado esperado: 0 filas (sin duplicados)

-- Ver todos los cierres restantes
SELECT 
  c.id,
  c.closure_date,
  c.shift,
  c.closed_by_name,
  c.cash_counted,
  o.opening_date,
  o.shift as opening_shift,
  o.opened_by_name as opened_by
FROM cash_register_closures c
LEFT JOIN cash_register_openings o ON c.opening_id = o.id
ORDER BY c.created_at DESC;

-- =====================================================
-- RESULTADO ESPERADO DESPUÉS DE LA LIMPIEZA
-- =====================================================
-- total_cierres: 2
-- aperturas_con_cierre: 2
-- cierres_sin_apertura: 0
-- cierres_con_apertura: 2
