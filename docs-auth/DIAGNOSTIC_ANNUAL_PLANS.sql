-- DIAGNÓSTICO COMPLETO: Por qué los planes anuales no se activan
-- Basado en las políticas RLS encontradas

-- ============================================================================
-- PASO 1: VERIFICAR DATOS ACTUALES
-- ============================================================================

SELECT '=== 1. SUSCRIPCIONES ACTUALES DE VANITHEGAMEPLAY ===' as info;

SELECT 
  s.id,
  s.status,
  s.company_id,
  p.name as plan_name,
  p.interval,
  p.price,
  s.created_at,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  c.name as company_name
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE c.name ILIKE '%vanithegameplay%'
ORDER BY s.created_at DESC;

-- ============================================================================
-- PASO 2: VERIFICAR PLANES DISPONIBLES
-- ============================================================================

SELECT '=== 2. PLANES ANUALES DISPONIBLES ===' as info;

SELECT 
  id,
  name,
  interval,
  interval_count,
  price,
  is_active,
  created_at
FROM plans
WHERE interval = 'year'
AND is_active = true
ORDER BY name;

-- ============================================================================
-- PASO 3: VERIFICAR SI HAY TRIGGERS QUE INTERFIEREN
-- ============================================================================

SELECT '=== 3. TRIGGERS EN TABLA SUBSCRIPTIONS ===' as info;

SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'subscriptions'
ORDER BY trigger_name;

-- ============================================================================
-- PASO 4: BUSCAR FUNCIÓN handle_new_user (puede estar creando Trial)
-- ============================================================================

SELECT '=== 4. FUNCIÓN handle_new_user ===' as info;

SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public';

-- ============================================================================
-- PASO 5: VERIFICAR PAGOS RELACIONADOS
-- ============================================================================

SELECT '=== 5. PAGOS DE VANITHEGAMEPLAY ===' as info;

SELECT 
  p.id,
  p.status,
  p.amount,
  p.payment_type,
  p.created_at,
  p.paid_at,
  pl.name as plan_name,
  pl.interval,
  c.name as company_name
FROM payments p
JOIN companies c ON p.company_id = c.id
LEFT JOIN plans pl ON p.plan_id = pl.id
WHERE c.name ILIKE '%vanithegameplay%'
ORDER BY p.created_at DESC
LIMIT 10;

-- ============================================================================
-- PASO 6: VERIFICAR SI HAY MÚLTIPLES SUSCRIPCIONES
-- ============================================================================

SELECT '=== 6. CONTEO DE SUSCRIPCIONES POR EMPRESA ===' as info;

SELECT 
  c.name as company_name,
  COUNT(s.id) as total_subscriptions,
  COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_subscriptions,
  MAX(s.created_at) as last_subscription_date
FROM companies c
LEFT JOIN subscriptions s ON c.id = s.company_id
WHERE c.name ILIKE '%vanithegameplay%'
GROUP BY c.name;

-- ============================================================================
-- PASO 7: VERIFICAR ESTRUCTURA DE TABLA SUBSCRIPTIONS
-- ============================================================================

SELECT '=== 7. ESTRUCTURA DE TABLA SUBSCRIPTIONS ===' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- ============================================================================
-- PASO 8: VERIFICAR CONSTRAINTS
-- ============================================================================

SELECT '=== 8. CONSTRAINTS EN SUBSCRIPTIONS ===' as info;

SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'subscriptions'
ORDER BY tc.constraint_type, tc.constraint_name;

-- ============================================================================
-- PASO 9: BUSCAR FUNCIONES QUE MODIFICAN SUBSCRIPTIONS
-- ============================================================================

SELECT '=== 9. FUNCIONES QUE MENCIONAN SUBSCRIPTIONS ===' as info;

SELECT 
  routine_name,
  routine_type,
  LEFT(routine_definition, 200) as definition_preview
FROM information_schema.routines
WHERE routine_definition ILIKE '%subscription%'
AND routine_schema = 'public'
ORDER BY routine_name;

-- ============================================================================
-- PASO 10: VERIFICAR SI HAY ALGÚN CHECK CONSTRAINT
-- ============================================================================

SELECT '=== 10. CHECK CONSTRAINTS EN SUBSCRIPTIONS ===' as info;

SELECT 
  con.conname as constraint_name,
  pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'subscriptions'
AND con.contype = 'c'
ORDER BY con.conname;

-- ============================================================================
-- NOTAS PARA EL DIAGNÓSTICO
-- ============================================================================

/*
ANÁLISIS:

1. Si hay múltiples suscripciones activas, puede haber un conflicto
2. Si hay un trigger que crea automáticamente Trial, puede estar sobrescribiendo
3. Si hay un constraint que valida el interval, puede estar bloqueando
4. Las políticas RLS parecen correctas y no deberían bloquear

PRÓXIMOS PASOS:
- Ejecutar este script completo
- Revisar los resultados de cada sección
- Identificar qué está causando que las suscripciones anuales no se mantengan
*/
