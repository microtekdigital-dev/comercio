-- ============================================================================
-- Script: Notificar Nuevos Trials por Email
-- ⚠️ DESHABILITADO: Requiere extensión http (no disponible en plan Free)
-- ============================================================================
-- Este script está deshabilitado porque la extensión http de Supabase
-- no está disponible en el plan Free
--
-- ERROR: schema "net" does not exist
-- CAUSA: La extensión http no está habilitada o no está disponible
--
-- ALTERNATIVAS:
-- 1. Habilitar extensión http (requiere plan Pro de Supabase)
-- 2. Usar Supabase Webhooks en lugar de triggers
-- 3. Enviar notificaciones desde el código de la aplicación
-- 4. Usar Supabase Edge Functions
--
-- Por ahora, las notificaciones de nuevos trials están deshabilitadas
-- Las notificaciones de pagos (MercadoPago webhook) siguen funcionando
-- ============================================================================

-- ⚠️ NO EJECUTAR ESTE SCRIPT - ESTÁ DESHABILITADO

/*
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
-- ⚠️ NO EJECUTAR ESTE SCRIPT - ESTÁ DESHABILITADO
-- 
-- Si ya ejecutaste este script y estás viendo errores:
-- 1. Ejecuta el script: docs-auth/DISABLE_NOTIFY_TRIAL_TRIGGER.sql
-- 2. Eso eliminará el trigger problemático
--
-- Para habilitar notificaciones de trials en el futuro:
-- 1. Actualizar a plan Pro de Supabase (para tener extensión http)
-- 2. O usar Supabase Webhooks
-- 3. O implementar notificaciones desde el código de la aplicación
-- ============================================================================
*/
