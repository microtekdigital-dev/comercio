-- Script de diagnóstico para verificar campos de moneda
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si existen las columnas de moneda en la tabla companies
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'companies'
  AND column_name IN ('currency_code', 'currency_symbol', 'currency_position')
ORDER BY column_name;

-- 2. Verificar los valores actuales de moneda en las empresas
SELECT 
    id,
    name,
    currency_code,
    currency_symbol,
    currency_position
FROM public.companies
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar si existe el constraint de currency_position
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.companies'::regclass
  AND conname = 'check_currency_position';

-- 4. Contar empresas sin configuración de moneda
SELECT 
    COUNT(*) as empresas_sin_moneda
FROM public.companies
WHERE currency_code IS NULL 
   OR currency_symbol IS NULL 
   OR currency_position IS NULL;
