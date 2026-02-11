-- =====================================================
-- EXECUTE MICROTEK ROLE FIX
-- =====================================================
-- Corrige el role de laplatamicrotek@gmail.com
-- de 'admin' a 'employee' en company_users
-- =====================================================

-- PASO 1: Ver estado actual
SELECT 
  'BEFORE FIX' as status,
  p.email,
  p.role as profile_role,
  cu.role as company_users_role,
  c.name as company_name,
  CASE 
    WHEN p.role = cu.role THEN '✅ Sincronizado'
    ELSE '❌ Desincronizado'
  END as sync_status
FROM profiles p
JOIN company_users cu ON cu.user_id = p.id
JOIN companies c ON cu.company_id = c.id
WHERE p.email = 'laplatamicrotek@gmail.com';

-- =====================================================
-- PASO 2: APLICAR FIX
-- =====================================================

BEGIN;

-- Actualizar company_users.role a 'employee'
UPDATE company_users cu
SET role = 'employee'
FROM profiles p
WHERE cu.user_id = p.id
  AND p.email = 'laplatamicrotek@gmail.com';

-- Verificar cambio
SELECT 
  'AFTER FIX' as status,
  p.email,
  p.role as profile_role,
  cu.role as company_users_role,
  c.name as company_name,
  CASE 
    WHEN p.role = cu.role THEN '✅ Sincronizado'
    ELSE '❌ Aún desincronizado'
  END as sync_status
FROM profiles p
JOIN company_users cu ON cu.user_id = p.id
JOIN companies c ON cu.company_id = c.id
WHERE p.email = 'laplatamicrotek@gmail.com';

COMMIT;

-- =====================================================
-- PASO 3: VERIFICACIÓN COMPLETA
-- =====================================================

-- Ver resumen de todos los usuarios
SELECT 
  'FINAL SUMMARY' as report,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE cu.role = p.role) as synchronized,
  COUNT(*) FILTER (WHERE cu.role != p.role) as mismatched,
  COUNT(*) FILTER (WHERE cu.role IS NULL OR p.role IS NULL) as with_nulls
FROM company_users cu
JOIN profiles p ON cu.user_id = p.id;

-- Ver todos los usuarios con detalle
SELECT 
  c.name as company_name,
  p.email,
  p.role as profile_role,
  cu.role as company_users_role,
  CASE 
    WHEN cu.role IS NULL THEN '❌ NULL en company_users'
    WHEN p.role IS NULL THEN '❌ NULL en profiles'
    WHEN cu.role != p.role THEN '⚠️ Roles diferentes'
    ELSE '✅ OK'
  END as status
FROM company_users cu
JOIN profiles p ON cu.user_id = p.id
JOIN companies c ON cu.company_id = c.id
ORDER BY 
  CASE 
    WHEN cu.role IS NULL OR p.role IS NULL THEN 1
    WHEN cu.role != p.role THEN 2
    ELSE 3
  END,
  c.name, p.email;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Después de ejecutar este script:
-- ✅ laplatamicrotek@gmail.com tendrá role 'employee' en ambas tablas
-- ✅ Todos los 14 usuarios estarán sincronizados
-- ✅ No habrá valores NULL en roles
-- ✅ No habrá desincronizaciones entre profiles y company_users
