-- ============================================================================
-- ELIMINAR TRIGGER DE NOTIFICACIONES DE TRIAL
-- ============================================================================
-- Este script elimina completamente el trigger de notificaciones de nuevos trials
-- Ejecutar en Supabase SQL Editor

-- Paso 1: Eliminar el trigger primero
DROP TRIGGER IF EXISTS on_trial_created ON subscriptions;

-- Paso 2: Ahora eliminar la función
DROP FUNCTION IF EXISTS notify_new_trial();

-- Paso 3: Verificar que se eliminaron correctamente
SELECT 
  'Trigger eliminado' as status,
  COUNT(*) as triggers_restantes
FROM pg_trigger
WHERE tgname = 'on_trial_created';

SELECT 
  'Función eliminada' as status,
  COUNT(*) as funciones_restantes
FROM pg_proc
WHERE proname = 'notify_new_trial';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- Ambas queries deben devolver 0 en la columna de conteo
-- Esto confirma que el trigger y la función fueron eliminados correctamente
-- ============================================================================
