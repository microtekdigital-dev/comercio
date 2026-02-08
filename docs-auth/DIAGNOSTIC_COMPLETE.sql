-- ============================================================================
-- DIAGNÓSTICO COMPLETO: ¿Por qué se reactiva el trial?
-- ============================================================================

-- PASO 1: Ver TODAS las suscripciones de Plusmar con timestamps exactos
SELECT 
  '=== SUSCRIPCIONES DE PLUSMAR ===' as seccion,
  id,
  status,
  created_at,
  updated_at,
  current_period_start,
  current_period_end,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutos_desde_creacion
FROM subscriptions
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
ORDER BY created_at DESC;

-- PASO 2: Ver el código actual del trigger
SELECT 
  '=== CÓDIGO DEL TRIGGER ===' as seccion,
  CASE 
    WHEN prosrc LIKE '%v_is_new_company%' THEN '✓ Trigger ACTUALIZADO (tiene v_is_new_company)'
    ELSE '✗ Trigger VIEJO (NO tiene v_is_new_company)'
  END as estado_trigger,
  CASE 
    WHEN prosrc LIKE '%IF v_is_new_company THEN%' THEN '✓ Tiene validación de empresa nueva'
    ELSE '✗ NO tiene validación de empresa nueva'
  END as tiene_validacion
FROM pg_proc
WHERE proname = 'handle_new_user';

-- PASO 3: Ver si se crearon usuarios nuevos recientemente
SELECT 
  '=== USUARIOS RECIENTES ===' as seccion,
  email,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutos_desde_creacion,
  raw_user_meta_data->>'invite_token' as tiene_token_invitacion
FROM auth.users
WHERE email = 'microteklh@gmail.com'
ORDER BY created_at DESC;

-- PASO 4: Ver todos los perfiles de Plusmar
SELECT 
  '=== PERFILES DE PLUSMAR ===' as seccion,
  email,
  role,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutos_desde_creacion
FROM profiles
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
ORDER BY created_at DESC;

-- PASO 5: Verificar si el email está en trial_used_emails
SELECT 
  '=== TRIAL USADO ===' as seccion,
  CASE 
    WHEN EXISTS (SELECT 1 FROM trial_used_emails WHERE email = 'microteklh@gmail.com')
    THEN '✓ Email YA usó trial (no debería crear otro)'
    ELSE '✗ Email NO ha usado trial (puede crear trial)'
  END as estado_trial;

-- PASO 6: Ver logs recientes de la base de datos (si existen)
-- Esto mostrará si el trigger se ejecutó recientemente
SELECT 
  '=== RESUMEN ===' as seccion,
  (SELECT COUNT(*) FROM subscriptions WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308') as total_suscripciones,
  (SELECT COUNT(*) FROM subscriptions WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308' AND status = 'active') as suscripciones_activas,
  (SELECT COUNT(*) FROM subscriptions WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308' AND status = 'cancelled') as suscripciones_canceladas;

-- ============================================================================
-- INSTRUCCIONES PARA INTERPRETAR LOS RESULTADOS
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'CÓMO INTERPRETAR LOS RESULTADOS';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'PASO 1 - Suscripciones:';
  RAISE NOTICE '  - Si hay múltiples suscripciones con minutos_desde_creacion pequeños';
  RAISE NOTICE '    → Se están creando suscripciones recientemente';
  RAISE NOTICE '  - Anota el created_at de la última suscripción';
  RAISE NOTICE '';
  RAISE NOTICE 'PASO 2 - Trigger:';
  RAISE NOTICE '  - Si dice "Trigger VIEJO" → Ejecuta FIX_TRIGGER_NO_RECREATE_SUBSCRIPTION.sql';
  RAISE NOTICE '  - Si dice "Trigger ACTUALIZADO" → El problema está en otro lugar';
  RAISE NOTICE '';
  RAISE NOTICE 'PASO 3 - Usuarios:';
  RAISE NOTICE '  - Si hay usuarios con minutos_desde_creacion pequeños';
  RAISE NOTICE '    → Se creó un usuario nuevo recientemente (esto dispara el trigger)';
  RAISE NOTICE '';
  RAISE NOTICE 'PASO 4 - Perfiles:';
  RAISE NOTICE '  - Compara los timestamps con las suscripciones';
  RAISE NOTICE '  - Si coinciden → El trigger creó la suscripción al crear el perfil';
  RAISE NOTICE '';
  RAISE NOTICE 'PASO 5 - Trial usado:';
  RAISE NOTICE '  - Si dice "NO ha usado trial" → El trigger puede crear trial';
  RAISE NOTICE '  - Si dice "YA usó trial" → El trigger NO debería crear trial';
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'POSIBLES CAUSAS:';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE '1. TRIGGER NO ACTUALIZADO:';
  RAISE NOTICE '   → Solución: Ejecuta FIX_TRIGGER_NO_RECREATE_SUBSCRIPTION.sql';
  RAISE NOTICE '';
  RAISE NOTICE '2. USUARIO NUEVO CREADO:';
  RAISE NOTICE '   → El trigger se dispara al crear usuario';
  RAISE NOTICE '   → Verifica si alguien hizo logout/login o se registró de nuevo';
  RAISE NOTICE '';
  RAISE NOTICE '3. WEBHOOK DE MERCADOPAGO:';
  RAISE NOTICE '   → Si hay un pago aprobado, el webhook crea/actualiza suscripción';
  RAISE NOTICE '   → Revisa la tabla payments para ver si hay pagos recientes';
  RAISE NOTICE '';
  RAISE NOTICE '4. CÓDIGO TYPESCRIPT:';
  RAISE NOTICE '   → Poco probable, ya verificamos que está deshabilitado';
  RAISE NOTICE '';
END $$;
