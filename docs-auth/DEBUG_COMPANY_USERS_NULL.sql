-- =====================================================
-- DEBUG COMPANY_USERS NULL VALUES
-- =====================================================
-- Diagnóstico de valores NULL en company_users
-- =====================================================

-- 1. Ver estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'company_users'
ORDER BY ordinal_position;

-- 2. Contar registros totales y con NULL
SELECT 
  'Total Records' as metric,
  COUNT(*) as count
FROM company_users
UNION ALL
SELECT 
  'NULL company_id' as metric,
  COUNT(*) as count
FROM company_users
WHERE company_id IS NULL
UNION ALL
SELECT 
  'NULL user_id' as metric,
  COUNT(*) as count
FROM company_users
WHERE user_id IS NULL
UNION ALL
SELECT 
  'NULL role' as metric,
  COUNT(*) as count
FROM company_users
WHERE role IS NULL;

-- 3. Ver registros con NULL (primeros 20)
SELECT 
  id,
  company_id,
  user_id,
  role,
  created_at,
  CASE 
    WHEN company_id IS NULL THEN '❌ NULL company_id'
    WHEN user_id IS NULL THEN '❌ NULL user_id'
    WHEN role IS NULL THEN '❌ NULL role'
    ELSE '✅ OK'
  END as status
FROM company_users
WHERE company_id IS NULL 
   OR user_id IS NULL 
   OR role IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- 4. Ver usuarios sin company en company_users
SELECT 
  p.id as user_id,
  p.email,
  p.company_id as profile_company_id,
  cu.company_id as cu_company_id,
  cu.role as cu_role,
  CASE 
    WHEN cu.company_id IS NULL THEN '❌ NULL en company_users'
    WHEN p.company_id != cu.company_id THEN '⚠️ Desincronizado'
    ELSE '✅ OK'
  END as status
FROM profiles p
LEFT JOIN company_users cu ON cu.user_id = p.id
WHERE cu.company_id IS NULL 
   OR p.company_id != cu.company_id
ORDER BY p.created_at DESC
LIMIT 20;

-- 5. Ver companies sin usuarios en company_users
SELECT 
  c.id as company_id,
  c.name as company_name,
  COUNT(p.id) as users_in_profiles,
  COUNT(cu.user_id) as users_in_company_users,
  CASE 
    WHEN COUNT(cu.user_id) = 0 THEN '❌ Sin usuarios en company_users'
    WHEN COUNT(p.id) != COUNT(cu.user_id) THEN '⚠️ Desincronizado'
    ELSE '✅ OK'
  END as status
FROM companies c
LEFT JOIN profiles p ON p.company_id = c.id
LEFT JOIN company_users cu ON cu.company_id = c.id AND cu.user_id = p.id
GROUP BY c.id, c.name
HAVING COUNT(cu.user_id) = 0 OR COUNT(p.id) != COUNT(cu.user_id)
ORDER BY c.created_at DESC
LIMIT 20;

-- 6. Resumen general
SELECT 
  'Summary' as report_type,
  (SELECT COUNT(*) FROM company_users) as total_company_users,
  (SELECT COUNT(*) FROM company_users WHERE company_id IS NULL) as null_company_id,
  (SELECT COUNT(*) FROM company_users WHERE user_id IS NULL) as null_user_id,
  (SELECT COUNT(*) FROM company_users WHERE role IS NULL) as null_role,
  (SELECT COUNT(*) FROM profiles WHERE company_id IS NOT NULL) as profiles_with_company,
  (SELECT COUNT(DISTINCT cu.user_id) FROM company_users cu WHERE cu.company_id IS NOT NULL) as users_in_company_users;
