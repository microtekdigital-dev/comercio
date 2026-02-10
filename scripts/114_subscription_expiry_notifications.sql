-- =====================================================
-- Sistema de Notificaciones de Vencimiento de Planes
-- Avisa desde 5 días antes del vencimiento
-- =====================================================

-- Función para verificar suscripciones próximas a vencer
CREATE OR REPLACE FUNCTION check_subscription_expiry_notifications()
RETURNS void AS $$
DECLARE
  subscription_record RECORD;
  notification_exists BOOLEAN;
  days_remaining INTEGER;
  notification_priority TEXT;
BEGIN
  -- Buscar suscripciones activas que vencen en los próximos 5 días
  FOR subscription_record IN 
    SELECT 
      s.id,
      s.company_id,
      s.current_period_end,
      s.status,
      p.name as plan_name,
      p.price,
      p.interval,
      c.name as company_name
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    JOIN companies c ON s.company_id = c.id
    WHERE s.status = 'active'
      AND s.current_period_end IS NOT NULL
      AND s.current_period_end <= NOW() + INTERVAL '5 days'
      AND s.current_period_end > NOW()
      AND s.cancel_at_period_end = false  -- Solo si no está marcado para cancelar
  LOOP
    -- Calcular días restantes
    days_remaining := EXTRACT(DAY FROM subscription_record.current_period_end - NOW())::INTEGER;
    
    -- Determinar prioridad según días restantes
    notification_priority := CASE 
      WHEN days_remaining <= 1 THEN 'urgent'
      WHEN days_remaining <= 2 THEN 'high'
      ELSE 'normal'
    END;
    
    -- Verificar si ya existe una notificación reciente para esta suscripción
    SELECT EXISTS(
      SELECT 1 FROM notifications 
      WHERE company_id = subscription_record.company_id
        AND type = 'subscription_expiry'
        AND metadata->>'subscription_id' = subscription_record.id::text
        AND is_read = FALSE
        AND created_at > NOW() - INTERVAL '24 hours'  -- No duplicar si ya se notificó en las últimas 24h
    ) INTO notification_exists;
    
    -- Crear notificación si no existe
    IF NOT notification_exists THEN
      INSERT INTO notifications (
        company_id, 
        type, 
        title, 
        message, 
        priority, 
        metadata, 
        link
      )
      VALUES (
        subscription_record.company_id,
        'subscription_expiry',
        CASE 
          WHEN days_remaining <= 1 THEN '⚠️ Tu plan vence mañana'
          WHEN days_remaining = 2 THEN '⚠️ Tu plan vence en 2 días'
          ELSE '⏰ Tu plan vence en ' || days_remaining || ' días'
        END,
        'Tu plan ' || subscription_record.plan_name || ' vence el ' || 
        TO_CHAR(subscription_record.current_period_end, 'DD/MM/YYYY') || 
        '. Renueva tu suscripción para continuar sin interrupciones.',
        notification_priority,
        jsonb_build_object(
          'subscription_id', subscription_record.id,
          'plan_name', subscription_record.plan_name,
          'days_remaining', days_remaining,
          'expiry_date', subscription_record.current_period_end,
          'price', subscription_record.price,
          'interval', subscription_record.interval
        ),
        '/dashboard/billing'
      );
      
      RAISE NOTICE 'Notificación creada para % - Plan: % - Días restantes: %', 
        subscription_record.company_name, 
        subscription_record.plan_name, 
        days_remaining;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Verificación de vencimientos completada';
END;
$$ LANGUAGE plpgsql;

-- Función para verificar suscripciones ya vencidas
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS void AS $$
DECLARE
  subscription_record RECORD;
BEGIN
  -- Buscar suscripciones activas que ya vencieron
  FOR subscription_record IN 
    SELECT 
      s.id,
      s.company_id,
      s.current_period_end,
      p.name as plan_name
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.status = 'active'
      AND s.current_period_end IS NOT NULL
      AND s.current_period_end < NOW()
      AND s.cancel_at_period_end = false
  LOOP
    -- Marcar suscripción como expirada
    UPDATE subscriptions
    SET status = 'expired'
    WHERE id = subscription_record.id;
    
    -- Crear notificación de expiración
    INSERT INTO notifications (
      company_id, 
      type, 
      title, 
      message, 
      priority, 
      metadata, 
      link
    )
    VALUES (
      subscription_record.company_id,
      'subscription_expired',
      '❌ Tu plan ha expirado',
      'Tu plan ' || subscription_record.plan_name || ' ha expirado. ' ||
      'Renueva tu suscripción para continuar usando el sistema.',
      'urgent',
      jsonb_build_object(
        'subscription_id', subscription_record.id,
        'plan_name', subscription_record.plan_name,
        'expired_at', subscription_record.current_period_end
      ),
      '/dashboard/billing'
    );
    
    RAISE NOTICE 'Suscripción expirada: % - Plan: %', 
      subscription_record.company_id, 
      subscription_record.plan_name;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON FUNCTION check_subscription_expiry_notifications() IS 
  'Verifica suscripciones que vencen en los próximos 5 días y crea notificaciones';

COMMENT ON FUNCTION check_expired_subscriptions() IS 
  'Marca suscripciones vencidas como expired y crea notificaciones';

-- Verificación
SELECT 'Sistema de notificaciones de vencimiento instalado correctamente' as resultado;
