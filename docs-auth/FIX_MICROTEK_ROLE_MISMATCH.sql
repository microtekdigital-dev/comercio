-- =====================================================
-- FIX MICROTEK ROLE MISMATCH
-- =====================================================
-- Corrige la desincronización de roles para
-- laplatamicrotek@gmail.com
-- =====================================================

-- Ver el problema en detalle
SELECT 
  'Current State' as status,
  p.email,
  p.role as profile_role,
  cu.role as company_users_role,
  c.name as company_name,
  p.id as user_id,
  cu.id as company_users_id
FROM profiles p
JOIN company_users cu ON cu.user_id = p.id
JOIN companies c ON cu.company_id = c.id
WHERE p.email = 'laplatamicrotek@gmail.com';

-- =====================================================
-- OPCIÓN 1: Actualizar company_users a 'employee'
-- =====================================================
-- Usa esta opción si el usuario debe ser EMPLOYEE
-- =====================================================

/*
BEGIN;

UPDATE company_users cu
SET role = 'employee'
FROM profiles p
WHERE cu.user_id = p.id
  AND p.email = 'laplatamicrotek@gmail.com';

-- Verificar
SELECT 
  'After Update' as status,
  p.email,
  p.role as profile_role,
  cu.role as company_users_role,
  CASE 
    WHEN p.role = cu.role THEN '✅ Sincronizado'
    ELSE '❌ Aún desincronizado'
  END as sync_status
FROM profiles p
JOIN company_users cu ON cu.user_id = p.id
WHERE p.email = 'laplatamicrotek@gmail.com';

COMMIT;
*/

-- =====================================================
-- OPCIÓN 2: Actualizar profiles a 'admin'
-- =====================================================
-- Usa esta opción si el usuario debe ser ADMIN
-- =====================================================

/*
BEGIN;

UPDATE profiles
SET role = 'admin'
WHERE email = 'laplatamicrotek@gmail.com';

-- Verificar
SELECT 
  'After Update' as status,
  p.email,
  p.role as profile_role,
  cu.role as company_users_role,
  CASE 
    WHEN p.role = cu.role THEN '✅ Sincronizado'
    ELSE '❌ Aún desincronizado'
  END as sync_status
FROM profiles p
JOIN company_users cu ON cu.user_id = p.id
WHERE p.email = 'laplatamicrotek@gmail.com';

COMMIT;
*/

-- =====================================================
-- RECOMENDACIÓN
-- =====================================================
-- Para decidir cuál opción usar, verifica:
-- 1. ¿Este usuario debe tener permisos de admin?
-- 2. ¿Qué permisos tiene actualmente en la aplicación?
-- 3. ¿Qué dice el dueño de la empresa Microtek?
--
-- Si no estás seguro, usa OPCIÓN 1 (employee) por seguridad
-- Es más fácil dar permisos después que quitarlos
