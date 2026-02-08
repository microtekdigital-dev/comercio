-- Script para verificar todos los triggers activos en la tabla subscriptions

-- 1. Ver todos los triggers en subscriptions
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'subscriptions'
ORDER BY trigger_name;

-- 2. Ver la definición completa de prevent_multiple_trials
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'prevent_multiple_trials';

-- 3. Verificar si hay políticas RLS que puedan estar bloqueando
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
