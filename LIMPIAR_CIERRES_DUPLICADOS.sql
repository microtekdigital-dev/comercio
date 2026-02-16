-- =====================================================
-- LIMPIAR CIERRES DE CAJA DUPLICADOS
-- =====================================================
-- IMPORTANTE: Ejecuta primero DETECTAR_CIERRES_DUPLICADOS.sql
-- para identificar qué cierres están duplicados

-- =====================================================
-- OPCIÓN 1: Mantener el cierre más reciente por apertura
-- =====================================================
-- Esta opción elimina todos los cierres duplicados excepto el más reciente

-- PASO 1: Ver qué se va a eliminar (SOLO LECTURA)
WITH ranked_closures AS (
  SELECT 
    id,
    opening_id,
    closure_date,
    closed_by_name,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY opening_id 
      ORDER BY created_at DESC
    ) as rn
  FROM cash_register_closures
  WHERE opening_id IS NOT NULL
)
SELECT 
  id as closure_id_a_eliminar,
  opening_id,
  closure_date,
  closed_by_name,
  created_at
FROM ranked_closures
WHERE rn > 1
ORDER BY opening_id, created_at;

-- PASO 2: Eliminar duplicados (mantener el más reciente)
-- ⚠️ DESCOMENTA SOLO DESPUÉS DE VERIFICAR EL PASO 1
/*
WITH ranked_closures AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY opening_id 
      ORDER BY created_at DESC
    ) as rn
  FROM cash_register_closures
  WHERE opening_id IS NOT NULL
)
DELETE FROM cash_register_closures
WHERE id IN (
  SELECT id 
  FROM ranked_closures 
  WHERE rn > 1
);
*/

-- =====================================================
-- OPCIÓN 2: Mantener el cierre más antiguo por apertura
-- =====================================================
-- Esta opción elimina todos los cierres duplicados excepto el primero

-- PASO 1: Ver qué se va a eliminar (SOLO LECTURA)
WITH ranked_closures AS (
  SELECT 
    id,
    opening_id,
    closure_date,
    closed_by_name,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY opening_id 
      ORDER BY created_at ASC
    ) as rn
  FROM cash_register_closures
  WHERE opening_id IS NOT NULL
)
SELECT 
  id as closure_id_a_eliminar,
  opening_id,
  closure_date,
  closed_by_name,
  created_at
FROM ranked_closures
WHERE rn > 1
ORDER BY opening_id, created_at;

-- PASO 2: Eliminar duplicados (mantener el más antiguo)
-- ⚠️ DESCOMENTA SOLO DESPUÉS DE VERIFICAR EL PASO 1
/*
WITH ranked_closures AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY opening_id 
      ORDER BY created_at ASC
    ) as rn
  FROM cash_register_closures
  WHERE opening_id IS NOT NULL
)
DELETE FROM cash_register_closures
WHERE id IN (
  SELECT id 
  FROM ranked_closures 
  WHERE rn > 1
);
*/

-- =====================================================
-- OPCIÓN 3: Eliminar cierres sin apertura vinculada
-- =====================================================
-- Esta opción elimina todos los cierres que tienen opening_id NULL

-- PASO 1: Ver qué se va a eliminar (SOLO LECTURA)
SELECT 
  id as closure_id_a_eliminar,
  closure_date,
  shift,
  closed_by_name,
  total_sales_amount,
  cash_counted,
  created_at
FROM cash_register_closures
WHERE opening_id IS NULL
ORDER BY created_at DESC;

-- PASO 2: Eliminar cierres sin apertura
-- ⚠️ DESCOMENTA SOLO DESPUÉS DE VERIFICAR EL PASO 1
/*
DELETE FROM cash_register_closures
WHERE opening_id IS NULL;
*/

-- =====================================================
-- OPCIÓN 4: Eliminar un cierre específico por ID
-- =====================================================
-- Usa esta opción si quieres eliminar cierres específicos manualmente

-- PASO 1: Ver el cierre antes de eliminarlo
-- SELECT * FROM cash_register_closures WHERE id = 'REEMPLAZAR_CON_ID';

-- PASO 2: Eliminar el cierre específico
-- ⚠️ DESCOMENTA Y REEMPLAZA EL ID
/*
DELETE FROM cash_register_closures
WHERE id = 'REEMPLAZAR_CON_ID';
*/

-- =====================================================
-- OPCIÓN 5: Eliminar múltiples cierres por IDs
-- =====================================================
-- Usa esta opción si tienes una lista de IDs específicos a eliminar

-- PASO 1: Ver los cierres antes de eliminarlos
-- SELECT * FROM cash_register_closures 
-- WHERE id IN ('id1', 'id2', 'id3');

-- PASO 2: Eliminar los cierres específicos
-- ⚠️ DESCOMENTA Y REEMPLAZA LOS IDs
/*
DELETE FROM cash_register_closures
WHERE id IN (
  'id1',
  'id2',
  'id3'
);
*/

-- =====================================================
-- VERIFICACIÓN POST-LIMPIEZA
-- =====================================================
-- Ejecuta esto después de limpiar para verificar

-- 1. Verificar que no hay duplicados
SELECT 
  opening_id,
  COUNT(*) as cantidad_cierres
FROM cash_register_closures
WHERE opening_id IS NOT NULL
GROUP BY opening_id
HAVING COUNT(*) > 1;
-- Resultado esperado: 0 filas

-- 2. Ver resumen actualizado
SELECT 
  COUNT(*) as total_cierres,
  COUNT(DISTINCT opening_id) as aperturas_con_cierre,
  COUNT(*) FILTER (WHERE opening_id IS NULL) as cierres_sin_apertura,
  COUNT(*) FILTER (WHERE opening_id IS NOT NULL) as cierres_con_apertura
FROM cash_register_closures;

-- 3. Ver aperturas sin cierre
SELECT 
  o.id,
  o.opening_date,
  o.shift,
  o.opened_by_name,
  o.initial_cash_amount
FROM cash_register_openings o
LEFT JOIN cash_register_closures c ON c.opening_id = o.id
WHERE c.id IS NULL
ORDER BY o.opening_date DESC;
