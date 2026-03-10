-- =====================================================
-- RENOVAR PLAN PRO MANUALMENTE
-- Extiende la fecha de vencimiento del plan Pro
-- =====================================================

-- PASO 1: Ver tu suscripción Pro actual
SELECT 
  'Tu Plan Pro Actual' as info,
  s.id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  p.name as plan_name,
  p.interval,
  c.name as company_name,
  EXTRACT(DAY FROM s.current_period_end - NOW())::INTEGER as dias_restantes
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
JOIN companies c ON s.company_id = c.id
WHERE p.name = 'Pro'
  AND s.status = 'active'
ORDER BY s.current_period_end ASC;

-- PASO 2: Renovar el plan (extender 1 mes desde la fecha actual de vencimiento)
-- IMPORTANTE: Reemplaza 'ID_DE_TU_SUSCRIPCION' con el ID que aparece en el paso 1

UPDATE subscriptions
SET 
  current_period_start = current_period_end,
  current_period_end = current_period_end + INTERVAL '1 month',
  status = 'active',
  updated_at = NOW()
WHERE id = 'ID_DE_TU_SUSCRIPCION'  -- ⚠️ REEMPLAZA ESTO
  AND status = 'active';

-- PASO 3: Verificar que se actualizó correctamente
SELECT 
  'Plan Renovado' as resultado,
  s.id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  p.name as plan_name,
  EXTRACT(DAY FROM s.current_period_end - NOW())::INTEGER as dias_restantes_nuevos
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.id = 'ID_DE_TU_SUSCRIPCION';  -- ⚠️ REEMPLAZA ESTO

-- PASO 4: Marcar las notificaciones de vencimiento como leídas
UPDATE notifications
SET is_read = true, read_at = NOW()
WHERE type = 'subscription_expiry'
  AND is_read = false;

-- PASO 5: Verificar que las notificaciones se marcaron como leídas
SELECT 
  'Notificaciones actualizadas' as resultado,
  COUNT(*) as total_marcadas_como_leidas
FROM notifications
WHERE type = 'subscription_expiry'
  AND is_read = true
  AND read_at > NOW() - INTERVAL '1 minute';

-- =====================================================
-- INSTRUCCIONES:
-- 1. Ejecuta el PASO 1 para ver el ID de tu suscripción
-- 2. Copia el ID que aparece en la columna "id"
-- 3. Reemplaza 'ID_DE_TU_SUSCRIPCION' en los PASOS 2, 3 con ese ID
-- 4. Ejecuta los PASOS 2, 3, 4, 5 en orden
-- =====================================================

-- ALTERNATIVA: Si quieres renovar por 1 año en lugar de 1 mes:
-- Cambia "+ INTERVAL '1 month'" por "+ INTERVAL '1 year'"
