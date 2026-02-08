-- BUSCAR EL TRIGGER QUE INSERTA SUSCRIPCIONES

-- ============================================================================
-- 1. BUSCAR TODOS LOS TRIGGERS EN TODAS LAS TABLAS
-- ============================================================================
SELECT 
  '=== TODOS LOS TRIGGERS ===' as seccion,
  n.nspname as schema_name,
  c.relname as table_name,
  t.tgname as trigger_name,
  p.proname as function_name,
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
AND NOT t.tgisinternal
AND t.tgenabled = 'O'  -- Solo triggers habilitados
ORDER BY c.relname, t.tgname;

-- ============================================================================
-- 2. VER EL CÓDIGO DEL TRIGGER handle_new_user
-- ============================================================================
SELECT 
  '=== CÓDIGO DE handle_new_user ===' as seccion,
  pg_get_functiondef(p.oid) as function_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'handle_new_user';

-- ============================================================================
-- 3. BUSCAR TRIGGERS EN LA TABLA auth.users
-- ============================================================================
SELECT 
  '=== TRIGGERS EN auth.users ===' as seccion,
  t.tgname as trigger_name,
  p.proname as function_name,
  CASE t.tgtype::integer & 66
    WHEN 2 THEN 'BEFORE'
    WHEN 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END as trigger_timing
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'auth'
AND c.relname = 'users'
AND NOT t.tgisinternal
ORDER BY t.tgname;

-- ============================================================================
-- 4. BUSCAR TRIGGERS EN LA TABLA profiles
-- ============================================================================
SELECT 
  '=== TRIGGERS EN profiles ===' as seccion,
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_code
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'public'
AND c.relname = 'profiles'
AND NOT t.tgisinternal
ORDER BY t.tgname;

-- ============================================================================
-- 5. BUSCAR TRIGGERS EN LA TABLA companies
-- ============================================================================
SELECT 
  '=== TRIGGERS EN companies ===' as seccion,
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_code
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'public'
AND c.relname = 'companies'
AND NOT t.tgisinternal
ORDER BY t.tgname;
