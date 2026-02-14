-- ============================================================================
-- EMERGENCIA: Deshabilitar RLS temporalmente para diagnóstico
-- SOLO USAR EN DESARROLLO - NUNCA EN PRODUCCIÓN
-- ============================================================================

-- ========================================
-- DESHABILITAR RLS EN TABLAS PROBLEMÁTICAS
-- ========================================

ALTER TABLE public.plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;

-- ========================================
-- VERIFICACIÓN
-- ========================================

SELECT 
  '⚠️ RLS DESHABILITADO' as estado,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✓ Habilitado'
    ELSE '❌ DESHABILITADO'
  END as rls_status
FROM pg_tables
WHERE tablename IN ('plans', 'subscriptions', 'payments')
  AND schemaname = 'public'
ORDER BY tablename;

-- Mensaje
SELECT 
  '⚠️ ATENCIÓN' as alerta,
  'RLS deshabilitado temporalmente' as mensaje,
  'Recarga el navegador y verifica si funciona' as siguiente_paso,
  'Si funciona, el problema es RLS. Si no, es otro problema.' as diagnostico;
