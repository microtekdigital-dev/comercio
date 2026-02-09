-- SOLUCIÓN: Activar Plan Anual Profesional para Bazar Lili (vanithegameplay)
-- ID de la empresa: 1420bea3-a484-4a32-a429-bfd5a38063a3

-- ============================================================================
-- PASO 1: VERIFICAR ESTADO ACTUAL
-- ============================================================================

SELECT '=== ESTADO ACTUAL DE BAZAR LILI ===' as info;

SELECT 
  s.id,
  s.status,
  p.name as plan_name,
  p.interval,
  p.price,
  s.created_at,
  s.current_period_start,
  s.current_period_end
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.company_id = '1420bea3-a484-4a32-a429-bfd5a38063a3'
ORDER BY s.created_at DESC;

-- ============================================================================
-- PASO 2: VERIFICAR PLAN PROFESIONAL ANUAL
-- ============================================================================

SELECT '=== PLAN PROFESIONAL ANUAL ===' as info;

SELECT 
  id,
  name,
  interval,
  interval_count,
  price,
  is_active
FROM plans
WHERE name = 'Profesional'
AND interval = 'year'
AND is_active = true;

-- ============================================================================
-- PASO 3: LIMPIAR SUSCRIPCIONES EXISTENTES
-- ============================================================================

SELECT '=== ELIMINANDO SUSCRIPCIONES EXISTENTES ===' as info;

DELETE FROM subscriptions
WHERE company_id = '1420bea3-a484-4a32-a429-bfd5a38063a3';

SELECT 'Suscripciones eliminadas' as resultado;

-- ============================================================================
-- PASO 4: CREAR SUSCRIPCIÓN ANUAL PROFESIONAL
-- ============================================================================

SELECT '=== CREANDO SUSCRIPCIÓN ANUAL ===' as info;

DO $$
DECLARE
  v_company_id UUID := '1420bea3-a484-4a32-a429-bfd5a38063a3';
  v_plan_id UUID;
  v_subscription_id UUID;
BEGIN
  -- Obtener plan_id del plan Profesional anual
  SELECT id INTO v_plan_id
  FROM plans
  WHERE name = 'Profesional'
  AND interval = 'year'
  AND is_active = true
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Plan Profesional anual no encontrado';
  END IF;

  RAISE NOTICE 'Plan encontrado: %', v_plan_id;

  -- Crear la suscripción anual
  INSERT INTO subscriptions (
    company_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    created_at,
    updated_at
  ) VALUES (
    v_company_id,
    v_plan_id,
    'active',
    NOW(),
    NOW() + INTERVAL '1 year',
    false,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_subscription_id;

  RAISE NOTICE 'Suscripción anual creada con ID: %', v_subscription_id;
  RAISE NOTICE 'Empresa: Bazar Lili';
  RAISE NOTICE 'Plan: Profesional Anual';
  RAISE NOTICE 'Válido hasta: %', NOW() + INTERVAL '1 year';
END $$;

-- ============================================================================
-- PASO 5: VERIFICAR RESULTADO
-- ============================================================================

SELECT '=== VERIFICACIÓN FINAL ===' as info;

SELECT 
  s.id as subscription_id,
  s.status,
  p.name as plan_name,
  p.interval,
  p.price,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  c.name as company_name,
  c.slug,
  -- Calcular tiempo restante
  EXTRACT(DAY FROM (s.current_period_end - NOW())) as dias_restantes,
  ROUND(EXTRACT(DAY FROM (s.current_period_end - NOW())) / 30.0, 1) as meses_restantes
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE s.company_id = '1420bea3-a484-4a32-a429-bfd5a38063a3'
ORDER BY s.created_at DESC;

-- ============================================================================
-- PASO 6: CREAR REGISTRO DE PAGO
-- ============================================================================

SELECT '=== CREANDO REGISTRO DE PAGO ===' as info;

DO $$
DECLARE
  v_company_id UUID := '1420bea3-a484-4a32-a429-bfd5a38063a3';
  v_subscription_id UUID;
  v_plan_id UUID;
  v_plan_price NUMERIC;
  v_plan_currency TEXT;
BEGIN
  -- Obtener la suscripción recién creada
  SELECT s.id, s.plan_id, p.price, p.currency
  INTO v_subscription_id, v_plan_id, v_plan_price, v_plan_currency
  FROM subscriptions s
  JOIN plans p ON s.plan_id = p.id
  WHERE s.company_id = v_company_id
  AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF v_subscription_id IS NOT NULL THEN
    -- Crear registro de pago
    INSERT INTO payments (
      company_id,
      plan_id,
      subscription_id,
      amount,
      currency,
      status,
      payment_type,
      paid_at,
      created_at
    ) VALUES (
      v_company_id,
      v_plan_id,
      v_subscription_id,
      v_plan_price,
      v_plan_currency,
      'approved',
      'one_time',
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Registro de pago creado: % %', v_plan_price, v_plan_currency;
  END IF;
END $$;

-- ============================================================================
-- PASO 7: VERIFICACIÓN COMPLETA
-- ============================================================================

SELECT '=== RESUMEN COMPLETO ===' as info;

-- Suscripción
SELECT 
  'SUSCRIPCIÓN' as tipo,
  s.id,
  s.status,
  p.name || ' (' || p.interval || ')' as plan,
  p.price || ' ' || p.currency as precio,
  TO_CHAR(s.current_period_end, 'DD/MM/YYYY') as vence,
  c.name as empresa
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE c.id = '1420bea3-a484-4a32-a429-bfd5a38063a3'

UNION ALL

-- Pago
SELECT 
  'PAGO' as tipo,
  pay.id,
  pay.status,
  p.name || ' (' || p.interval || ')' as plan,
  pay.amount || ' ' || pay.currency as precio,
  TO_CHAR(pay.paid_at, 'DD/MM/YYYY') as fecha,
  c.name as empresa
FROM payments pay
JOIN companies c ON pay.company_id = c.id
JOIN plans p ON pay.plan_id = p.id
WHERE c.id = '1420bea3-a484-4a32-a429-bfd5a38063a3'
ORDER BY tipo DESC, id DESC;

-- ============================================================================
-- INSTRUCCIONES FINALES
-- ============================================================================

SELECT '=== INSTRUCCIONES ===' as info;

/*
✅ SCRIPT COMPLETADO

PRÓXIMOS PASOS:

1. Verifica que la suscripción se creó correctamente arriba
   - Debe mostrar: Plan "Profesional (year)"
   - Status: "active"
   - Válido por 1 año

2. En el navegador (como usuario vanithegameplay@gmail.com):
   - Cierra sesión
   - Limpia la caché del navegador (Ctrl+Shift+Delete)
   - Vuelve a iniciar sesión
   - Ve a la página de Facturación

3. Si SIGUE mostrando "Trial":
   - El problema está en el caché del frontend
   - Solución A: Limpia caché de Vercel
     * Ve a tu proyecto en Vercel
     * Settings > Data Cache > Purge Everything
   
   - Solución B: Redeploy la aplicación
     * Ve a Deployments en Vercel
     * Click en los 3 puntos del último deployment
     * Redeploy

4. Si después de limpiar caché SIGUE en Trial:
   - Ejecuta esta consulta para verificar:
     SELECT * FROM subscriptions 
     WHERE company_id = '1420bea3-a484-4a32-a429-bfd5a38063a3';
   
   - Si muestra el plan anual, el problema está en el código
   - Revisa: lib/utils/plan-limits.ts
*/

SELECT '=== FIN DEL SCRIPT ===' as info;
