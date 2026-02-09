-- Diagnóstico completo: Por qué los planes anuales no funcionan
-- Este script investiga triggers, constraints y validaciones

-- 1. Ver estructura de la tabla subscriptions
SELECT 
  'Estructura de tabla subscriptions:' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- 2. Ver todos los triggers en la tabla subscriptions
SELECT 
  'Triggers en subscriptions:' as info;

SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'subscriptions';

-- 3. Ver constraints en subscriptions
SELECT 
  'Constraints en subscriptions:' as info;

SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'subscriptions';

-- 4. Intentar crear una suscripción anual de prueba
SELECT 
  'Intentando crear suscripción anual de prueba:' as info;

-- Primero obtener IDs necesarios
SELECT 
  c.id as company_id,
  c.name as company_name,
  p.id as plan_id,
  p.name as plan_name,
  p.interval
FROM companies c
CROSS JOIN plans p
WHERE c.name ILIKE '%vanithegameplay%'
AND p.name = 'Profesional'
AND p.interval = 'year'
LIMIT 1;

-- 5. Ver si hay alguna función que valide subscriptions
SELECT 
  'Funciones relacionadas con subscriptions:' as info;

SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_definition ILIKE '%subscription%'
AND routine_schema = 'public';

-- 6. Ver políticas RLS (Row Level Security) en subscriptions
SELECT 
  'Políticas RLS en subscriptions:' as info;

SELECT 
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

-- 7. Comparar suscripción mensual vs anual exitosa
SELECT 
  'Comparación mensual vs anual:' as info;

SELECT 
  s.id,
  p.name,
  p.interval,
  s.status,
  s.created_at,
  s.current_period_start,
  s.current_period_end,
  c.name as company
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
JOIN companies c ON s.company_id = c.id
WHERE p.interval IN ('month', 'year')
AND s.status = 'active'
ORDER BY p.interval, s.created_at DESC
LIMIT 10;
