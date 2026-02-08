-- ============================================================================
-- VERIFICAR QUE EL TRIGGER ESTÉ INSTALADO CORRECTAMENTE
-- ============================================================================

-- 1. Verificar que la función existe
SELECT 
  proname as function_name,
  prosrc as function_body_preview,
  '✅ Función existe' as status
FROM pg_proc
WHERE proname = 'handle_new_user'
LIMIT 1;

-- 2. Verificar que el trigger existe
SELECT 
  tgname as trigger_name,
  tgenabled as is_enabled,
  CASE 
    WHEN tgenabled = 'O' THEN '✅ TRIGGER ACTIVO'
    WHEN tgenabled = 'D' THEN '❌ TRIGGER DESHABILITADO'
    ELSE '⚠️ ESTADO DESCONOCIDO: ' || tgenabled::text
  END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 3. Ver el código completo de la función
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ============================================================================
-- INTERPRETACIÓN:
-- ============================================================================
-- 
-- Query 1: Debe mostrar que la función existe
-- Query 2: Debe mostrar que el trigger está activo (tgenabled = 'O')
-- Query 3: Muestra el código completo para verificar que busca el plan correcto
--
-- Si Query 2 muestra que el trigger está deshabilitado o no existe,
-- ejecutar el script 080_fix_user_creation_trigger.sql
--
-- ============================================================================
