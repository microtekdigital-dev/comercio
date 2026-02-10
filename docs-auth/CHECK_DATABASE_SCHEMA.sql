-- =====================================================
-- VERIFICAR ESQUEMA DE BASE DE DATOS
-- Identificar el problema con la tabla subscriptions
-- =====================================================

-- PASO 1: Verificar todas las tablas en el esquema public
SELECT '=== TABLAS EN SCHEMA PUBLIC ===' as info;

SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- PASO 2: Buscar tablas relacionadas con suscripciones
SELECT '=== TABLAS CON "SUBSCRIPTION" EN EL NOMBRE ===' as info;

SELECT 
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_name ILIKE '%subscription%'
OR table_name ILIKE '%plan%'
ORDER BY table_name;

-- PASO 3: Verificar estructura de la tabla companies
SELECT '=== ESTRUCTURA DE TABLA COMPANIES ===' as info;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'companies'
ORDER BY ordinal_position;

-- PASO 4: Verificar estructura de la tabla profiles
SELECT '=== ESTRUCTURA DE TABLA PROFILES ===' as info;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- PASO 5: Verificar si existe tabla plans
SELECT '=== VERIFICAR TABLA PLANS ===' as info;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plans' AND table_schema = 'public')
    THEN 'Tabla plans EXISTE'
    ELSE 'Tabla plans NO EXISTE'
  END as resultado;

-- PASO 6: Si existe plans, mostrar su contenido
SELECT '=== CONTENIDO DE TABLA PLANS (si existe) ===' as info;

SELECT 
  id,
  name,
  interval,
  is_active,
  price
FROM plans
WHERE table_name = 'plans'
LIMIT 10;

-- PASO 7: Verificar si existe tabla subscriptions
SELECT '=== VERIFICAR TABLA SUBSCRIPTIONS ===' as info;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions' AND table_schema = 'public')
    THEN 'Tabla subscriptions EXISTE'
    ELSE 'Tabla subscriptions NO EXISTE'
  END as resultado;

SELECT '=== FIN DEL DIAGNÓSTICO ===' as info;
