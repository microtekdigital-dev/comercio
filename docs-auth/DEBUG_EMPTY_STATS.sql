-- Script para diagnosticar por qué getDashboardStats devuelve null para freyanimuetarot@gmail.com
-- Ejecutar este script en Supabase SQL Editor

-- 1. Verificar el usuario actual y su perfil
SELECT 
  'User Profile' as check_type,
  p.id as user_id,
  p.email,
  p.company_id,
  p.role,
  c.name as company_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.companies c ON c.id = p.company_id
WHERE u.email = 'freyanimuetarot@gmail.com';

-- 2. Verificar si la empresa tiene datos
SELECT 
  'Company Data' as check_type,
  c.id as company_id,
  c.name as company_name,
  c.created_at,
  (SELECT COUNT(*) FROM products WHERE company_id = c.id) as total_products,
  (SELECT COUNT(*) FROM customers WHERE company_id = c.id) as total_customers,
  (SELECT COUNT(*) FROM sales WHERE company_id = c.id) as total_sales
FROM companies c
WHERE c.id = (
  SELECT company_id 
  FROM profiles 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'freyanimuetarot@gmail.com')
);

-- 3. Verificar ventas del mes actual
SELECT 
  'Current Month Sales' as check_type,
  COUNT(*) as sales_count,
  SUM(total) as total_revenue,
  status
FROM sales
WHERE company_id = (
  SELECT company_id 
  FROM profiles 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'freyanimuetarot@gmail.com')
)
AND sale_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY status;

-- 4. Verificar productos activos
SELECT 
  'Active Products' as check_type,
  COUNT(*) as product_count,
  SUM(CASE WHEN track_inventory AND stock_quantity <= min_stock_level THEN 1 ELSE 0 END) as low_stock_count
FROM products
WHERE company_id = (
  SELECT company_id 
  FROM profiles 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'freyanimuetarot@gmail.com')
)
AND is_active = true;

-- 5. Verificar clientes activos
SELECT 
  'Active Customers' as check_type,
  COUNT(*) as customer_count
FROM customers
WHERE company_id = (
  SELECT company_id 
  FROM profiles 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'freyanimuetarot@gmail.com')
)
AND status = 'active';

-- 6. Verificar si el company_id es NULL
SELECT 
  'Company ID Check' as check_type,
  CASE 
    WHEN company_id IS NULL THEN 'ERROR: company_id es NULL'
    ELSE 'OK: company_id existe'
  END as status,
  company_id
FROM profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'freyanimuetarot@gmail.com');

-- 7. Verificar si hay problemas con RLS
SELECT 
  'RLS Policies Check' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('products', 'customers', 'sales', 'companies')
ORDER BY tablename, policyname;
