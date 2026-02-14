-- ============================================================================
-- DIAGNÓSTICO COMPLETO: Por qué falla RLS en profiles y company_users
-- ============================================================================
-- Este script identifica exactamente por qué las políticas RLS están fallando
-- ============================================================================

-- ============================================================================
-- PASO 1: Verificar estado de RLS
-- ============================================================================
SELECT 
  '🔒 PASO 1: Estado RLS' as paso,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'company_users')
ORDER BY tablename;

-- ============================================================================
-- PASO 2: Listar TODAS las políticas actuales
-- ============================================================================
SELECT 
  '📋 PASO 2: Políticas Actuales' as paso,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'company_users')
ORDER BY tablename, policyname;

-- ============================================================================
-- PASO 3: Verificar datos del usuario de prueba
-- ============================================================================
SELECT 
  '👤 PASO 3: Datos Usuario' as paso,
  u.id as user_id,
  u.email,
  p.id as profile_id,
  p.company_id,
  p.role,
  p.created_at as profile_created
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'vanithegameplay@gmail.com';

-- ============================================================================
-- PASO 4: Verificar company_users
-- ============================================================================
SELECT 
  '🏢 PASO 4: Company Users' as paso,
  cu.user_id,
  cu.company_id,
  cu.role,
  cu.created_at,
  c.name as company_name
FROM public.company_users cu
LEFT JOIN public.companies c ON c.id = cu.company_id
WHERE cu.user_id IN (
  SELECT id FROM auth.users WHERE email = 'vanithegameplay@gmail.com'
);

-- ============================================================================
-- PASO 5: Test de acceso simulado a profiles
-- ============================================================================
DO $$
DECLARE
  v_user_id uuid;
  v_profile_count int;
  v_error_message text;
BEGIN
  -- Obtener user_id
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'vanithegameplay@gmail.com';
  
  RAISE NOTICE '🧪 PASO 5: Test Acceso Profiles';
  RAISE NOTICE 'User ID: %', v_user_id;
  
  -- Intentar contar perfiles accesibles
  BEGIN
    SELECT COUNT(*) INTO v_profile_count
    FROM public.profiles
    WHERE id = v_user_id;
    
    RAISE NOTICE 'Perfiles accesibles: %', v_profile_count;
    
    IF v_profile_count = 0 THEN
      RAISE NOTICE '❌ PROBLEMA: No se puede acceder al perfil propio';
    ELSE
      RAISE NOTICE '✅ OK: Se puede acceder al perfil propio';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
    RAISE NOTICE '❌ ERROR al acceder a profiles: %', v_error_message;
  END;
END $$;

-- ============================================================================
-- PASO 6: Test de acceso simulado a company_users
-- ============================================================================
DO $$
DECLARE
  v_user_id uuid;
  v_membership_count int;
  v_error_message text;
BEGIN
  -- Obtener user_id
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'vanithegameplay@gmail.com';
  
  RAISE NOTICE '🧪 PASO 6: Test Acceso Company Users';
  RAISE NOTICE 'User ID: %', v_user_id;
  
  -- Intentar contar membresías accesibles
  BEGIN
    SELECT COUNT(*) INTO v_membership_count
    FROM public.company_users
    WHERE user_id = v_user_id;
    
    RAISE NOTICE 'Membresías accesibles: %', v_membership_count;
    
    IF v_membership_count = 0 THEN
      RAISE NOTICE '⚠️ WARNING: No se encontraron membresías';
    ELSE
      RAISE NOTICE '✅ OK: Se puede acceder a membresías';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
    RAISE NOTICE '❌ ERROR al acceder a company_users: %', v_error_message;
  END;
END $$;

-- ============================================================================
-- PASO 7: Verificar si auth.uid() funciona correctamente
-- ============================================================================
SELECT 
  '🔑 PASO 7: Función auth.uid()' as paso,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'uid' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
    ) THEN '✅ Función auth.uid() existe'
    ELSE '❌ Función auth.uid() NO existe'
  END as resultado;

-- ============================================================================
-- PASO 8: Verificar permisos en las tablas
-- ============================================================================
SELECT 
  '🔐 PASO 8: Permisos Tablas' as paso,
  schemaname,
  tablename,
  tableowner,
  has_table_privilege('authenticated', schemaname || '.' || tablename, 'SELECT') as authenticated_can_select,
  has_table_privilege('service_role', schemaname || '.' || tablename, 'SELECT') as service_role_can_select
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'company_users')
ORDER BY tablename;

-- ============================================================================
-- PASO 9: Verificar si hay políticas conflictivas
-- ============================================================================
SELECT 
  '⚠️ PASO 9: Políticas Conflictivas' as paso,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ NO HAY POLÍTICAS - RLS bloqueará todo'
    WHEN COUNT(*) > 10 THEN '⚠️ DEMASIADAS POLÍTICAS - Puede haber conflictos'
    ELSE '✅ Cantidad normal de políticas'
  END as diagnostico
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'company_users')
GROUP BY tablename;

-- ============================================================================
-- PASO 10: Verificar estructura de profiles
-- ============================================================================
SELECT 
  '📊 PASO 10: Estructura Profiles' as paso,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================================================
-- RESUMEN Y DIAGNÓSTICO
-- ============================================================================
SELECT 
  '📊 RESUMEN DIAGNÓSTICO' as seccion,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'profiles'
        AND cmd = 'SELECT'
    ) THEN '❌ FALTA política SELECT en profiles'
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'company_users'
        AND cmd = 'SELECT'
    ) THEN '❌ FALTA política SELECT en company_users'
    WHEN NOT EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN auth.users u ON u.id = p.id
      WHERE u.email = 'vanithegameplay@gmail.com'
    ) THEN '❌ Usuario NO tiene perfil en profiles'
    ELSE '✅ Configuración parece correcta - revisar logs de NOTICE arriba'
  END as diagnostico;

-- ============================================================================
-- INSTRUCCIONES:
-- ============================================================================
-- 1. Ejecuta este script COMPLETO en Supabase SQL Editor
-- 2. Copia y pega TODOS los resultados (incluyendo los NOTICE)
-- 3. Comparte los resultados completos
-- 4. Los NOTICE aparecen en la pestaña "Messages" o "Logs" del SQL Editor
-- ============================================================================
