-- =====================================================
-- Debug: Technicians Error
-- =====================================================

-- 1. Verificar que la tabla existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'technicians'
) as table_exists;

-- 2. Ver estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'technicians'
ORDER BY ordinal_position;

-- 3. Verificar RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'technicians';

-- 4. Ver políticas RLS
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
WHERE tablename = 'technicians';

-- 5. Intentar consulta directa (esto puede fallar si hay problema RLS)
SELECT COUNT(*) as total_technicians FROM technicians;

-- 6. Ver si hay datos
SELECT 
  id,
  company_id,
  name,
  specialty,
  is_active
FROM technicians
LIMIT 5;

-- 7. Verificar usuario actual y company_id
SELECT 
  auth.uid() as current_user_id,
  (SELECT company_id FROM company_users WHERE user_id = auth.uid() LIMIT 1) as user_company_id;

-- 8. Ver company_users del usuario actual
SELECT 
  cu.id,
  cu.user_id,
  cu.company_id,
  cu.role,
  c.name as company_name
FROM company_users cu
LEFT JOIN companies c ON c.id = cu.company_id
WHERE cu.user_id = auth.uid();
