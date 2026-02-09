-- SOLUCIÓN DEFINITIVA: Activar Planes Anuales
-- Este script corrige el problema con los planes anuales que no se activan

-- ============================================================================
-- DIAGNÓSTICO PREVIO
-- ============================================================================

SELECT '=== ANTES DE LA CORRECCIÓN ===' as info;

-- Ver estado actual de vanithegameplay
SELECT 
  s.id,
  s.status,
  p.name as plan_name,
  p.interval,
  s.created_at,
  c.name as company_name
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE c.name ILIKE '%vanithegameplay%'
ORDER BY s.created_at DESC;

-- Ver todos los planes anuales disponibles
SELECT 
  'Planes anuales disponibles:' as info,
  id,
  name,
  interval,
  price,
  is_active
FROM plans
WHERE interval = 'year'
AND is_active = true;

-- ============================================================================
-- PASO 1: LIMPIAR SUSCRIPCIONES EXISTENTES
-- ============================================================================

SELECT '=== LIMPIANDO SUSCRIPCIONES EXISTENTES ===' as info;

-- Eliminar TODAS las suscripciones de vanithegameplay
DELETE FROM subscriptions
WHERE company_id IN (
  SELECT id FROM companies WHERE name ILIKE '%vanithegameplay%'
);

SELECT 'Suscripciones eliminadas' as resultado;

-- ============================================================================
-- PASO 2: CREAR SUSCRIPCIÓN ANUAL PROFESIONAL
-- ============================================================================

SELECT '=== CREANDO SUSCRIPCIÓN ANUAL ===' as info;

-- Insertar suscripción anual usando el plan Profesional anual
DO $$
DECLARE
  v_company_id UUID;
  v_plan_id UUID;
  v_subscription_id UUID;
BEGIN
  -- Obtener company_id
  SELECT id INTO v_company_id
  FROM companies
  WHERE name ILIKE '%vanithegameplay%'
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Empresa vanithegameplay no encontrada';
  END IF;

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

  -- Crear la suscripción
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

  RAISE NOTICE 'Suscripción creada con ID: %', v_subscription_id;
END $$;

-- ============================================================================
-- PASO 3: VERIFICAR RESULTADO
-- ============================================================================

SELECT '=== DESPUÉS DE LA CORRECCIÓN ===' as info;

-- Verificar la suscripción creada
SELECT 
  s.id,
  s.status,
  p.name as plan_name,
  p.interval,
  p.price,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  c.name as company_name,
  EXTRACT(DAY FROM (s.current_period_end - NOW())) as dias_restantes,
  EXTRACT(MONTH FROM (s.current_period_end - NOW())) as meses_restantes
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE c.name ILIKE '%vanithegameplay%'
ORDER BY s.created_at DESC;

-- Verificar que el plan es correcto
SELECT 
  'Verificación del plan:' as info,
  p.id,
  p.name,
  p.interval,
  p.interval_count,
  p.price,
  p.is_active
FROM plans p
WHERE p.id IN (
  SELECT plan_id 
  FROM subscriptions s
  JOIN companies c ON s.company_id = c.id
  WHERE c.name ILIKE '%vanithegameplay%'
);

-- ============================================================================
-- PASO 4: VERIFICAR EN EL FRONTEND
-- ============================================================================

SELECT '=== INSTRUCCIONES PARA VERIFICAR ===' as info;

/*
INSTRUCCIONES:

1. Ejecuta este script completo en Supabase SQL Editor
2. Verifica que la suscripción se creó correctamente (debe mostrar "Profesional" con interval "year")
3. En el navegador:
   - Cierra sesión de vanithegameplay
   - Limpia la caché del navegador (Ctrl+Shift+Delete)
   - Vuelve a iniciar sesión
   - Ve a la página de Facturación
   - Deberías ver el plan "Profesional Anual" activo

4. Si después de esto SIGUE mostrando "Trial":
   - El problema está en el código del frontend
   - Revisa el archivo: lib/utils/plan-limits.ts
   - Revisa el archivo: components/dashboard/current-subscription.tsx
   - Puede haber caché en Vercel que necesita limpiarse

5. Para limpiar caché en Vercel:
   - Ve a tu proyecto en Vercel
   - Settings > Data Cache
   - Purge Everything
   - O redeploy la aplicación
*/

-- ============================================================================
-- PASO 5: CREAR REGISTRO DE PAGO (OPCIONAL)
-- ============================================================================

SELECT '=== CREANDO REGISTRO DE PAGO ===' as info;

-- Crear un registro de pago para que quede documentado
DO $$
DECLARE
  v_company_id UUID;
  v_plan_id UUID;
  v_subscription_id UUID;
BEGIN
  -- Obtener IDs
  SELECT c.id, s.id, s.plan_id
  INTO v_company_id, v_subscription_id, v_plan_id
  FROM companies c
  JOIN subscriptions s ON s.company_id = c.id
  WHERE c.name ILIKE '%vanithegameplay%'
  AND s.status = 'active'
  LIMIT 1;

  IF v_company_id IS NOT NULL THEN
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
    )
    SELECT 
      v_company_id,
      v_plan_id,
      v_subscription_id,
      p.price,
      p.currency,
      'approved',
      'one_time',
      NOW(),
      NOW()
    FROM plans p
    WHERE p.id = v_plan_id;

    RAISE NOTICE 'Registro de pago creado';
  END IF;
END $$;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

SELECT '=== VERIFICACIÓN FINAL COMPLETA ===' as info;

SELECT 
  'Suscripción:' as tipo,
  s.id,
  s.status,
  p.name || ' (' || p.interval || ')' as plan,
  p.price,
  s.current_period_end,
  c.name as empresa
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE c.name ILIKE '%vanithegameplay%'

UNION ALL

SELECT 
  'Pago:' as tipo,
  pay.id,
  pay.status,
  p.name || ' (' || p.interval || ')' as plan,
  pay.amount,
  pay.paid_at,
  c.name as empresa
FROM payments pay
JOIN companies c ON pay.company_id = c.id
JOIN plans p ON pay.plan_id = p.id
WHERE c.name ILIKE '%vanithegameplay%'
ORDER BY tipo, id DESC;

SELECT '=== SCRIPT COMPLETADO ===' as info;
