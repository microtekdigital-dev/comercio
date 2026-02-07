-- Script para debuggear el problema de reactivación de Trial
-- Ejecuta esto en Supabase SQL Editor para ver qué está pasando

-- 1. Ver todas las suscripciones y su estado
SELECT 
  s.id,
  s.company_id,
  s.status,
  s.created_at,
  s.updated_at,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  p.name as plan_name,
  p.price as plan_price,
  c.name as company_name
FROM subscriptions s
LEFT JOIN plans p ON s.plan_id = p.id
LEFT JOIN companies c ON s.company_id = c.id
ORDER BY s.created_at DESC
LIMIT 20;

-- 2. Ver si hay múltiples suscripciones para la misma empresa
SELECT 
  company_id,
  COUNT(*) as subscription_count,
  array_agg(status ORDER BY created_at DESC) as statuses,
  array_agg(id ORDER BY created_at DESC) as subscription_ids
FROM subscriptions
GROUP BY company_id
HAVING COUNT(*) > 1;

-- 3. Ver las últimas actualizaciones de suscripciones
SELECT 
  s.id,
  s.company_id,
  s.status,
  s.updated_at,
  p.name as plan_name,
  c.name as company_name
FROM subscriptions s
LEFT JOIN plans p ON s.plan_id = p.id
LEFT JOIN companies c ON s.company_id = c.id
WHERE s.updated_at > NOW() - INTERVAL '1 hour'
ORDER BY s.updated_at DESC;

-- 4. Verificar políticas RLS en la tabla subscriptions
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

-- 5. Ver si hay triggers que puedan estar interfiriendo
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'subscriptions';
