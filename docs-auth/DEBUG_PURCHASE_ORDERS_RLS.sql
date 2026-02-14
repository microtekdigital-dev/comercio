-- ============================================================================
-- DIAGNÓSTICO: Purchase Orders RLS
-- ============================================================================
-- Este script diagnostica por qué no se pueden crear órdenes de compra
-- ============================================================================

-- ========================================
-- 1. VERIFICAR ESTADO RLS
-- ========================================

SELECT 
  '🔍 ESTADO RLS DE TABLAS' as seccion,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ Habilitado'
    ELSE '❌ Deshabilitado'
  END as rls_estado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'suppliers', 'purchase_orders', 'purchase_order_items', 'supplier_payments')
ORDER BY tablename;

-- ========================================
-- 2. VERIFICAR POLÍTICAS EXISTENTES
-- ========================================

SELECT 
  '📋 POLÍTICAS RLS ACTUALES' as seccion,
  tablename,
  policyname,
  cmd as operacion,
  CASE 
    WHEN qual IS NOT NULL THEN 'Tiene USING'
    ELSE 'Sin USING'
  END as tiene_using,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Tiene WITH CHECK'
    ELSE 'Sin WITH CHECK'
  END as tiene_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('suppliers', 'purchase_orders', 'purchase_order_items', 'supplier_payments')
ORDER BY tablename, cmd;

-- ========================================
-- 3. VERIFICAR FUNCIONES HELPER
-- ========================================

SELECT 
  '🔧 FUNCIONES HELPER' as seccion,
  proname as nombre_funcion,
  prosecdef as es_security_definer,
  CASE 
    WHEN prosecdef = true THEN '✅ SECURITY DEFINER (puede leer profiles)'
    ELSE '❌ Normal (bloqueada por RLS)'
  END as tipo
FROM pg_proc
WHERE proname LIKE '%company%'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- ========================================
-- 4. PROBAR ACCESO A PROFILES
-- ========================================

-- Nota: Esta query fallará si RLS está habilitado en profiles
-- y no hay políticas que permitan acceso
SELECT 
  '👤 PRUEBA DE ACCESO A PROFILES' as seccion,
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles LIMIT 1) THEN '✅ Puede leer profiles'
    ELSE '❌ No puede leer profiles'
  END as resultado;

-- ========================================
-- 5. VERIFICAR USUARIO ACTUAL
-- ========================================

SELECT 
  '🔐 USUARIO ACTUAL' as seccion,
  auth.uid() as user_id,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN '✅ Usuario autenticado'
    ELSE '❌ No autenticado'
  END as estado;

-- ========================================
-- 6. VERIFICAR COMPANY_ID DEL USUARIO
-- ========================================

-- Nota: Esta query fallará si RLS está habilitado en profiles
SELECT 
  '🏢 COMPANY DEL USUARIO' as seccion,
  p.id as user_id,
  p.company_id,
  p.role,
  CASE 
    WHEN p.company_id IS NOT NULL THEN '✅ Tiene company_id'
    ELSE '❌ Sin company_id'
  END as estado
FROM profiles p
WHERE p.id = auth.uid();

-- ========================================
-- 7. VERIFICAR SUPPLIERS DEL USUARIO
-- ========================================

SELECT 
  '🏭 SUPPLIERS DISPONIBLES' as seccion,
  COUNT(*) as total_suppliers
FROM suppliers s
WHERE s.company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
);

-- ========================================
-- 8. VERIFICAR PURCHASE ORDERS EXISTENTES
-- ========================================

SELECT 
  '📦 PURCHASE ORDERS EXISTENTES' as seccion,
  COUNT(*) as total_orders,
  MAX(order_number) as ultimo_numero
FROM purchase_orders po
WHERE po.company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
);

-- ========================================
-- 9. DIAGNÓSTICO FINAL
-- ========================================

SELECT 
  '🎯 DIAGNÓSTICO' as seccion,
  CASE 
    WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') = true
    THEN '⚠️ PROBLEMA: RLS habilitado en profiles - las políticas de purchase_orders no funcionarán'
    ELSE '✅ RLS deshabilitado en profiles - las políticas deberían funcionar'
  END as estado_profiles,
  CASE 
    WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'purchase_orders' AND schemaname = 'public') = true
    THEN '✅ RLS habilitado en purchase_orders'
    ELSE '❌ RLS deshabilitado en purchase_orders'
  END as estado_purchase_orders,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'purchase_orders' 
      AND policyname LIKE '%insert%'
    )
    THEN '✅ Tiene política INSERT'
    ELSE '❌ Sin política INSERT'
  END as tiene_politica_insert;

-- ========================================
-- 10. RECOMENDACIÓN
-- ========================================

SELECT 
  '💡 RECOMENDACIÓN' as seccion,
  CASE 
    WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') = true
    THEN 'Ejecuta FIX_PURCHASE_ORDERS_RLS.sql para crear función SECURITY DEFINER'
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'get_user_company_id' 
      AND prosecdef = true
    )
    THEN 'Ejecuta FIX_PURCHASE_ORDERS_RLS.sql para crear función helper'
    ELSE 'Las políticas deberían funcionar. Revisa los logs del servidor.'
  END as accion_recomendada;
