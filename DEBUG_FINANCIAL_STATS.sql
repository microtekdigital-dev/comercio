-- =====================================================
-- DIAGNÓSTICO: Panel de Estadísticas Financieras
-- =====================================================

-- 1. Verificar que la empresa tiene initial_cash_amount configurado
SELECT 
  id,
  name,
  initial_cash_amount,
  initial_cash_configured_at,
  created_at
FROM companies
WHERE name = 'Celulares Roma';

-- 2. Verificar si existe la tabla cash_register
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'cash_register'
) AS cash_register_exists;

-- 3. Verificar si existe la tabla cash_register_openings
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'cash_register_openings'
) AS cash_register_openings_exists;

-- 4. Verificar si existe la tabla cash_register_closures
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'cash_register_closures'
) AS cash_register_closures_exists;

-- 5. Ver estructura de cash_register_openings si existe
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'cash_register_openings'
ORDER BY ordinal_position;

-- 6. Ver si hay aperturas de caja para Celulares Roma
SELECT 
  cro.id,
  cro.opening_date,
  cro.shift,
  cro.initial_cash_amount,
  cro.opened_by_name,
  cro.created_at
FROM cash_register_openings cro
JOIN companies c ON c.id = cro.company_id
WHERE c.name = 'Celulares Roma'
ORDER BY cro.opening_date DESC
LIMIT 5;

-- 7. Ver ventas del día de hoy para Celulares Roma
SELECT 
  s.id,
  s.sale_date,
  s.total,
  s.status,
  s.created_at
FROM sales s
JOIN companies c ON c.id = s.company_id
WHERE c.name = 'Celulares Roma'
  AND s.sale_date >= CURRENT_DATE
ORDER BY s.created_at DESC;

-- 8. Ver clientes activos de Celulares Roma
SELECT COUNT(*) as active_customers
FROM customers cu
JOIN companies c ON c.id = cu.company_id
WHERE c.name = 'Celulares Roma'
  AND cu.status = 'active';

-- 9. Ver proveedores activos de Celulares Roma
SELECT COUNT(*) as active_suppliers
FROM suppliers su
JOIN companies c ON c.id = su.company_id
WHERE c.name = 'Celulares Roma'
  AND su.status = 'active';
