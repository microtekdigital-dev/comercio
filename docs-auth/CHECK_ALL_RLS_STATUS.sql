-- ============================================================================
-- Verificar estado de RLS en TODAS las tablas del sistema
-- ============================================================================

-- Ver TODAS las tablas con RLS deshabilitado
SELECT 
  '❌ TABLAS CON RLS DESHABILITADO' as estado,
  schemaname,
  tablename,
  'DESHABILITADO' as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;

-- Ver TODAS las tablas con RLS habilitado
SELECT 
  '✓ TABLAS CON RLS HABILITADO' as estado,
  schemaname,
  tablename,
  'HABILITADO' as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;

-- Resumen por estado
SELECT 
  'RESUMEN GENERAL' as seccion,
  COUNT(*) FILTER (WHERE rowsecurity = true) as tablas_con_rls,
  COUNT(*) FILTER (WHERE rowsecurity = false) as tablas_sin_rls,
  COUNT(*) as total_tablas
FROM pg_tables
WHERE schemaname = 'public';

-- Tablas críticas que DEBEN tener RLS
SELECT 
  'TABLAS CRÍTICAS' as seccion,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✓ Habilitado'
    ELSE '❌ DESHABILITADO'
  END as estado_rls,
  CASE 
    WHEN rowsecurity = false THEN 'REQUIERE ATENCIÓN INMEDIATA'
    ELSE 'OK'
  END as prioridad
FROM pg_tables
WHERE tablename IN (
  'profiles',
  'companies',
  'company_users',
  'subscriptions',
  'plans',
  'payments',
  'products',
  'product_variants',
  'categories',
  'suppliers',
  'customers',
  'sales',
  'sale_items',
  'purchase_orders',
  'purchase_order_items',
  'stock_movements',
  'price_changes',
  'quotes',
  'quote_items',
  'cash_register',
  'cash_register_openings',
  'notifications',
  'support_tickets',
  'support_messages'
)
AND schemaname = 'public'
ORDER BY 
  CASE WHEN rowsecurity = false THEN 0 ELSE 1 END,
  tablename;
