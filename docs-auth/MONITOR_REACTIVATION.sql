-- Script de monitoreo rápido para ver si se reactiva el trial

SELECT 
  '=== ESTADO ACTUAL ===' as seccion,
  (SELECT COUNT(*) FROM subscriptions WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308') as total,
  (SELECT COUNT(*) FROM subscriptions WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308' AND status = 'active') as activas,
  (SELECT COUNT(*) FROM trial_used_emails WHERE email = 'microteklh@gmail.com') as email_protegido;

-- Si hay suscripciones activas, ver cuándo se crearon
SELECT 
  '=== SUSCRIPCIONES ACTIVAS ===' as seccion,
  id,
  status,
  created_at,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutos_desde_creacion,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) / 60 as minutos_desde_actualizacion
FROM subscriptions
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
AND status = 'active'
ORDER BY created_at DESC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM subscriptions WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308' AND status = 'active') THEN
    RAISE NOTICE '⚠️  ALERTA: Se detectó suscripción activa!';
    RAISE NOTICE 'Revisa los timestamps arriba para identificar cuándo se creó';
  ELSE
    RAISE NOTICE '✓ Todo correcto: No hay suscripciones activas';
  END IF;
END $$;
