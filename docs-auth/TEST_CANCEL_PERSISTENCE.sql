-- Script para probar si las cancelaciones se guardan correctamente

-- PASO 1: Ver el estado actual de TODAS las suscripciones
SELECT 
  '=== TODAS LAS SUSCRIPCIONES ===' as seccion,
  id,
  status,
  created_at,
  updated_at,
  cancel_at_period_end,
  current_period_end
FROM subscriptions
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
ORDER BY created_at DESC;

-- PASO 2: Verificar políticas RLS en subscriptions
SELECT 
  '=== POLÍTICAS RLS ===' as seccion,
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'subscriptions'
ORDER BY policyname;

-- PASO 3: Verificar si hay triggers que puedan estar interfiriendo
SELECT 
  '=== TRIGGERS EN SUBSCRIPTIONS ===' as seccion,
  tgname as trigger_name,
  CASE 
    WHEN tgtype & 2 = 2 THEN 'BEFORE'
    WHEN tgtype & 64 = 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END as timing,
  CASE 
    WHEN tgtype & 4 = 4 THEN 'INSERT'
    WHEN tgtype & 8 = 8 THEN 'DELETE'
    WHEN tgtype & 16 = 16 THEN 'UPDATE'
    ELSE 'OTHER'
  END as event,
  proname as function_name,
  tgenabled as enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'public.subscriptions'::regclass
ORDER BY tgname;

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'ANÁLISIS DE PERSISTENCIA';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Revisa:';
  RAISE NOTICE '1. ¿Cuántas suscripciones hay?';
  RAISE NOTICE '2. ¿Las canceladas tienen status=cancelled?';
  RAISE NOTICE '3. ¿Hay políticas RLS que bloqueen UPDATE?';
  RAISE NOTICE '4. ¿Hay triggers que reviertan cambios?';
END $$;
