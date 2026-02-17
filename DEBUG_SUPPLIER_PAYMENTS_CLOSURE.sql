-- Script para diagnosticar por qué no aparecen los pagos a proveedores en el cierre de caja

-- 1. Ver todos los pagos a proveedores de hoy
SELECT 
  sp.id,
  sp.payment_date,
  sp.amount,
  sp.payment_method,
  sp.created_at,
  s.name as supplier_name,
  sp.company_id
FROM supplier_payments sp
LEFT JOIN suppliers s ON s.id = sp.supplier_id
WHERE sp.payment_date >= CURRENT_DATE
ORDER BY sp.created_at DESC;

-- 2. Ver los cierres de caja de hoy
SELECT 
  id,
  closure_date,
  supplier_payments_cash,
  created_at,
  company_id
FROM cash_register_closures
WHERE closure_date >= CURRENT_DATE
ORDER BY created_at DESC;

-- 3. Ver si hay pagos en efectivo
SELECT 
  sp.id,
  sp.payment_date,
  sp.amount,
  sp.payment_method,
  LOWER(sp.payment_method) as payment_method_lower,
  CASE 
    WHEN LOWER(sp.payment_method) LIKE '%efectivo%' THEN 'SI'
    WHEN LOWER(sp.payment_method) LIKE '%cash%' THEN 'SI'
    ELSE 'NO'
  END as es_efectivo,
  sp.created_at,
  s.name as supplier_name
FROM supplier_payments sp
LEFT JOIN suppliers s ON s.id = sp.supplier_id
WHERE sp.payment_date >= CURRENT_DATE
ORDER BY sp.created_at DESC;

-- 4. Ver la estructura de la tabla supplier_payments
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'supplier_payments'
ORDER BY ordinal_position;
