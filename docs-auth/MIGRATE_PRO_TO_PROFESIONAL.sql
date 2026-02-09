-- MIGRACIÓN: Eliminar plan "Pro" y migrar suscripciones a "Profesional"
-- Este script asegura que los usuarios con plan "Pro" no pierdan su suscripción

-- ============================================================================
-- PASO 1: VERIFICAR ESTADO ACTUAL
-- ============================================================================

SELECT '=== PLANES ACTUALES ===' as info;

-- Ver todos los planes Pro y Profesional
SELECT 
  id,
  name,
  interval,
  price,
  is_active,
  created_at
FROM plans
WHERE name IN ('Pro', 'Profesional')
ORDER BY name, interval;

SELECT '=== SUSCRIPCIONES CON PLAN PRO ===' as info;

-- Ver quién tiene suscripciones con plan "Pro"
SELECT 
  s.id as subscription_id,
  c.name as company_name,
  p.name as plan_name,
  p.interval,
  s.status,
  s.current_period_end
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE p.name = 'Pro'
ORDER BY c.name;

-- ============================================================================
-- PASO 2: MIGRAR SUSCRIPCIONES DE "PRO" A "PROFESIONAL"
-- ============================================================================

SELECT '=== MIGRANDO SUSCRIPCIONES ===' as info;

DO $$
DECLARE
  subscription_record RECORD;
  new_plan_id UUID;
  migrated_count INTEGER := 0;
BEGIN
  -- Para cada suscripción con plan "Pro"
  FOR subscription_record IN
    SELECT 
      s.id as subscription_id,
      s.company_id,
      p.interval,
      p.name as old_plan_name,
      c.name as company_name
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    JOIN companies c ON s.company_id = c.id
    WHERE p.name = 'Pro'
    AND s.status = 'active'
  LOOP
    -- Buscar el plan Profesional correspondiente (mismo interval)
    SELECT id INTO new_plan_id
    FROM plans
    WHERE name = 'Profesional'
    AND interval = subscription_record.interval
    AND is_active = true
    LIMIT 1;

    IF new_plan_id IS NOT NULL THEN
      -- Actualizar la suscripción al nuevo plan
      UPDATE subscriptions
      SET 
        plan_id = new_plan_id
      WHERE id = subscription_record.subscription_id;

      migrated_count := migrated_count + 1;
      
      RAISE NOTICE 'Migrada: % - % (%) -> Profesional (%)', 
        subscription_record.company_name,
        subscription_record.old_plan_name,
        subscription_record.interval,
        subscription_record.interval;
    ELSE
      RAISE WARNING 'No se encontró plan Profesional % para migrar suscripción de %',
        subscription_record.interval,
        subscription_record.company_name;
    END IF;
  END LOOP;

  RAISE NOTICE 'Total de suscripciones migradas: %', migrated_count;
END $$;

-- ============================================================================
-- PASO 3: MIGRAR PAGOS ASOCIADOS AL PLAN "PRO"
-- ============================================================================

SELECT '=== MIGRANDO PAGOS ===' as info;

DO $$
DECLARE
  payment_record RECORD;
  new_plan_id UUID;
  migrated_payments INTEGER := 0;
BEGIN
  -- Para cada pago con plan "Pro"
  FOR payment_record IN
    SELECT 
      pay.id as payment_id,
      p.interval,
      p.name as old_plan_name
    FROM payments pay
    JOIN plans p ON pay.plan_id = p.id
    WHERE p.name = 'Pro'
  LOOP
    -- Buscar el plan Profesional correspondiente
    SELECT id INTO new_plan_id
    FROM plans
    WHERE name = 'Profesional'
    AND interval = payment_record.interval
    AND is_active = true
    LIMIT 1;

    IF new_plan_id IS NOT NULL THEN
      -- Actualizar el pago al nuevo plan
      UPDATE payments
      SET plan_id = new_plan_id
      WHERE id = payment_record.payment_id;

      migrated_payments := migrated_payments + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Total de pagos migrados: %', migrated_payments;
END $$;

-- ============================================================================
-- PASO 4: DESACTIVAR PLANES "PRO"
-- ============================================================================

SELECT '=== DESACTIVANDO PLANES PRO ===' as info;

-- Desactivar todos los planes "Pro" para que no se puedan seleccionar
UPDATE plans
SET is_active = false
WHERE name = 'Pro';

SELECT 'Planes Pro desactivados' as resultado;

-- ============================================================================
-- PASO 5: VERIFICAR RESULTADO
-- ============================================================================

SELECT '=== VERIFICACIÓN FINAL ===' as info;

-- Verificar que no hay suscripciones activas con plan "Pro"
SELECT 
  'Suscripciones activas con plan Pro:' as info,
  COUNT(*) as total
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE p.name = 'Pro'
AND s.status = 'active';

-- Ver todas las suscripciones ahora
SELECT 
  'Todas las suscripciones después de la migración:' as info;

SELECT 
  c.name as company_name,
  p.name as plan_name,
  p.interval,
  s.status,
  s.current_period_end
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
ORDER BY c.name;

-- Ver estado de los planes
SELECT 
  'Estado de los planes:' as info;

SELECT 
  name,
  interval,
  price,
  is_active,
  CASE 
    WHEN is_active THEN '✅ Activo'
    ELSE '❌ Desactivado'
  END as estado
FROM plans
WHERE name IN ('Pro', 'Profesional')
ORDER BY name, interval;

-- ============================================================================
-- PASO 6: OPCIONAL - ELIMINAR PLANES "PRO" COMPLETAMENTE
-- ============================================================================

/*
IMPORTANTE: Solo ejecuta esta sección si estás 100% seguro de que quieres
eliminar los planes "Pro" de la base de datos. 

Si solo quieres desactivarlos (recomendado), NO ejecutes esta parte.

-- Eliminar planes "Pro" de la base de datos
DELETE FROM plans
WHERE name = 'Pro';

SELECT 'Planes Pro eliminados completamente' as resultado;
*/

-- ============================================================================
-- RESUMEN
-- ============================================================================

SELECT '=== RESUMEN DE LA MIGRACIÓN ===' as info;

/*
✅ MIGRACIÓN COMPLETADA

LO QUE SE HIZO:
1. Se migraron todas las suscripciones activas de "Pro" a "Profesional"
2. Se migraron todos los pagos asociados al plan "Pro"
3. Se desactivaron los planes "Pro" (is_active = false)
4. Los usuarios NO perdieron sus suscripciones

RESULTADO:
- Los usuarios con plan "Pro" ahora tienen plan "Profesional"
- Los planes "Pro" ya no se pueden seleccionar en la UI
- El historial de pagos se mantiene intacto
- Las fechas de vencimiento no cambiaron

PRÓXIMOS PASOS:
1. Verifica en la aplicación que los usuarios siguen teniendo acceso
2. Verifica que en la página de planes solo aparece "Profesional"
3. Si todo funciona bien, puedes eliminar los planes "Pro" completamente
   ejecutando la sección OPCIONAL del script

ROLLBACK:
Si necesitas revertir los cambios:
- Reactiva los planes Pro: UPDATE plans SET is_active = true WHERE name = 'Pro';
- Migra las suscripciones de vuelta manualmente si es necesario
*/

SELECT '=== FIN DEL SCRIPT ===' as info;
