-- ============================================================================
-- DESHABILITAR TRIGGER: notify_new_trial_trigger
-- ============================================================================
-- Este trigger está causando errores porque la extensión http no está disponible
-- Lo deshabilitamos para que no interfiera con la creación de suscripciones

-- 1. Eliminar el trigger
DROP TRIGGER IF EXISTS notify_new_trial_trigger ON subscriptions;

-- 2. Eliminar la función
DROP FUNCTION IF EXISTS notify_new_trial();

-- 3. Verificar que se eliminaron
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'notify_new_trial_trigger';

-- Si no devuelve ninguna fila, el trigger fue eliminado correctamente

-- ============================================================================
-- EXPLICACIÓN:
-- ============================================================================
-- El trigger intentaba usar net.http_post para enviar notificaciones
-- pero la extensión http no está habilitada en tu instancia de Supabase
-- 
-- ALTERNATIVAS:
-- 1. Habilitar la extensión http en Supabase (requiere plan Pro)
-- 2. Usar webhooks de Supabase en lugar de triggers
-- 3. Enviar notificaciones desde el código de la aplicación
-- 4. Usar Supabase Edge Functions
--
-- Por ahora, las notificaciones de nuevos trials quedan deshabilitadas
-- Las notificaciones de pagos (MercadoPago webhook) siguen funcionando
-- ============================================================================
