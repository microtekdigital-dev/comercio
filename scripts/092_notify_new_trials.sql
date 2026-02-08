-- ============================================================================
-- Script: Notificar Nuevos Trials por Email
-- Descripción: Envía notificación al administrador cuando un usuario se registra
-- ============================================================================

-- Habilitar la extensión http si no está habilitada
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Función para notificar nuevos trials
CREATE OR REPLACE FUNCTION notify_new_trial()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_price NUMERIC;
  v_api_url TEXT;
BEGIN
  -- Obtener el precio del plan
  SELECT price INTO v_plan_price
  FROM plans
  WHERE id = NEW.plan_id;

  -- Solo notificar si es un trial (precio = 0) y es una nueva suscripción
  IF v_plan_price = 0 AND NEW.status = 'active' THEN
    -- URL de tu API (ajusta según tu dominio)
    -- En desarrollo: http://localhost:3000
    -- En producción: https://tu-dominio.vercel.app
    v_api_url := current_setting('app.settings.api_url', true);
    
    -- Si no está configurada, usar la URL de producción por defecto
    IF v_api_url IS NULL OR v_api_url = '' THEN
      v_api_url := 'https://comercio-psi.vercel.app';
    END IF;

    -- Llamar al endpoint de notificación (asíncrono, no bloquea)
    PERFORM net.http_post(
      url := v_api_url || '/api/notifications/new-trial',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'company_id', NEW.company_id
      )::text
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para notificar nuevos trials
DROP TRIGGER IF EXISTS on_trial_created ON subscriptions;
CREATE TRIGGER on_trial_created
  AFTER INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_trial();

-- Comentarios
COMMENT ON FUNCTION notify_new_trial() IS 'Envía notificación por email cuando se crea un trial';
COMMENT ON TRIGGER on_trial_created ON subscriptions IS 'Trigger que notifica nuevos trials al administrador';

-- ============================================================================
-- INSTRUCCIONES DE USO:
-- ============================================================================
-- 1. Ejecuta este script en el SQL Editor de Supabase
-- 2. Configura la URL de tu API (opcional):
--    ALTER DATABASE postgres SET app.settings.api_url = 'https://tu-dominio.vercel.app';
-- 3. Asegúrate de tener configurada la variable ADMIN_NOTIFICATION_EMAIL en Vercel
-- 4. Prueba registrando un nuevo usuario
-- ============================================================================
