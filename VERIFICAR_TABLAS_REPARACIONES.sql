-- =====================================================
-- Verificar que las tablas del módulo de reparaciones existen
-- =====================================================

-- Verificar tablas
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'technicians',
    'repair_orders',
    'repair_items',
    'repair_payments',
    'repair_notes'
  )
ORDER BY table_name;

-- Verificar el tipo enum repair_status
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'repair_status'
ORDER BY e.enumsortorder;

-- Verificar función
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_next_repair_order_number';

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN (
  'technicians',
  'repair_orders',
  'repair_items',
  'repair_payments',
  'repair_notes'
)
ORDER BY tablename, policyname;
