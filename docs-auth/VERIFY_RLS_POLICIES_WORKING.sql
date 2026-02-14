-- ============================================================================
-- VERIFICACIÓN: Políticas RLS Funcionando Correctamente
-- ============================================================================
-- Este script verifica que las políticas RLS permiten el acceso correcto
-- ============================================================================

-- ============================================================================
-- TEST 1: Verificar que RLS está habilitado
-- ============================================================================
SELECT 
  '🔒 TEST 1: RLS Status' as test,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ HABILITADO'
    ELSE '❌ DESHABILITADO'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'company_users', 'plans', 'subscriptions', 'payments')
ORDER BY tablename;

-- ============================================================================
-- TEST 2: Contar políticas activas
-- ============================================================================
SELECT 
  '📋 TEST 2: Policy Count' as test,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN tablename = 'profiles' AND COUNT(*) >= 4 THEN '✅ OK'
    WHEN tablename = 'company_users' AND COUNT(*) >= 6 THEN '✅ OK'
    WHEN tablename = 'plans' AND COUNT(*) >= 2 THEN '✅ OK'
    WHEN tablename = 'subscriptions' AND COUNT(*) >= 3 THEN '✅ OK'
    WHEN tablename = 'payments' AND COUNT(*) >= 2 THEN '✅ OK'
    ELSE '⚠️ REVISAR'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'company_users', 'plans', 'subscriptions', 'payments')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- TEST 3: Listar todas las políticas
-- ============================================================================
SELECT 
  '📜 TEST 3: Policy Details' as test,
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN roles = '{authenticated}' THEN '👤 Authenticated'
    WHEN roles = '{service_role}' THEN '🔧 Service Role'
    ELSE roles::text
  END as roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'company_users', 'plans', 'subscriptions', 'payments')
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- TEST 4: Verificar política crítica de profiles
-- ============================================================================
SELECT 
  '🎯 TEST 4: Critical Profile Policy' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'profiles'
        AND policyname = 'Users can view own profile'
        AND cmd = 'SELECT'
    ) THEN '✅ EXISTE - Dashboard puede cargar'
    ELSE '❌ FALTA - Dashboard fallará'
  END as status;

-- ============================================================================
-- TEST 5: Verificar política crítica de company_users
-- ============================================================================
SELECT 
  '🎯 TEST 5: Critical Company Users Policy' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'company_users'
        AND policyname = 'Users can view own memberships'
        AND cmd = 'SELECT'
    ) THEN '✅ EXISTE - Membresías accesibles'
    ELSE '❌ FALTA - Membresías bloqueadas'
  END as status;

-- ============================================================================
-- TEST 6: Verificar acceso a planes (debe ser público)
-- ============================================================================
SELECT 
  '🎯 TEST 6: Plans Public Access' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'plans'
        AND cmd = 'SELECT'
        AND roles = '{authenticated}'
    ) THEN '✅ PLANES ACCESIBLES'
    ELSE '❌ PLANES BLOQUEADOS'
  END as status;

-- ============================================================================
-- TEST 7: Verificar service_role tiene acceso completo
-- ============================================================================
SELECT 
  '🔧 TEST 7: Service Role Access' as test,
  tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_policies p2
      WHERE p2.schemaname = 'public' 
        AND p2.tablename = p.tablename
        AND p2.cmd = 'ALL'
        AND p2.roles = '{service_role}'
    ) THEN '✅ ACCESO COMPLETO'
    ELSE '⚠️ SIN ACCESO COMPLETO'
  END as status
FROM (
  SELECT DISTINCT tablename 
  FROM pg_policies 
  WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'company_users', 'plans', 'subscriptions', 'payments')
) p
ORDER BY tablename;

-- ============================================================================
-- RESUMEN FINAL
-- ============================================================================
SELECT 
  '📊 RESUMEN FINAL' as section,
  CASE 
    WHEN (
      -- RLS habilitado en todas las tablas
      (SELECT COUNT(*) FROM pg_tables 
       WHERE schemaname = 'public' 
         AND tablename IN ('profiles', 'company_users', 'plans', 'subscriptions', 'payments')
         AND rowsecurity = true) = 5
      AND
      -- Política crítica de profiles existe
      EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'profiles'
          AND policyname = 'Users can view own profile'
      )
      AND
      -- Política crítica de company_users existe
      EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'company_users'
          AND policyname = 'Users can view own memberships'
      )
    ) THEN '✅ TODO CORRECTO - Dashboard debería funcionar'
    ELSE '❌ HAY PROBLEMAS - Revisar tests anteriores'
  END as resultado;

-- ============================================================================
-- INSTRUCCIONES:
-- ============================================================================
-- 1. Ejecuta este script completo en Supabase SQL Editor
-- 2. Revisa cada TEST
-- 3. Si todos muestran ✅, el dashboard debería funcionar
-- 4. Si alguno muestra ❌, ejecuta FIX_PROFILES_COMPANY_USERS_RLS_FINAL.sql
-- ============================================================================
