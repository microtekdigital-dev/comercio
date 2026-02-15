-- ============================================================================
-- DIAGNÓSTICO RLS SIMPLE: Purchase Orders en Reporte de Liquidación
-- ============================================================================
-- Este script diagnostica problemas de RLS de forma simple y directa
-- ============================================================================

-- ========================================
-- 1. VERIFICAR ESTADO RLS
-- ========================================

SELECT 
  '🔍 ESTADO RLS' as seccion,
  tablename as tabla,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS Habilitado'
    ELSE '❌ RLS Deshabilitado'
  END as estado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'purchase_orders', 
    'purchase_order_items',
    'company_users'
  )
ORDER BY tablename;

-- ========================================
-- 2. VERIFICAR POLÍTICAS RLS
-- ========================================

SELECT 
  '📋 POLÍTICAS RLS' as seccion,
  tablename as tabla,
  policyname as politica,
  cmd as operacion
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('purchase_orders', 'purchase_order_items')
ORDER BY tablename, cmd;

-- ========================================
-- 3. VERIFICAR USUARIO ACTUAL
-- ========================================

SELECT 
  '👤 USUARIO ACTUAL' as seccion,
  auth.uid() as user_id,
  auth.email() as email,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN '✅ Autenticado'
    ELSE '❌ No autenticado'
  END as estado;

-- ========================================
-- 4. VERIFICAR COMPANY_ID DEL USUARIO
-- ========================================

SELECT 
  '🏢 TU COMPANY' as seccion,
  cu.user_id,
  cu.company_id,
  cu.role,
  c.name as company_name
FROM company_users cu
JOIN companies c ON c.id = cu.company_id
WHERE cu.user_id = auth.uid()
LIMIT 1;

-- ========================================
-- 5. VERIFICAR ÓRDENES VISIBLES (CON RLS)
-- ========================================

SELECT 
  '📦 ÓRDENES VISIBLES CON RLS' as seccion,
  COUNT(*) as total_ordenes,
  COUNT(CASE WHEN status = 'received' THEN 1 END) as ordenes_recibidas,
  COUNT(CASE WHEN status = 'received' AND received_date IS NOT NULL THEN 1 END) as ordenes_con_fecha
FROM purchase_orders;

-- ========================================
-- 6. VERIFICAR TODAS LAS ÓRDENES (SIN RLS)
-- ========================================
-- Esta query muestra TODAS las órdenes sin importar RLS
-- Solo funciona si ejecutas desde Supabase Dashboard con permisos admin

SELECT 
  '📦 TODAS LAS ÓRDENES POR EMPRESA' as seccion,
  c.id as company_id,
  c.name as company_name,
  COUNT(po.id) as total_ordenes,
  COUNT(CASE WHEN po.status = 'received' THEN 1 END) as ordenes_recibidas,
  COUNT(CASE WHEN po.status = 'received' AND po.received_date IS NOT NULL THEN 1 END) as ordenes_con_fecha
FROM companies c
LEFT JOIN purchase_orders po ON po.company_id = c.id
GROUP BY c.id, c.name
HAVING COUNT(po.id) > 0
ORDER BY COUNT(po.id) DESC;

-- ========================================
-- 7. VERIFICAR FUNCIÓN HELPER
-- ========================================

SELECT 
  '🔧 FUNCIÓN HELPER' as seccion,
  proname as funcion,
  CASE 
    WHEN prosecdef = true THEN '✅ SECURITY DEFINER'
    ELSE '❌ Normal'
  END as tipo
FROM pg_proc
WHERE proname = 'get_user_company_id'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ========================================
-- 8. DIAGNÓSTICO FINAL
-- ========================================

WITH user_company AS (
  SELECT company_id 
  FROM company_users 
  WHERE user_id = auth.uid() 
  LIMIT 1
),
visible_orders AS (
  SELECT COUNT(*) as count
  FROM purchase_orders
  WHERE status = 'received'
    AND received_date IS NOT NULL
),
user_orders AS (
  SELECT COUNT(*) as count
  FROM purchase_orders po, user_company uc
  WHERE po.status = 'received'
    AND po.received_date IS NOT NULL
    AND po.company_id = uc.company_id
)
SELECT 
  '🎯 DIAGNÓSTICO' as seccion,
  (SELECT company_id FROM user_company) as tu_company_id,
  (SELECT count FROM visible_orders) as ordenes_visibles_con_rls,
  (SELECT count FROM user_orders) as ordenes_en_tu_empresa,
  CASE 
    WHEN (SELECT count FROM visible_orders) = 0 
      AND (SELECT count FROM user_orders) > 0
    THEN '❌ PROBLEMA RLS: Tienes órdenes pero RLS las bloquea'
    WHEN (SELECT count FROM visible_orders) = 0 
      AND (SELECT count FROM user_orders) = 0
    THEN '⚠️ No tienes órdenes recibidas en tu empresa'
    WHEN (SELECT count FROM visible_orders) > 0
    THEN '✅ RLS funciona correctamente'
    ELSE '❓ Estado desconocido'
  END as diagnostico;

-- ========================================
-- 9. RECOMENDACIÓN
-- ========================================

SELECT 
  '💡 RECOMENDACIÓN' as seccion,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'purchase_orders' 
      AND cmd = 'SELECT'
    )
    THEN '❌ Falta política SELECT en purchase_orders - Ejecuta FIX_PURCHASE_ORDERS_INVENTORY_REPORT_RLS.sql'
    
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'purchase_order_items' 
      AND cmd = 'SELECT'
    )
    THEN '❌ Falta política SELECT en purchase_order_items - Ejecuta FIX_PURCHASE_ORDERS_INVENTORY_REPORT_RLS.sql'
    
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'get_user_company_id' 
      AND prosecdef = true
    )
    THEN '⚠️ Falta función SECURITY DEFINER - Ejecuta FIX_PURCHASE_ORDERS_INVENTORY_REPORT_RLS.sql'
    
    ELSE '✅ Políticas RLS parecen correctas. Verifica company_id y fechas de las órdenes'
  END as accion;

-- ========================================
-- 10. ÓRDENES RECIENTES (PARA VERIFICAR FECHAS)
-- ========================================

SELECT 
  '📅 ÓRDENES RECIENTES' as seccion,
  po.order_number,
  po.status,
  po.received_date,
  c.name as empresa,
  COUNT(poi.id) as items
FROM purchase_orders po
JOIN companies c ON c.id = po.company_id
LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
WHERE po.status = 'received'
  AND po.received_date IS NOT NULL
GROUP BY po.id, po.order_number, po.status, po.received_date, c.name
ORDER BY po.received_date DESC
LIMIT 10;
