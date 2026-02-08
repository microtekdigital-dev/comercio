-- Ver TODAS las suscripciones de Plusmar con detalles completos

SELECT 
  id,
  status,
  created_at,
  updated_at,
  current_period_start,
  current_period_end,
  mp_subscription_id,
  cancel_at_period_end,
  -- Calcular cuántos minutos hace que se creó
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutos_desde_creacion,
  -- Calcular cuántos minutos hace que se actualizó
  EXTRACT(EPOCH FROM (NOW() - updated_at)) / 60 as minutos_desde_actualizacion
FROM subscriptions
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
ORDER BY created_at DESC;

-- Ver si hay pagos recientes que puedan haber disparado el webhook
SELECT 
  '=== PAGOS RECIENTES ===' as seccion,
  id,
  status,
  amount,
  mp_payment_id,
  created_at,
  paid_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutos_desde_creacion
FROM payments
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
ORDER BY created_at DESC
LIMIT 5;

-- Ver si se crearon usuarios nuevos recientemente
SELECT 
  '=== USUARIOS RECIENTES ===' as seccion,
  id,
  email,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutos_desde_creacion
FROM auth.users
WHERE email = 'microteklh@gmail.com'
ORDER BY created_at DESC;

-- Ver todos los perfiles de Plusmar
SELECT 
  '=== PERFILES DE PLUSMAR ===' as seccion,
  id,
  email,
  role,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutos_desde_creacion
FROM profiles
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
ORDER BY created_at DESC;

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'ANÁLISIS DE RESULTADOS';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Compara los timestamps (minutos_desde_creacion):';
  RAISE NOTICE '';
  RAISE NOTICE '1. Si la suscripción activa tiene pocos minutos:';
  RAISE NOTICE '   → Se creó recientemente';
  RAISE NOTICE '';
  RAISE NOTICE '2. Si hay un pago con el mismo timestamp:';
  RAISE NOTICE '   → El webhook de MercadoPago creó la suscripción';
  RAISE NOTICE '';
  RAISE NOTICE '3. Si hay un usuario/perfil con el mismo timestamp:';
  RAISE NOTICE '   → El trigger handle_new_user creó la suscripción';
  RAISE NOTICE '';
  RAISE NOTICE '4. Si minutos_desde_actualizacion es diferente a minutos_desde_creacion:';
  RAISE NOTICE '   → La suscripción fue ACTUALIZADA (no creada nueva)';
END $$;
