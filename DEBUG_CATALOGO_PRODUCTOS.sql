-- =====================================================
-- DEBUG: Productos del catálogo de Microtek
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Verificar productos publicados de Microtek
SELECT id, name, published, is_active
FROM products
WHERE company_id = '6a5790b5-339b-4ab1-acf9-5df20c1421cd'
ORDER BY name;

-- 2. Contar productos publicados
SELECT
  COUNT(*) FILTER (WHERE published = true AND is_active = true) AS publicados_activos,
  COUNT(*) FILTER (WHERE published = false) AS no_publicados,
  COUNT(*) FILTER (WHERE is_active = false) AS inactivos,
  COUNT(*) AS total
FROM products
WHERE company_id = '6a5790b5-339b-4ab1-acf9-5df20c1421cd';

-- 3. Verificar políticas RLS en products
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'products'
ORDER BY policyname;

-- 4. Simular la query del catálogo (como service role, sin RLS)
SELECT id, name, published, is_active, price
FROM products
WHERE company_id = '6a5790b5-339b-4ab1-acf9-5df20c1421cd'
  AND published = true
  AND is_active = true
ORDER BY name;

-- 5. Verificar catalog_settings de Microtek
SELECT * FROM catalog_settings
WHERE company_id = '6a5790b5-339b-4ab1-acf9-5df20c1421cd';

-- 6. Si los productos NO aparecen en query 4, ejecutar esto para publicarlos:
-- UPDATE products
-- SET published = true
-- WHERE company_id = '6a5790b5-339b-4ab1-acf9-5df20c1421cd'
--   AND is_active = true;
