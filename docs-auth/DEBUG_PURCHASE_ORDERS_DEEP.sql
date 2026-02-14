-- ============================================================================
-- DIAGNÓSTICO PROFUNDO: Purchase Orders después del fix
-- ============================================================================
-- Este script verifica TODO después de aplicar FIX_PURCHASE_ORDERS_ONLY.sql
-- ============================================================================

-- ========================================
-- 1. VERIFICAR FUNCIÓN HELPER
-- ========================================

SELECT 
  '🔧 FUNCIÓN HELPER' as seccion,
  proname as nombre,
  prosecdef as security_definer,
  provolatile as volatilidad,
  prosrc as codigo
FROM pg_proc
WHERE proname = 'get_user_company_id';

-- ========================================
-- 2. VERIFICAR POLÍTICAS PURCHASE_ORDERS
-- ========================================

SELECT 
  '📜 POLÍTICAS PURCHASE_ORDERS' as seccion,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'purchase_orders'
ORDER BY policyname;

-- ========================================
-- 3. VERIFICAR POLÍTICAS PURCHASE_ORDER_ITEMS
-- ========================================

SELECT 
  '📜 POLÍTICAS PURCHASE_ORDER_ITEMS' as seccion,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'purchase_order_items'
ORDER BY policyname;

-- ========================================
-- 4. VERIFICAR POLÍTICAS SUPPLIERS
-- ========================================

SELECT 
  '📜 POLÍTICAS SUPPLIERS' as seccion,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'suppliers'
ORDER BY policyname;

-- ========================================
-- 5. VERIFICAR RLS HABILITADO
-- ========================================

SELECT 
  '🔐 ESTADO RLS' as seccion,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('purchase_orders', 'purchase_order_items', 'suppliers', 'profiles', 'company_users')
ORDER BY tablename;

-- ========================================
-- 6. DATOS USUARIO VANITOADETTE
-- ========================================

SELECT 
  '👤 USUARIO VANITOADETTE' as seccion,
  id as user_id,
  email,
  company_id,
  role,
  created_at
FROM profiles
WHERE email = 'vanitoadette1985@gmail.com';

-- ========================================
-- 7. DATOS USUARIO VANITHEGAMEPLAY
-- ========================================

SELECT 
  '👤 USUARIO VANITHEGAMEPLAY' as seccion,
  id as user_id,
  email,
  company_id,
  role,
  created_at
FROM profiles
WHERE email = 'vanithegameplay@gmail.com';

-- ========================================
-- 8. COMPANY_USERS VANITOADETTE
-- ========================================

SELECT 
  '🏢 COMPANY_USERS VANITOADETTE' as seccion,
  cu.id,
  cu.user_id,
  cu.company_id,
  cu.role,
  p.email
FROM company_users cu
JOIN profiles p ON p.id = cu.user_id
WHERE p.email = 'vanitoadette1985@gmail.com';

-- ========================================
-- 9. COMPANY_USERS VANITHEGAMEPLAY
-- ========================================

SELECT 
  '🏢 COMPANY_USERS VANITHEGAMEPLAY' as seccion,
  cu.id,
  cu.user_id,
  cu.company_id,
  cu.role,
  p.email
FROM company_users cu
JOIN profiles p ON p.id = cu.user_id
WHERE p.email = 'vanithegameplay@gmail.com';

-- ========================================
-- 10. PROVEEDORES VANITOADETTE
-- ========================================

SELECT 
  '🏢 PROVEEDORES VANITOADETTE' as seccion,
  s.id,
  s.name,
  s.company_id,
  p.email as usuario
FROM suppliers s
JOIN profiles p ON p.company_id = s.company_id
WHERE p.email = 'vanitoadette1985@gmail.com'
LIMIT 5;

-- ========================================
-- 11. PROVEEDORES VANITHEGAMEPLAY
-- ========================================

SELECT 
  '🏢 PROVEEDORES VANITHEGAMEPLAY' as seccion,
  s.id,
  s.name,
  s.company_id,
  p.email as usuario
FROM suppliers s
JOIN profiles p ON p.company_id = s.company_id
WHERE p.email = 'vanithegameplay@gmail.com'
LIMIT 5;

-- ========================================
-- 12. PRODUCTOS VANITOADETTE
-- ========================================

SELECT 
  '📦 PRODUCTOS VANITOADETTE' as seccion,
  COUNT(*) as total_productos
FROM products pr
JOIN profiles p ON p.company_id = pr.company_id
WHERE p.email = 'vanitoadette1985@gmail.com';

-- ========================================
-- 13. PRODUCTOS VANITHEGAMEPLAY
-- ========================================

SELECT 
  '📦 PRODUCTOS VANITHEGAMEPLAY' as seccion,
  COUNT(*) as total_productos
FROM products pr
JOIN profiles p ON p.company_id = pr.company_id
WHERE p.email = 'vanithegameplay@gmail.com';

-- ========================================
-- 14. TEST: SIMULAR get_user_company_id()
-- ========================================

-- Para vanitoadette
SELECT 
  '🧪 TEST FUNCIÓN - VANITOADETTE' as seccion,
  p.id as user_id,
  p.email,
  p.company_id as company_id_from_profiles,
  (SELECT company_id FROM profiles WHERE id = p.id LIMIT 1) as company_id_from_function
FROM profiles p
WHERE p.email = 'vanitoadette1985@gmail.com';

-- Para vanithegameplay
SELECT 
  '🧪 TEST FUNCIÓN - VANITHEGAMEPLAY' as seccion,
  p.id as user_id,
  p.email,
  p.company_id as company_id_from_profiles,
  (SELECT company_id FROM profiles WHERE id = p.id LIMIT 1) as company_id_from_function
FROM profiles p
WHERE p.email = 'vanithegameplay@gmail.com';

-- ========================================
-- 15. VERIFICAR PERMISOS DE EJECUCIÓN
-- ========================================

SELECT 
  '🔑 PERMISOS FUNCIÓN' as seccion,
  proname as funcion,
  proacl as permisos,
  CASE 
    WHEN proacl IS NULL THEN '✅ Acceso público (default)'
    ELSE '⚠️ Permisos específicos'
  END as estado
FROM pg_proc
WHERE proname = 'get_user_company_id';

-- ========================================
-- 16. RESUMEN FINAL
-- ========================================

SELECT 
  '✅ RESUMEN' as resultado,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'get_user_company_id' 
      AND prosecdef = true
    ) THEN '✅'
    ELSE '❌'
  END as funcion_helper,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'purchase_orders' 
      AND qual::text LIKE '%get_user_company_id%'
    ) THEN '✅'
    ELSE '❌'
  END as politicas_po,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'suppliers' 
      AND qual::text LIKE '%get_user_company_id%'
    ) THEN '✅'
    ELSE '❌'
  END as politicas_suppliers,
  (SELECT COUNT(*) FROM profiles WHERE email IN ('vanitoadette1985@gmail.com', 'vanithegameplay@gmail.com') AND company_id IS NOT NULL) as usuarios_con_company,
  (SELECT COUNT(*) FROM company_users cu JOIN profiles p ON p.id = cu.user_id WHERE p.email IN ('vanitoadette1985@gmail.com', 'vanithegameplay@gmail.com')) as usuarios_en_company_users;

-- ============================================================================
-- INSTRUCCIONES
-- ============================================================================
-- 
-- Ejecuta este script en Supabase SQL Editor y comparte TODOS los resultados
-- Esto nos ayudará a identificar exactamente qué está fallando
-- 
-- ============================================================================
