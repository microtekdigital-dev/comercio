-- ============================================================================
-- DIAGNÓSTICO RLS: Purchase Orders en Reporte de Liquidación
-- ============================================================================
-- Este script diagnostica problemas de RLS que impiden ver órdenes de compra
-- en el reporte de liquidación de inventario
-- ============================================================================

-- ========================================
-- 1. VERIFICAR ESTADO RLS DE TABLAS CRÍTICAS
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
    'profiles',
    'company_users'
  )
ORDER BY tablename;

-- ========================================
-- 2. VERIFICAR POLÍTICAS RLS PARA SELECT
-- ========================================

SELECT 
  '📋 POLÍTICAS SELECT' as seccion,
  tablename as tabla,
  policyname as politica,
  cmd as operacion
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('purchase_orders', 'purchase_order_items')
  AND cmd = 'SELECT'
ORDER BY tablename;

-- ========================================
-- 3. VERIFICAR USUARIO Y COMPANY ACTUAL
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

-- Intenta obtener company_id desde company_users (más seguro)
SELECT 
  '🏢 COMPANY DEL USUARIO (company_users)' as seccion,
  cu.user_id,
  cu.company_id,
  cu.role,
  c.name as company_name
FROM company_users cu
JOIN companies c ON c.id = cu.company_id
WHERE cu.user_id = auth.uid()
LIMIT 1;

-- ========================================
-- 5. VERIFICAR PURCHASE ORDERS VISIBLES
-- ========================================

-- Esta query usa las políticas RLS actuales
SELECT 
  '📦 ÓRDENES VISIBLES CON RLS' as seccion,
  COUNT(*) as total_ordenes,
  COUNT(CASE WHEN status = 'received' THEN 1 END) as ordenes_recibidas,
  COUNT(CASE WHEN status = 'received' AND received_date IS NOT NULL THEN 1 END) as ordenes_con_fecha
FROM purchase_orders;

-- ========================================
-- 6. VERIFICAR PURCHASE ORDERS SIN RLS (BYPASS)
-- ========================================

-- Esta query muestra TODAS las órdenes sin importar RLS
-- Solo funciona si tienes permisos de admin en Supabase
SELECT 
  '📦 TODAS LAS ÓRDENES (SIN RLS)' as seccion,
  po.order_number,
  po.company_id,
  c.name as company_name,
  po.status,
  po.received_date,
  COUNT(poi.id) as items
FROM purchase_orders po
JOIN companies c ON c.id = po.company_id
LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
WHERE po.status = 'received'
  AND po.received_date IS NOT NULL
  AND po.received_date >= '2026-02-01'
  AND po.received_date <= '2026-02-28'
GROUP BY po.id, po.order_number, po.company_id, c.name, po.status, po.received_date
ORDER BY po.received_date DESC;

-- ========================================
-- 7. COMPARAR: ¿Qué company_id tiene órdenes?
-- ========================================

SELECT 
  '🔍 ÓRDENES POR EMPRESA' as seccion,
  c.id as company_id,
  c.name as company_name,
  COUNT(po.id) as total_ordenes,
  COUNT(CASE WHEN po.status = 'received' THEN 1 END) as ordenes_recibidas
FROM companies c
LEFT JOIN purchase_orders po ON po.company_id = c.id
GROUP BY c.id, c.name
HAVING COUNT(po.id) > 0
ORDER BY COUNT(po.id) DESC;

-- ========================================
-- 8. VERIFICAR FUNCIONES HELPER SECURITY DEFINER
-- ========================================

SELECT 
  '🔧 FUNCIONES HELPER' as seccion,
  proname as funcion,
  CASE 
    WHEN prosecdef = true THEN '✅ SECURITY DEFINER'
    ELSE '❌ Normal'
  END as tipo,
  pg_get_functiondef(oid) as definicion
FROM pg_proc
WHERE proname IN ('get_user_company_id', 'user_has_company_access')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ========================================
-- 9. PROBAR ACCESO DIRECTO A PURCHASE_ORDER_ITEMS
-- ========================================

SELECT 
  '📋 ITEMS VISIBLES CON RLS' as seccion,
  COUNT(*) as total_items,
  COUNT(DISTINCT purchase_order_id) as ordenes_distintas
FROM purchase_order_items;

-- ========================================
-- 10. DIAGNÓSTICO: ¿Por qué no aparecen las compras?
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
all_orders AS (
  SELECT COUNT(*) as count
  FROM purchase_orders po
  WHERE po.status = 'received'
    AND po.received_date IS NOT NULL
    AND po.company_id = (SELECT company_id FROM user_company)
)
SELECT 
  '🎯 DIAGNÓSTICO' as seccion,
  (SELECT company_id FROM user_company) as tu_company_id,
  (SELECT count FROM visible_orders) as ordenes_visibles_con_rls,
  (SELECT count FROM all_orders) as ordenes_en_tu_empresa,
  CASE 
    WHEN (SELECT count FROM visible_orders) = 0 
      AND (SELECT count FROM all_orders) > 0
    THEN '❌ PROBLEMA RLS: Tienes órdenes pero RLS las bloquea'
    WHEN (SELECT count FROM visible_orders) = 0 
      AND (SELECT count FROM all_orders) = 0
    THEN '⚠️ No tienes órdenes en tu empresa'
    WHEN (SELECT count FROM visible_orders) > 0
    THEN '✅ RLS funciona correctamente'
    ELSE '❓ Estado desconocido'
  END as diagnostico;

-- ========================================
-- 11. VERIFICAR POLÍTICAS ESPECÍFICAS
-- ========================================

SELECT 
  '🔍 DETALLE POLÍTICAS purchase_orders' as seccion,
  policyname,
  cmd,
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
  AND tablename = 'purchase_orders';

SELECT 
  '🔍 DETALLE POLÍTICAS purchase_order_items' as seccion,
  policyname,
  cmd,
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
  AND tablename = 'purchase_order_items';

-- ========================================
-- 12. RECOMENDACIÓN
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
    
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'profiles' 
      AND schemaname = 'public' 
      AND rowsecurity = true
    )
    AND NOT EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'get_user_company_id' 
      AND prosecdef = true
    )
    THEN '⚠️ RLS habilitado en profiles pero sin función SECURITY DEFINER - Ejecuta FIX_PURCHASE_ORDERS_INVENTORY_REPORT_RLS.sql'
    
    ELSE '✅ Políticas RLS parecen correctas. Verifica logs del servidor y company_id'
  END as accion;
