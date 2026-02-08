-- ============================================================================
-- DIAGNÓSTICO: Trial bloqueado inmediatamente después de registro
-- ============================================================================
-- Este script ayuda a diagnosticar por qué un trial recién creado aparece bloqueado
-- Ejecutar en Supabase SQL Editor

-- 1. Ver TODAS las suscripciones de la empresa (incluyendo canceladas)
SELECT 
  id,
  status,
  created_at,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  CASE 
    WHEN current_period_end < NOW() THEN '❌ VENCIDA'
    WHEN status = 'cancelled' THEN '❌ CANCELADA'
    WHEN status = 'active' THEN '✅ ACTIVA'
    ELSE '⚠️ ' || status
  END as estado_visual,
  -- Calcular días restantes
  EXTRACT(DAY FROM (current_period_end - NOW())) as dias_restantes
FROM subscriptions
WHERE company_id = (SELECT id FROM companies WHERE name = 'Celulares Roma')
ORDER BY created_at DESC;

-- 2. Ver el plan asociado a cada suscripción
SELECT 
  s.id as subscription_id,
  s.status,
  s.current_period_end,
  p.name as plan_name,
  p.price,
  CASE 
    WHEN p.price = 0 THEN '🆓 TRIAL'
    ELSE '💰 PAGO'
  END as tipo_plan
FROM subscriptions s
LEFT JOIN plans p ON s.plan_id = p.id
WHERE s.company_id = (SELECT id FROM companies WHERE name = 'Celulares Roma')
ORDER BY s.created_at DESC;

-- 3. Verificar si hay múltiples suscripciones activas (esto causaría problemas)
SELECT 
  COUNT(*) as total_activas,
  CASE 
    WHEN COUNT(*) > 1 THEN '⚠️ PROBLEMA: Múltiples suscripciones activas'
    WHEN COUNT(*) = 1 THEN '✅ OK: Una suscripción activa'
    ELSE '❌ PROBLEMA: No hay suscripciones activas'
  END as diagnostico
FROM subscriptions
WHERE company_id = (SELECT id FROM companies WHERE name = 'Celulares Roma')
  AND status IN ('active', 'pending')
  AND current_period_end > NOW();

-- 4. Ver el perfil del usuario y su rol
SELECT 
  p.id as user_id,
  p.email,
  p.role,
  p.company_id,
  c.name as company_name
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
WHERE c.name = 'Celulares Roma';

-- 5. Verificar la membresía en company_users
SELECT 
  cu.user_id,
  cu.company_id,
  cu.role,
  cu.created_at,
  p.email
FROM company_users cu
LEFT JOIN profiles p ON cu.user_id = p.id
WHERE cu.company_id = (SELECT id FROM companies WHERE name = 'Celulares Roma');

-- ============================================================================
-- INTERPRETACIÓN DE RESULTADOS:
-- ============================================================================
-- 
-- Si Query 1 muestra:
--   - status = 'active' Y current_period_end > NOW() → La suscripción DEBERÍA funcionar
--   - status = 'cancelled' → Normal que esté bloqueado
--   - current_period_end < NOW() → Suscripción vencida, normal que esté bloqueado
--
-- Si Query 3 muestra:
--   - total_activas > 1 → PROBLEMA: Hay múltiples suscripciones activas
--   - total_activas = 0 → PROBLEMA: No hay suscripciones activas
--
-- POSIBLES CAUSAS DEL BLOQUEO:
-- 1. Cache del navegador (solución: Ctrl + Shift + R o modo incógnito)
-- 2. Deploy de Vercel no completado (verificar en dashboard de Vercel)
-- 3. Múltiples suscripciones interfiriendo (Query 3 lo detecta)
-- 4. Error en la lógica de getCompanySubscription (revisar logs de Vercel)
-- 5. Zona horaria incorrecta en current_period_end
--
-- ============================================================================
