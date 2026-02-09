-- =====================================================
-- Limitar longitud del nombre de productos a 35 caracteres
-- =====================================================

-- PASO 1: Verificar productos con nombres largos
SELECT '=== PRODUCTOS CON NOMBRES LARGOS ===' as info;

SELECT 
  id,
  name,
  LENGTH(name) as longitud,
  SUBSTRING(name, 1, 35) as nombre_truncado
FROM products
WHERE LENGTH(name) > 35
ORDER BY LENGTH(name) DESC;

-- PASO 2: Truncar nombres largos (si existen)
SELECT '=== TRUNCANDO NOMBRES LARGOS ===' as info;

UPDATE products
SET name = SUBSTRING(name, 1, 35)
WHERE LENGTH(name) > 35;

SELECT 'Nombres truncados: ' || COUNT(*) as resultado
FROM products
WHERE LENGTH(name) > 35;

-- PASO 3: Modificar la columna para limitar a 35 caracteres
SELECT '=== MODIFICANDO ESTRUCTURA DE TABLA ===' as info;

ALTER TABLE products 
ALTER COLUMN name TYPE VARCHAR(35);

SELECT 'Columna modificada exitosamente' as resultado;

-- PASO 4: Verificar el cambio
SELECT '=== VERIFICACIÓN FINAL ===' as info;

SELECT 
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'products' 
  AND column_name = 'name';

-- =====================================================
-- RESUMEN
-- =====================================================

SELECT '=== RESUMEN ===' as info;

/*
✅ LÍMITE DE NOMBRE DE PRODUCTO APLICADO

CAMBIOS REALIZADOS:
1. Productos con nombres > 35 caracteres fueron truncados
2. Columna 'name' modificada de VARCHAR(255) a VARCHAR(35)
3. Nuevos productos no podrán tener nombres > 35 caracteres

VALIDACIONES:
- Frontend: maxLength={35} en los inputs
- Backend: Validación en createProduct() y updateProduct()
- Base de datos: VARCHAR(35) constraint

NOTA:
Si algún producto tenía un nombre más largo, fue truncado automáticamente.
Revisa los productos afectados en el PASO 1 si es necesario ajustar manualmente.
*/

SELECT '=== FIN DEL SCRIPT ===' as info;
