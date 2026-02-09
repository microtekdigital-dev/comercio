-- SOLUCIÓN: Activar Plan Anual para vanithegameplay
-- Este script diagnostica y corrige el problema con planes anuales

-- ============================================================================
-- PASO 1: DIAGNÓSTICO - Ver estado actual
-- ============================================================================

SELECT '=== ESTADO ACTUAL ===' as info;

-- Ver suscripciones actuales de vanithegameplay
SELECT 
  s.id,
  s.status,
  p.name as plan_name,
  p.interval,
  p.price,
  s.created_at,
  s.current_period_start,
  s.current_period_end
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE c.name ILIKE '%vanithegameplay%'
ORDER BY s.created_at DESC;

-- Ver plan Profesional anual disponible
SELECT 
  id,
  name,
  interval,
  price,
  is_active,
  interval_count
FROM plans
WHERE name = 'Profesional'
AND interval = 'year'
AND is_active = true;

-- ============================================================================
-- PASO 2: VERIFICAR TRIGGERS Y CONSTRAINTS
-- ============================================================================

SELECT '=== VERIFICANDO TRIGGERS ===' as info;

-- Ver triggers que podrían estar interfiriendo
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'subscriptions'
AND trigger_name NOT LIKE 'pg_%';

-- Ver funciones relacionadas con subscriptions
SELECT '=== FUNCIONES RELACIONADAS ===' as info;

SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_definition ILIKE '%subscription%'
AND routine_schema = 'public'
AND routine_name NOT LIKE 'pg_%';

-- ============================================================================
-- PASO 3: LIMPIAR SUSCRIPCIONES EXISTENTES
-- ============================================================================

SELECT '=== LIMPIANDO SUSCRIPCIONES EXISTENTES ===' as info;

-- Eliminar todas las suscripciones de vanithegameplay
DELETE FROM subscriptions
WHERE company_id IN (
  SELECT id FROM companies WHERE name ILIKE '%vanithegameplay%'
);

-- ============================================================================
-- PASO 4: CREAR SUSCRIPCIÓN ANUAL DIRECTAMENTE
-- ============================================================================

SELECT '=== CREANDO SUSCRIPCIÓN ANUAL ===' as info;

-- Insertar suscripción anual Profesional
INSERT INTO subscriptions (
  company_id,
  plan_id,
  status,
  current_period_start,
  current_period_end,
  created_at,
  updated_at,
  cancel_at_period_end
)
SELECT 
  c.id,
  p.id,
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  NOW(),
  NOW(),
  false
FROM companies c
CROSS JOIN plans p
WHERE c.name ILIKE '%vanithegameplay%'
AND p.name = 'Profesional'
AND p.interval = 'year'
AND p.is_active = true
LIMIT 1;

-- ============================================================================
-- PASO 5: VERIFICAR RESULTADO
-- ============================================================================

SELECT '=== VERIFICACIÓN FINAL ===' as info;

-- Ver la suscripción creada
SELECT 
  s.id,
  s.status,
  p.name as plan_name,
  p.interval,
  p.price,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  c.name as company_name,
  -- Calcular días restantes
  EXTRACT(DAY FROM (s.current_period_end - NOW())) as dias_restantes
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE c.name ILIKE '%vanithegameplay%'
ORDER BY s.created_at DESC;

-- Verificar que el plan está activo
SELECT 
  'Plan activo:' as info,
  name,
  interval,
  price,
  is_active
FROM plans
WHERE name = 'Profesional'
AND interval = 'year';

-- ============================================================================
-- PASO 6: VERIFICAR POLÍTICAS RLS
-- ============================================================================

SELECT '=== POLÍTICAS RLS EN SUBSCRIPTIONS ===' as info;

SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'subscriptions'
ORDER BY policyname;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

/*
NOTAS:
1. Este script elimina todas las suscripciones existentes de vanithegameplay
2. Crea una nueva suscripción anual Profesional válida por 1 año
3. Verifica que no haya triggers o políticas RLS bloqueando la creación
4. Si después de ejecutar este script el plan sigue en Trial, el problema
   está en el código del frontend o en cómo se lee la suscripción

PRÓXIMOS PASOS SI SIGUE FALLANDO:
- Verificar que el código del frontend esté leyendo correctamente la suscripción
- Revisar el archivo lib/utils/plan-limits.ts
- Verificar que no haya caché en el navegador
- Revisar los logs del servidor para ver si hay errores
*/
