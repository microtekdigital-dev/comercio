-- =====================================================
-- Debug Script: Repair Order Access
-- Description: Diagnose issues with repair order access
-- =====================================================

-- 1. Check if repair_orders table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'repair_orders'
) as repair_orders_exists;

-- 2. Check if repair_status type exists
SELECT EXISTS (
  SELECT FROM pg_type 
  WHERE typname = 'repair_status'
) as repair_status_type_exists;

-- 3. Count repair orders
SELECT COUNT(*) as total_repair_orders FROM repair_orders;

-- 4. Check RLS policies on repair_orders
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
WHERE tablename = 'repair_orders';

-- 5. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'repair_orders';

-- 6. List all repair orders (if any)
SELECT 
  id,
  order_number,
  company_id,
  customer_id,
  status,
  device_type,
  created_at
FROM repair_orders
ORDER BY created_at DESC
LIMIT 10;

-- 7. Check related tables
SELECT 
  'technicians' as table_name,
  COUNT(*) as count
FROM technicians
UNION ALL
SELECT 
  'repair_items' as table_name,
  COUNT(*) as count
FROM repair_items
UNION ALL
SELECT 
  'repair_payments' as table_name,
  COUNT(*) as count
FROM repair_payments
UNION ALL
SELECT 
  'repair_notes' as table_name,
  COUNT(*) as count
FROM repair_notes;
