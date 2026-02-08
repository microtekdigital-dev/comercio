-- BUSCAR EL PROCESO OCULTO QUE CREA SUSCRIPCIONES
-- Este script busca TODOS los lugares donde se pueden crear subscriptions

-- ============================================================================
-- 1. BUSCAR TODOS LOS TRIGGERS EN LA TABLA SUBSCRIPTIONS
-- ============================================================================
SELECT 
  '=== TRIGGERS EN SUBSCRIPTIONS ===' as seccion,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'subscriptions'
AND event_object_schema = 'public';

-- ============================================================================
-- 2. BUSCAR TODAS LAS FUNCIONES QUE MENCIONAN SUBSCRIPTIONS
-- ============================================================================
SELECT 
  '=== FUNCIONES QUE MENCIONAN SUBSCRIPTIONS ===' as seccion,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND pg_get_functiondef(p.oid) ILIKE '%subscriptions%'
ORDER BY p.proname;

-- ============================================================================
-- 3. BUSCAR POLÍTICAS RLS EN SUBSCRIPTIONS
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
WHERE tablename = 'subscriptions'
AND schemaname = 'public';

-- ============================================================================
-- 4. VERIFICAR SI HAY REGLAS (RULES) EN SUBSCRIPTIONS
-- ============================================================================
SELECT 
  '=== REGLAS EN SUBSCRIPTIONS ===' as seccion,
  schemaname,
  tablename,
  rulename,
  definition
FROM pg_rules
WHERE tablename = 'subscriptions'
AND schemaname = 'public';

-- ============================================================================
-- 5. BUSCAR EDGE FUNCTIONS O WEBHOOKS EN SUPABASE
-- ============================================================================
-- Nota: Esto requiere acceso a las tablas internas de Supabase
-- Si tienes acceso, ejecuta:
SELECT 
  '=== EDGE FUNCTIONS ===' as seccion,
  *
FROM supabase_functions.migrations
WHERE true;

-- ============================================================================
-- 6. VERIFICAR SI HAY CRON JOBS
-- ============================================================================
-- Nota: Esto requiere la extensión pg_cron
SELECT 
  '=== CRON JOBS ===' as seccion,
  *
FROM cron.job
WHERE command ILIKE '%subscription%'
OR command ILIKE '%trial%';

-- ============================================================================
-- 7. BUSCAR TODOS LOS TRIGGERS EN TODAS LAS TABLAS QUE MENCIONAN SUBSCRIPTIONS
-- ============================================================================
SELECT 
  '=== TRIGGERS QUE MENCIONAN SUBSCRIPTIONS ===' as seccion,
  t.tgname as trigger_name,
  c.relname as table_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'public'
AND NOT t.tgisinternal
AND pg_get_functiondef(p.oid) ILIKE '%subscriptions%'
ORDER BY c.relname, t.tgname;

-- ============================================================================
-- 8. VERIFICAR LA ÚLTIMA SUSCRIPCIÓN CREADA
-- ============================================================================
SELECT 
  '=== ÚLTIMA SUSCRIPCIÓN CREADA ===' as seccion,
  id,
  company_id,
  plan_id,
  status,
  created_at,
  updated_at,
  mp_subscription_id,
  current_period_start,
  current_period_end,
  EXTRACT(EPOCH FROM (NOW() - created_at)) as segundos_desde_creacion
FROM subscriptions
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
ORDER BY created_at DESC
LIMIT 1;

-- ============================================================================
-- 9. VERIFICAR SI EL TRIGGER handle_new_user ESTÁ ACTUALIZADO
-- ============================================================================
SELECT 
  '=== CÓDIGO DEL TRIGGER handle_new_user ===' as seccion,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'handle_new_user';

-- ============================================================================
-- INSTRUCCIONES
-- ============================================================================
-- Ejecuta este script completo y envía TODOS los resultados
-- Necesitamos ver TODO para encontrar el proceso oculto
