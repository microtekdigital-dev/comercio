-- Verificar permisos RLS y acceso completo para vanithegameplay
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar el rol del usuario
SELECT 
  'Información del usuario' as seccion,
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.company_id,
  c.name as company_name
FROM profiles p
JOIN companies c ON p.company_id = c.id
WHERE p.email = 'vanithegameplay@gmail.com';

-- 2. Verificar políticas RLS en purchase_orders
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'purchase_orders'
ORDER BY policyname;

-- 3. Verificar políticas RLS en suppliers
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'suppliers'
ORDER BY policyname;

-- 4. Verificar si el usuario puede ver sus propios datos
SELECT 
  'Verificación de acceso a company_users' as seccion,
  cu.user_id,
  cu.company_id,
  cu.role,
  c.name as company_name
FROM company_users cu
JOIN companies c ON cu.company_id = c.id
WHERE cu.user_id IN (
  SELECT id FROM profiles WHERE email = 'vanithegameplay@gmail.com'
);

-- 5. Verificar si hay proveedores creados
SELECT 
  'Proveedores existentes' as seccion,
  COUNT(*) as total_proveedores,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as proveedores_activos
FROM suppliers
WHERE company_id IN (
  SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com'
);

-- 6. Verificar si hay productos para las órdenes
SELECT 
  'Productos existentes' as seccion,
  COUNT(*) as total_productos,
  COUNT(CASE WHEN is_active = true THEN 1 END) as productos_activos
FROM products
WHERE company_id IN (
  SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com'
);

-- 7. Intentar ver órdenes de compra existentes (si las hay)
SELECT 
  'Órdenes de compra existentes' as seccion,
  COUNT(*) as total_ordenes
FROM purchase_orders
WHERE company_id IN (
  SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com'
);

-- 8. Verificar que RLS esté habilitado en las tablas correctas
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('purchase_orders', 'suppliers', 'products', 'company_users')
  AND schemaname = 'public'
ORDER BY tablename;
