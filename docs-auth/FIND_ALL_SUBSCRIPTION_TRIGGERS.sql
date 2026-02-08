-- ============================================================================
-- ENCONTRAR TODOS LOS TRIGGERS Y FUNCIONES QUE TOCAN SUBSCRIPTIONS
-- ============================================================================

-- PASO 1: Todos los triggers en la tabla subscriptions
-- ============================================================================
SELECT 
  '=== TRIGGERS EN SUBSCRIPTIONS ===' as seccion,
  t.tgname as trigger_name,
  t.tgenabled as enabled,
  CASE t.tgtype::integer & 1
    WHEN 1 THEN 'ROW'
    ELSE 'STATEMENT'
  END as trigger_level,
  CASE t.tgtype::integer & 66
    WHEN 2 THEN 'BEFORE'
    WHEN 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END as trigger_timing,
  CASE 
    WHEN t.tgtype::integer & 4 = 4 THEN 'INSERT'
    WHEN t.tgtype::integer & 8 = 8 THEN 'DELETE'
    WHEN t.tgtype::integer & 16 = 16 THEN 'UPDATE'
    ELSE 'OTHER'
  END as trigger_event,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_code
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'public'
AND c.relname = 'subscriptions'
ORDER BY t.tgname;

-- PASO 2: Todas las funciones que mencionan 'subscriptions'
-- ============================================================================
SELECT 
  '=== FUNCIONES QUE MENCIONAN SUBSCRIPTIONS ===' as seccion,
  p.proname as function_name,
  n.nspname as schema_name,
  pg_get_functiondef(p.oid) as function_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%subscriptions%'
AND n.nspname = 'public'
ORDER BY p.proname;

-- PASO 3: Buscar políticas RLS en subscriptions
-- ============================================================================
SELECT 
  '=== POLÍTICAS RLS EN SUBSCRIPTIONS ===' as seccion,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'subscriptions';

-- PASO 4: Buscar Edge Functions (si existen)
-- ============================================================================
SELECT 
  '=== EDGE FUNCTIONS (si existen) ===' as seccion,
  'Verifica en el dashboard de Supabase si hay Edge Functions' as nota,
  'URL: https://supabase.com/dashboard/project/[tu-proyecto]/functions' as url;

-- PASO 5: Verificar si hay cron jobs
-- ============================================================================
SELECT 
  '=== CRON JOBS (si existen) ===' as seccion,
  'Verifica en el dashboard de Supabase si hay cron jobs' as nota,
  'También revisa: app/api/cron/notifications/route.ts' as archivo;
