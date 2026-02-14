-- ============================================================================
-- VERIFICACIÓN POST-FIX: vanithegameplay@gmail.com
-- ============================================================================
-- Ejecuta este script para verificar que el fix se aplicó correctamente
-- ============================================================================

-- ========================================
-- 1. VERIFICAR FUNCIÓN HELPER
-- ========================================

SELECT 
  '🔍 VERIFICAR FUNCIÓN' as seccion,
  proname as nombre_funcion,
  prosecdef as es_security_definer,
  CASE 
    WHEN prosecdef = true THEN '✅ Correcto'
    ELSE '❌ Falta SECURITY DEFINER'
  END as estado
FROM pg_proc
WHERE proname = 'get_user_company_id';

-- ========================================
-- 2. VERIFICAR POLÍTICAS DE PURCHASE_ORDERS
-- ========================================

SELECT 
  '📋 POLÍTICAS PURCHASE_ORDERS' as seccion,
  policyname as nombre_politica,
  cmd as comando,
  CASE 
    WHEN qual::text LIKE '%get_user_company_id%' THEN '✅ Usa función helper'
    WHEN qual::text LIKE '%profiles%' THEN '⚠️ Usa subconsulta a profiles'
    ELSE '❓ Revisar'
  END as tipo,
  qual::text as condicion
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'purchase_orders'
ORDER BY policyname;

-- ========================================
-- 3. VERIFICAR POLÍTICAS DE SUPPLIERS
-- ========================================

SELECT 
  '📋 POLÍTICAS SUPPLIERS' as seccion,
  policyname as nombre_politica,
  cmd as comando,
  CASE 
    WHEN qual::text LIKE '%get_user_company_id%' THEN '✅ Usa función helper'
    WHEN qual::text LIKE '%profiles%' THEN '⚠️ Usa subconsulta a profiles'
    ELSE '❓ Revisar'
  END as tipo
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'suppliers'
ORDER BY policyname;

-- ========================================
-- 4. VERIFICAR ESTADO RLS
-- ========================================

SELECT 
  '🔒 ESTADO RLS' as seccion,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ Habilitado'
    ELSE '❌ Deshabilitado'
  END as estado_rls
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'company_users',
    'purchase_orders', 'purchase_order_items',
    'suppliers', 'products'
  )
ORDER BY tablename;

-- ========================================
-- 5. PROBAR FUNCIÓN CON USUARIO REAL
-- ========================================

-- Buscar el user_id de vanithegameplay
SELECT 
  '👤 DATOS VANITHEGAMEPLAY' as seccion,
  id as user_id,
  email,
  company_id,
  role
FROM profiles
WHERE email = 'vanithegameplay@gmail.com';

-- ========================================
-- 6. VERIFICAR SUPPLIERS DE VANITHEGAMEPLAY
-- ========================================

SELECT 
  '🏢 SUPPLIERS VANITHEGAMEPLAY' as seccion,
  s.id,
  s.name,
  s.company_id,
  c.name as company_name
FROM suppliers s
JOIN companies c ON c.id = s.company_id
WHERE s.company_id IN (
  SELECT company_id 
  FROM profiles 
  WHERE email = 'vanithegameplay@gmail.com'
);

-- ========================================
-- 7. VERIFICAR PRODUCTOS DE VANITHEGAMEPLAY
-- ========================================

SELECT 
  '📦 PRODUCTOS VANITHEGAMEPLAY' as seccion,
  COUNT(*) as total_productos,
  COUNT(CASE WHEN track_inventory = true THEN 1 END) as con_inventario,
  COUNT(CASE WHEN stock_quantity > 0 THEN 1 END) as con_stock
FROM products
WHERE company_id IN (
  SELECT company_id 
  FROM profiles 
  WHERE email = 'vanithegameplay@gmail.com'
);

-- ========================================
-- 8. VERIFICAR ÓRDENES EXISTENTES
-- ========================================

SELECT 
  '📋 ÓRDENES EXISTENTES' as seccion,
  COUNT(*) as total_ordenes,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendientes,
  COUNT(CASE WHEN status = 'received' THEN 1 END) as recibidas
FROM purchase_orders
WHERE company_id IN (
  SELECT company_id 
  FROM profiles 
  WHERE email = 'vanithegameplay@gmail.com'
);

-- ========================================
-- 9. RESUMEN FINAL
-- ========================================

SELECT 
  '✅ RESUMEN VERIFICACIÓN' as resultado,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'get_user_company_id' 
      AND prosecdef = true
    ) THEN '✅ Función helper OK'
    ELSE '❌ Función helper falta'
  END as funcion_helper,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'purchase_orders' 
      AND qual::text LIKE '%get_user_company_id%'
    ) THEN '✅ Políticas actualizadas'
    ELSE '❌ Políticas no actualizadas'
  END as politicas,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE email = 'vanithegameplay@gmail.com' 
      AND company_id IS NOT NULL
    ) THEN '✅ Usuario configurado'
    ELSE '❌ Usuario sin company_id'
  END as usuario;

-- ============================================================================
-- INTERPRETACIÓN DE RESULTADOS
-- ============================================================================
-- 
-- Si ves:
-- ✅ Función helper OK + ✅ Políticas actualizadas + ✅ Usuario configurado
-- → El fix se aplicó correctamente
-- 
-- Si ves algún ❌:
-- → Ejecuta nuevamente FIX_ALL_ERP_RLS_POLICIES.sql
-- 
-- Si todo está ✅ pero sigue sin funcionar:
-- → Necesitamos los logs del navegador (F12 → Console)
-- ============================================================================
