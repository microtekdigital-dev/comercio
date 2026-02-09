-- Script de diagnóstico para tickets de soporte
-- Ejecuta esto en Supabase SQL Editor

-- 1. Ver todos los tickets existentes
SELECT 
  '=== TODOS LOS TICKETS ===' as seccion,
  t.id,
  t.subject,
  t.status,
  t.created_at,
  c.name as company_name,
  p.email as user_email,
  p.full_name as user_name
FROM support_tickets t
LEFT JOIN companies c ON t.company_id = c.id
LEFT JOIN profiles p ON t.user_id = p.id
ORDER BY t.created_at DESC;

-- 2. Ver todos los mensajes
SELECT 
  '=== TODOS LOS MENSAJES ===' as seccion,
  m.id,
  m.ticket_id,
  m.message,
  m.is_staff,
  m.is_read,
  m.created_at,
  p.email as user_email
FROM support_messages m
LEFT JOIN profiles p ON m.user_id = p.id
ORDER BY m.created_at DESC;

-- 3. Verificar políticas RLS en support_tickets
SELECT 
  '=== POLÍTICAS RLS support_tickets ===' as seccion,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'support_tickets';

-- 4. Verificar políticas RLS en support_messages
SELECT 
  '=== POLÍTICAS RLS support_messages ===' as seccion,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'support_messages';

-- 5. Verificar si RLS está habilitado
SELECT 
  '=== ESTADO RLS ===' as seccion,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('support_tickets', 'support_messages');

-- 6. Contar tickets por estado
SELECT 
  '=== TICKETS POR ESTADO ===' as seccion,
  status,
  COUNT(*) as total
FROM support_tickets
GROUP BY status;

-- 7. Ver estructura de la tabla
SELECT 
  '=== ESTRUCTURA support_tickets ===' as seccion,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'support_tickets'
ORDER BY ordinal_position;
