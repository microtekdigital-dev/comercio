-- Script de diagnóstico para verificar el importe inicial de caja

-- 1. Verificar si las columnas existen en la tabla companies
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'companies'
  AND column_name IN ('initial_cash_amount', 'initial_cash_configured_at');

-- 2. Ver todas las empresas y sus valores de caja inicial
SELECT 
    id,
    name,
    initial_cash_amount,
    initial_cash_configured_at,
    created_at
FROM public.companies
ORDER BY created_at DESC;

-- 3. Ver tu empresa específica (reemplaza con tu company_id si lo conoces)
-- SELECT 
--     id,
--     name,
--     initial_cash_amount,
--     initial_cash_configured_at
-- FROM public.companies
-- WHERE id = 'TU_COMPANY_ID_AQUI';
