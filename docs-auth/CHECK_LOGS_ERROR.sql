-- Script para verificar el error exacto en la creación de usuarios

-- Ver la función actual
SELECT '=== FUNCIÓN ACTUAL ===' as info;

SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Ver warnings recientes (si están disponibles)
SELECT '=== VERIFICAR ESTRUCTURA DE TABLAS ===' as info;

-- Verificar tabla companies
SELECT 'companies' as tabla, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
ORDER BY ordinal_position;

-- Verificar tabla profiles
SELECT 'profiles' as tabla, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Verificar tabla subscriptions
SELECT 'subscriptions' as tabla, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Verificar tabla company_users (si existe)
SELECT 'company_users' as tabla, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'company_users'
ORDER BY ordinal_position;

SELECT '=== FIN ===' as info;
