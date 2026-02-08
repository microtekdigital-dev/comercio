-- Eliminar la última suscripción creada para Plusmar

-- Ver la suscripción más reciente
SELECT 
  '=== ÚLTIMA SUSCRIPCIÓN ===' as seccion,
  id,
  status,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutos_desde_creacion
FROM subscriptions
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
ORDER BY created_at DESC
LIMIT 1;

-- Eliminar la suscripción más reciente (solo si es activa y reciente)
DELETE FROM subscriptions
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
AND status = 'active'
AND created_at > NOW() - INTERVAL '5 minutes';

-- Verificar el resultado
SELECT 
  '=== DESPUÉS DE ELIMINAR ===' as seccion,
  COUNT(*) as total_suscripciones,
  COUNT(*) FILTER (WHERE status = 'active') as activas,
  COUNT(*) FILTER (WHERE status = 'cancelled') as canceladas
FROM subscriptions
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308';

DO $$
BEGIN
  RAISE NOTICE 'Suscripción reciente eliminada';
  RAISE NOTICE 'Ejecuta FIND_SUBSCRIPTION_CREATORS.sql para encontrar qué la está creando';
END $$;
