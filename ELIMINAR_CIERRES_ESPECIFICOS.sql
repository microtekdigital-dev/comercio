-- =====================================================
-- ELIMINAR CIERRES DUPLICADOS ESPECÍFICOS
-- =====================================================
-- Este script elimina los 6 cierres huérfanos identificados
-- y mantiene los 2 cierres correctos con apertura vinculada

-- =====================================================
-- SITUACIÓN ACTUAL
-- =====================================================
-- MANTENER (2 cierres correctos):
-- ✅ 3c28d9f3-6ec1-4595-9fcc-45cdb844ef16 - Noche 16/02 → Apertura Noche 15/02
-- ✅ c56a66a7-5494-4dda-8d1e-1954161bbb39 - 15/02 → Apertura Tarde 15/02
--
-- ELIMINAR (6 cierres huérfanos):
-- ❌ 8011d43b-a1cb-4af6-af37-4fa252be67ae
-- ❌ 34ce8a95-2cf5-4804-b4df-53a5277d5157
-- ❌ 9d47d683-14f2-48b8-9b46-a8bc4b06e3d3
-- ❌ 0ad5d5ad-7432-4336-bb24-a0846c39084f
-- ❌ 2d9a5fc7-92c3-4666-bdd7-80881cdc626d
-- ❌ 592048c2-fa16-4fd5-95b8-098412c0a31b

-- =====================================================
-- PASO 1: VERIFICAR LOS CIERRES A ELIMINAR
-- =====================================================
SELECT 
  id,
  closure_date,
  shift,
  closed_by_name,
  total_sales_amount,
  cash_counted,
  opening_id,
  created_at,
  '❌ A ELIMINAR' as accion
FROM cash_register_closures
WHERE id IN (
  '8011d43b-a1cb-4af6-af37-4fa252be67ae',
  '34ce8a95-2cf5-4804-b4df-53a5277d5157',
  '9d47d683-14f2-48b8-9b46-a8bc4b06e3d3',
  '0ad5d5ad-7432-4336-bb24-a0846c39084f',
  '2d9a5fc7-92c3-4666-bdd7-80881cdc626d',
  '592048c2-fa16-4fd5-95b8-098412c0a31b'
)
ORDER BY created_at;

-- Debería mostrar 6 registros

-- =====================================================
-- PASO 2: VERIFICAR LOS CIERRES A MANTENER
-- =====================================================
SELECT 
  c.id,
  c.closure_date,
  c.shift as closure_shift,
  c.closed_by_name,
  c.cash_counted,
  c.opening_id,
  o.opening_date,
  o.shift as opening_shift,
  o.opened_by_name,
  '✅ MANTENER' as accion
FROM cash_register_closures c
INNER JOIN cash_register_openings o ON c.opening_id = o.id
WHERE c.id IN (
  '3c28d9f3-6ec1-4595-9fcc-45cdb844ef16',
  'c56a66a7-5494-4dda-8d1e-1954161bbb39'
)
ORDER BY c.created_at;

-- Debería mostrar 2 registros con sus aperturas vinculadas

-- =====================================================
-- PASO 3: BACKUP DE LOS DATOS (OPCIONAL)
-- =====================================================
-- Copia y guarda el resultado de esta consulta por si acaso
SELECT 
  'BACKUP' as tipo,
  *
FROM cash_register_closures
WHERE id IN (
  '8011d43b-a1cb-4af6-af37-4fa252be67ae',
  '34ce8a95-2cf5-4804-b4df-53a5277d5157',
  '9d47d683-14f2-48b8-9b46-a8bc4b06e3d3',
  '0ad5d5ad-7432-4336-bb24-a0846c39084f',
  '2d9a5fc7-92c3-4666-bdd7-80881cdc626d',
  '592048c2-fa16-4fd5-95b8-098412c0a31b'
);

-- =====================================================
-- PASO 4: ELIMINAR LOS CIERRES DUPLICADOS
-- =====================================================
-- ⚠️ DESCOMENTA SOLO DESPUÉS DE VERIFICAR LOS PASOS 1 Y 2

DELETE FROM cash_register_closures
WHERE id IN (
  '8011d43b-a1cb-4af6-af37-4fa252be67ae',
  '34ce8a95-2cf5-4804-b4df-53a5277d5157',
  '9d47d683-14f2-48b8-9b46-a8bc4b06e3d3',
  '0ad5d5ad-7432-4336-bb24-a0846c39084f',
  '2d9a5fc7-92c3-4666-bdd7-80881cdc626d',
  '592048c2-fa16-4fd5-95b8-098412c0a31b'
);

-- Debería mostrar: DELETE 6

-- =====================================================
-- PASO 5: VERIFICACIÓN POST-LIMPIEZA
-- =====================================================

-- 1. Contar cierres restantes
SELECT 
  COUNT(*) as total_cierres,
  COUNT(DISTINCT opening_id) as aperturas_con_cierre,
  COUNT(*) FILTER (WHERE opening_id IS NULL) as cierres_sin_apertura,
  COUNT(*) FILTER (WHERE opening_id IS NOT NULL) as cierres_con_apertura
FROM cash_register_closures;

-- Resultado esperado:
-- total_cierres: 2
-- aperturas_con_cierre: 2
-- cierres_sin_apertura: 0
-- cierres_con_apertura: 2

-- 2. Ver todos los cierres restantes (deberían ser solo 2)
SELECT 
  c.id,
  c.closure_date,
  c.shift as closure_shift,
  c.closed_by_name,
  c.cash_counted,
  c.opening_id,
  o.opening_date,
  o.shift as opening_shift,
  o.opened_by_name as opened_by,
  o.initial_cash_amount
FROM cash_register_closures c
INNER JOIN cash_register_openings o ON c.opening_id = o.id
ORDER BY c.created_at DESC;

-- Deberías ver solo:
-- 1. Cierre Noche 16/02 → Apertura Noche 15/02
-- 2. Cierre 15/02 → Apertura Tarde 15/02

-- 3. Verificar que no hay duplicados
SELECT 
  opening_id,
  COUNT(*) as cantidad_cierres
FROM cash_register_closures
WHERE opening_id IS NOT NULL
GROUP BY opening_id
HAVING COUNT(*) > 1;

-- Resultado esperado: 0 filas (sin duplicados)

-- 4. Ver aperturas sin cierre (si las hay)
SELECT 
  o.id,
  o.opening_date,
  o.shift,
  o.opened_by_name,
  o.initial_cash_amount,
  'Sin cierre' as estado
FROM cash_register_openings o
LEFT JOIN cash_register_closures c ON c.opening_id = o.id
WHERE c.id IS NULL
ORDER BY o.opening_date DESC;

-- =====================================================
-- RESUMEN
-- =====================================================
-- Después de ejecutar este script:
-- ✅ Tendrás 2 cierres correctos con apertura vinculada
-- ✅ 0 cierres huérfanos
-- ✅ Base de datos limpia y consistente
-- ✅ El sistema funcionará correctamente
