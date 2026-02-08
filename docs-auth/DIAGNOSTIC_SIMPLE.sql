-- DIAGNÓSTICO SIMPLE - SIN FUNCIONES AGREGADAS

-- ============================================================================
-- 1. VER TODAS LAS FUNCIONES QUE MENCIONAN SUBSCRIPTIONS
-- ============================================================================
SELECT 
  '=== FUNCIONES CON SUBSCRIPTIONS ===' as seccion,
  p.proname as function_name,
  n.nspname as schema_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND pg_get_functiondef(p.oid) ILIKE '%INSERT INTO%subscriptions%'
ORDER BY p.proname;

-- ============================================================================
-- 2. VER EL CÓDIGO COMPLETO DE handle_new_user
-- ============================================================================
SELECT 
  '=== CÓDIGO DE handle_new_user ===' as seccion,
  pg_get_functiondef(p.oid) as codigo_completo
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'handle_new_user';

-- ============================================================================
-- 3. VER TODOS LOS TRIGGERS EN LA TABLA SUBSCRIPTIONS
-- ============================================================================
SELECT 
  '=== TRIGGERS EN SUBSCRIPTIONS ===' as seccion,
  t.tgname as trigger_name,
  p.proname as function_name,
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
  END as trigger_event
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'public'
AND c.relname = 'subscriptions'
AND NOT t.tgisinternal
ORDER BY t.tgname;

-- ============================================================================
-- 4. VER LA ÚLTIMA SUSCRIPCIÓN CREADA
-- ============================================================================
SELECT 
  '=== ÚLTIMA SUSCRIPCIÓN ===' as seccion,
  id,
  company_id,
  plan_id,
  status,
  created_at,
  updated_at,
  CASE 
    WHEN created_at = updated_at THEN 'NUEVA (nunca actualizada)'
    ELSE 'ACTUALIZADA'
  END as tipo,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutos_desde_creacion
FROM subscriptions
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
ORDER BY created_at DESC
LIMIT 1;

-- ============================================================================
-- 5. BUSCAR FUNCIONES QUE INSERTAN EN SUBSCRIPTIONS
-- ============================================================================
SELECT 
  '=== FUNCIONES QUE INSERTAN SUBSCRIPTIONS ===' as seccion,
  p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND (
  pg_get_functiondef(p.oid) ILIKE '%INSERT INTO public.subscriptions%'
  OR pg_get_functiondef(p.oid) ILIKE '%INSERT INTO subscriptions%'
)
ORDER BY p.proname;

-- ============================================================================
-- 6. VER SI HAY POLÍTICAS RLS ACTIVAS
-- ============================================================================
SELECT 
  '=== POLÍTICAS RLS ===' as seccion,
  schemaname,
  tablename,
  policyname,
  cmd as comando,
  CASE 
    WHEN qual IS NOT NULL THEN 'CON FILTRO'
    ELSE 'SIN FILTRO'
  END as tiene_filtro
FROM pg_policies
WHERE tablename = 'subscriptions'
AND schemaname = 'public';
