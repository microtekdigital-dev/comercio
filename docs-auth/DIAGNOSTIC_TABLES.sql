-- =====================================================
-- DIAGNÓSTICO: Verificar qué tablas existen
-- =====================================================

SELECT '=== TABLAS EXISTENTES ===' as info;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT '=== VERIFICAR TABLAS CRÍTICAS ===' as info;

SELECT 
  'companies' as tabla,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies' AND table_schema = 'public')
    THEN '✓ EXISTE' ELSE '✗ NO EXISTE' END as estado
UNION ALL
SELECT 
  'profiles' as tabla,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public')
    THEN '✓ EXISTE' ELSE '✗ NO EXISTE' END as estado
UNION ALL
SELECT 
  'plans' as tabla,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plans' AND table_schema = 'public')
    THEN '✓ EXISTE' ELSE '✗ NO EXISTE' END as estado
UNION ALL
SELECT 
  'subscriptions' as tabla,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions' AND table_schema = 'public')
    THEN '✓ EXISTE' ELSE '✗ NO EXISTE' END as estado
UNION ALL
SELECT 
  'trial_used_emails' as tabla,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trial_used_emails' AND table_schema = 'public')
    THEN '✓ EXISTE (bloqueo trial activo)' ELSE '✗ NO EXISTE' END as estado;

SELECT '=== VERIFICAR TRIGGER ACTUAL ===' as info;

SELECT 
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'on_auth_user_created';

SELECT '=== FIN DEL DIAGNÓSTICO ===' as info;
