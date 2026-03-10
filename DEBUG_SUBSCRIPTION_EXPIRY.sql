-- =====================================================
-- DEBUG: Sistema de Notificaciones de Vencimiento
-- Verifica por qué no se están creando notificaciones
-- =====================================================

-- 1. Verificar si las funciones existen
SELECT 
  'Funciones instaladas' as verificacion,
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'check_subscription_expiry_notifications') as funcion_expiry_existe,
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'check_expired_subscriptions') as funcion_expired_existe;

-- 2. Ver tu suscripción actual
SELECT 
  'Tu suscripción' as info,
  s.id,
  s.status,
  s.current_period_end,
  s.cancel_at_period_end,
  p.name as plan_name,
  c.name as company_name,
  EXTRACT(DAY FROM s.current_period_end - NOW())::INTEGER as dias_restantes,
  CASE 
    WHEN s.current_period_end <= NOW() + INTERVAL '5 days' AND s.current_period_end > NOW() 
    THEN 'DEBERÍA NOTIFICAR'
    ELSE 'Fuera de rango'
  END as debe_notificar
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
JOIN companies c ON s.company_id = c.id
WHERE s.status = 'active'
ORDER BY s.current_period_end ASC
LIMIT 5;

-- 3. Ver notificaciones de vencimiento existentes
SELECT 
  'Notificaciones existentes' as info,
  n.id,
  n.title,
  n.message,
  n.priority,
  n.is_read,
  n.created_at,
  n.metadata->>'subscription_id' as subscription_id,
  n.metadata->>'days_remaining' as dias_restantes
FROM notifications n
WHERE n.type IN ('subscription_expiry', 'subscription_expired')
ORDER BY n.created_at DESC
LIMIT 10;

-- 4. Verificar suscripciones que deberían generar notificación
SELECT 
  'Suscripciones que deberían notificar' as info,
  s.id as subscription_id,
  c.name as company_name,
  p.name as plan_name,
  s.current_period_end,
  EXTRACT(DAY FROM s.current_period_end - NOW())::INTEGER as dias_restantes,
  s.status,
  s.cancel_at_period_end,
  -- Verificar si ya existe notificación reciente
  EXISTS(
    SELECT 1 FROM notifications 
    WHERE company_id = s.company_id
      AND type = 'subscription_expiry'
      AND metadata->>'subscription_id' = s.id::text
      AND is_read = FALSE
      AND created_at > NOW() - INTERVAL '24 hours'
  ) as tiene_notificacion_reciente
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
JOIN companies c ON s.company_id = c.id
WHERE s.status = 'active'
  AND s.current_period_end IS NOT NULL
  AND s.current_period_end <= NOW() + INTERVAL '5 days'
  AND s.current_period_end > NOW()
  AND s.cancel_at_period_end = false;

-- 5. Ejecutar manualmente la función de verificación (si existe)
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'check_subscription_expiry_notifications') THEN
    PERFORM check_subscription_expiry_notifications();
    RAISE NOTICE 'Función check_subscription_expiry_notifications ejecutada';
  ELSE
    RAISE NOTICE 'La función check_subscription_expiry_notifications NO EXISTE - necesitas ejecutar el script 114';
  END IF;
END $$;

-- 6. Ver notificaciones creadas en los últimos 5 minutos
SELECT 
  'Notificaciones recién creadas' as info,
  n.id,
  n.title,
  n.message,
  n.priority,
  n.created_at,
  n.metadata
FROM notifications n
WHERE n.type IN ('subscription_expiry', 'subscription_expired')
  AND n.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY n.created_at DESC;
