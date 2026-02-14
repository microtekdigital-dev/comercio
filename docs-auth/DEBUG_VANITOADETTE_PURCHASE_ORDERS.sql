-- ============================================================================
-- DIAGNÓSTICO: vanitoadette1985@gmail.com - Error al crear orden de compra
-- ============================================================================
-- Ejecuta este script completo en Supabase SQL Editor
-- ============================================================================

-- ========================================
-- 1. VERIFICAR USUARIO Y EMPRESA
-- ========================================

SELECT 
  '👤 DATOS USUARIO' as seccion,
  p.id as user_id,
  p.email,
  p.company_id,
  p.role,
  c.name as empresa,
  CASE 
    WHEN p.company_id IS NULL THEN '❌ Sin empresa asignada'
    ELSE '✅ Empresa asignada'
  END as estado_empresa
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
WHERE p.email = 'vanitoadette1985@gmail.com';

-- ========================================
-- 2. VERIFICAR SUSCRIPCIÓN Y PLAN
-- ========================================

SELECT 
  '📋 SUSCRIPCIÓN' as seccion,
  s.id as subscription_id,
  pl.name as plan,
  s.status,
  s.current_period_start as inicio,
  s.current_period_end as fin,
  CASE 
    WHEN s.status = 'active' THEN '✅ Activa'
    WHEN s.status = 'trialing' THEN '⚠️ En prueba'
    ELSE '❌ Inactiva'
  END as estado_plan
FROM profiles p
JOIN subscriptions s ON s.company_id = p.company_id
JOIN plans pl ON pl.id = s.plan_id
WHERE p.email = 'vanitoadette1985@gmail.com'
  AND s.status IN ('active', 'trialing')
ORDER BY s.created_at DESC;

-- ========================================
-- 3. VERIFICAR PERMISOS DEL PLAN
-- ========================================

SELECT 
  '🔐 PERMISOS PLAN' as seccion,
  pl.name as plan,
  pl.max_users,
  pl.max_products,
  pl.features,
  CASE 
    WHEN pl.features::text LIKE '%purchase_orders%' THEN '✅ Tiene acceso a órdenes'
    ELSE '❌ NO tiene acceso a órdenes'
  END as acceso_ordenes
FROM profiles p
JOIN subscriptions s ON s.company_id = p.company_id
JOIN plans pl ON pl.id = s.plan_id
WHERE p.email = 'vanitoadette1985@gmail.com'
  AND s.status IN ('active', 'trialing')
ORDER BY s.created_at DESC
LIMIT 1;

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
-- 5. VERIFICAR FUNCIÓN HELPER
-- ========================================

SELECT 
  '🔧 FUNCIÓN HELPER' as seccion,
  proname as nombre_funcion,
  prosecdef as es_security_definer,
  CASE 
    WHEN prosecdef = true THEN '✅ SECURITY DEFINER OK'
    ELSE '❌ Falta SECURITY DEFINER'
  END as estado
FROM pg_proc
WHERE proname = 'get_user_company_id';

-- ========================================
-- 6. VERIFICAR POLÍTICAS RLS
-- ========================================

SELECT 
  '📜 POLÍTICAS PURCHASE_ORDERS' as seccion,
  policyname as politica,
  cmd as comando,
  CASE 
    WHEN qual::text LIKE '%get_user_company_id%' THEN '✅ Usa función helper'
    WHEN qual::text LIKE '%profiles%' THEN '⚠️ Usa subconsulta profiles'
    ELSE '❓ Revisar'
  END as tipo
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'purchase_orders'
ORDER BY policyname;

-- ========================================
-- 7. VERIFICAR PROVEEDORES
-- ========================================

SELECT 
  '🏢 PROVEEDORES' as seccion,
  COUNT(*) as total_proveedores
FROM suppliers s
WHERE s.company_id IN (
  SELECT company_id 
  FROM profiles 
  WHERE email = 'vanitoadette1985@gmail.com'
);

-- ========================================
-- 8. VERIFICAR PRODUCTOS
-- ========================================

SELECT 
  '📦 PRODUCTOS' as seccion,
  COUNT(*) as total_productos,
  COUNT(CASE WHEN track_inventory = true THEN 1 END) as con_inventario,
  COUNT(CASE WHEN stock_quantity > 0 THEN 1 END) as con_stock
FROM products
WHERE company_id IN (
  SELECT company_id 
  FROM profiles 
  WHERE email = 'vanitoadette1985@gmail.com'
);

-- ========================================
-- 9. VERIFICAR ÓRDENES EXISTENTES
-- ========================================

SELECT 
  '📋 ÓRDENES EXISTENTES' as seccion,
  COUNT(*) as total_ordenes,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendientes,
  COUNT(CASE WHEN status = 'received' THEN 1 END) as recibidas,
  MAX(created_at) as ultima_orden
FROM purchase_orders
WHERE company_id IN (
  SELECT company_id 
  FROM profiles 
  WHERE email = 'vanitoadette1985@gmail.com'
);

-- ========================================
-- 10. VERIFICAR SUSCRIPCIONES DUPLICADAS
-- ========================================

SELECT 
  '⚠️ SUSCRIPCIONES DUPLICADAS' as seccion,
  c.name as empresa,
  COUNT(s.id) as total_suscripciones,
  STRING_AGG(pl.name || ' (' || s.status || ')', ', ') as planes
FROM profiles p
JOIN companies c ON c.id = p.company_id
JOIN subscriptions s ON s.company_id = c.id
JOIN plans pl ON pl.id = s.plan_id
WHERE p.email = 'vanitoadette1985@gmail.com'
  AND s.status IN ('active', 'trialing')
GROUP BY c.id, c.name
HAVING COUNT(s.id) > 1;

-- ========================================
-- 11. RESUMEN DIAGNÓSTICO
-- ========================================

SELECT 
  '✅ RESUMEN' as resultado,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE email = 'vanitoadette1985@gmail.com' 
      AND company_id IS NOT NULL
    ) THEN '✅ Usuario OK'
    ELSE '❌ Usuario sin empresa'
  END as usuario,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles p
      JOIN subscriptions s ON s.company_id = p.company_id
      WHERE p.email = 'vanitoadette1985@gmail.com'
      AND s.status IN ('active', 'trialing')
    ) THEN '✅ Suscripción OK'
    ELSE '❌ Sin suscripción activa'
  END as suscripcion,
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
    ) THEN '✅ Políticas OK'
    ELSE '❌ Políticas desactualizadas'
  END as politicas_rls;

-- ============================================================================
-- INTERPRETACIÓN DE RESULTADOS
-- ============================================================================
-- 
-- Si ves algún ❌ en el RESUMEN:
-- 1. Usuario sin empresa → Ejecutar FIX_USER_NO_PROFILE.sql
-- 2. Sin suscripción activa → Verificar en Supabase Dashboard
-- 3. Función helper falta → Ejecutar FIX_ALL_ERP_RLS_POLICIES.sql
-- 4. Políticas desactualizadas → Ejecutar FIX_ALL_ERP_RLS_POLICIES.sql
-- 
-- Si todo está ✅:
-- → El usuario debe cerrar sesión y volver a iniciar
-- → Necesitamos los logs del navegador (F12 → Console)
-- ============================================================================
