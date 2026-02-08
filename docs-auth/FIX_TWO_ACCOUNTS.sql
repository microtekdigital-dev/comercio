-- ============================================================================
-- SOLUCIÓN: Reparar cuentas vanitoadette y vanithegameplay
-- ============================================================================
-- ⚠️ IMPORTANTE: Ejecutar SOLO después de revisar resultados de DEBUG_TWO_ACCOUNTS.sql
-- ⚠️ NO ejecutar todo el script de una vez - ejecutar solo las secciones necesarias

-- ============================================================================
-- SOLUCIÓN 1: Agregar membresía en company_users (si falta)
-- ============================================================================
-- Ejecutar SOLO si Query 5 de DEBUG_TWO_ACCOUNTS.sql muestra "FALTA MEMBRESÍA"

-- Para vanitoadette
INSERT INTO company_users (company_id, user_id, role)
SELECT 
  p.company_id,
  p.id,
  p.role
FROM profiles p
WHERE p.email = 'vanitoadette@gmail.com'
  AND p.company_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM company_users cu 
    WHERE cu.user_id = p.id AND cu.company_id = p.company_id
  );

-- Para vanithegameplay
INSERT INTO company_users (company_id, user_id, role)
SELECT 
  p.company_id,
  p.id,
  p.role
FROM profiles p
WHERE p.email = 'vanithegameplay@gmail.com'
  AND p.company_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM company_users cu 
    WHERE cu.user_id = p.id AND cu.company_id = p.company_id
  );

-- ============================================================================
-- SOLUCIÓN 2: Crear trial si no existe suscripción
-- ============================================================================
-- Ejecutar SOLO si Query 3 muestra "SIN SUSCRIPCIÓN ACTIVA"
-- Y no hay ninguna suscripción en el historial

-- Para vanitoadette
INSERT INTO subscriptions (company_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end)
SELECT 
  p.company_id,
  (SELECT id FROM plans WHERE price = 0 AND is_active = true ORDER BY sort_order LIMIT 1) as plan_id,
  'active' as status,
  NOW() as current_period_start,
  NOW() + INTERVAL '28 days' as current_period_end,
  false as cancel_at_period_end
FROM profiles p
WHERE p.email = 'vanitoadette@gmail.com'
  AND p.company_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.company_id = p.company_id
  );

-- Para vanithegameplay
INSERT INTO subscriptions (company_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end)
SELECT 
  p.company_id,
  (SELECT id FROM plans WHERE price = 0 AND is_active = true ORDER BY sort_order LIMIT 1) as plan_id,
  'active' as status,
  NOW() as current_period_start,
  NOW() + INTERVAL '28 days' as current_period_end,
  false as cancel_at_period_end
FROM profiles p
WHERE p.email = 'vanithegameplay@gmail.com'
  AND p.company_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.company_id = p.company_id
  );

-- ============================================================================
-- SOLUCIÓN 3: Reactivar trial cancelado (SOLO si fue cancelado por error)
-- ============================================================================
-- ⚠️ CUIDADO: Esto permite reactivar un trial cancelado
-- Ejecutar SOLO si el usuario canceló por error y quiere volver a activar

-- Para vanitoadette
UPDATE subscriptions
SET 
  status = 'active',
  current_period_end = NOW() + INTERVAL '28 days',
  cancel_at_period_end = false
WHERE id = (
  SELECT s.id 
  FROM subscriptions s
  JOIN profiles p ON s.company_id = p.company_id
  WHERE p.email = 'vanitoadette@gmail.com'
    AND s.status = 'cancelled'
  ORDER BY s.created_at DESC
  LIMIT 1
);

-- Para vanithegameplay
UPDATE subscriptions
SET 
  status = 'active',
  current_period_end = NOW() + INTERVAL '28 days',
  cancel_at_period_end = false
WHERE id = (
  SELECT s.id 
  FROM subscriptions s
  JOIN profiles p ON s.company_id = p.company_id
  WHERE p.email = 'vanithegameplay@gmail.com'
    AND s.status = 'cancelled'
  ORDER BY s.created_at DESC
  LIMIT 1
);

-- ============================================================================
-- SOLUCIÓN 4: Cancelar suscripciones duplicadas (si hay múltiples activas)
-- ============================================================================
-- Ejecutar SOLO si Query 3 muestra "MÚLTIPLES SUSCRIPCIONES ACTIVAS"
-- Esto cancela todas las suscripciones excepto la más reciente

-- Para vanitoadette
UPDATE subscriptions
SET status = 'cancelled'
WHERE company_id = (SELECT company_id FROM profiles WHERE email = 'vanitoadette@gmail.com')
  AND status IN ('active', 'pending')
  AND id NOT IN (
    SELECT id FROM subscriptions
    WHERE company_id = (SELECT company_id FROM profiles WHERE email = 'vanitoadette@gmail.com')
      AND status IN ('active', 'pending')
    ORDER BY created_at DESC
    LIMIT 1
  );

-- Para vanithegameplay
UPDATE subscriptions
SET status = 'cancelled'
WHERE company_id = (SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com')
  AND status IN ('active', 'pending')
  AND id NOT IN (
    SELECT id FROM subscriptions
    WHERE company_id = (SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com')
      AND status IN ('active', 'pending')
    ORDER BY created_at DESC
    LIMIT 1
  );

-- ============================================================================
-- SOLUCIÓN 5: Extender período de trial (si está por vencer)
-- ============================================================================
-- Ejecutar SOLO si quieres darles más tiempo de trial

-- Para vanitoadette - agregar 28 días más
UPDATE subscriptions
SET current_period_end = current_period_end + INTERVAL '28 days'
WHERE id = (
  SELECT s.id 
  FROM subscriptions s
  JOIN profiles p ON s.company_id = p.company_id
  WHERE p.email = 'vanitoadette@gmail.com'
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1
);

-- Para vanithegameplay - agregar 28 días más
UPDATE subscriptions
SET current_period_end = current_period_end + INTERVAL '28 days'
WHERE id = (
  SELECT s.id 
  FROM subscriptions s
  JOIN profiles p ON s.company_id = p.company_id
  WHERE p.email = 'vanithegameplay@gmail.com'
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1
);

-- ============================================================================
-- VERIFICACIÓN FINAL: Ejecutar después de aplicar soluciones
-- ============================================================================

SELECT 
  p.email,
  c.name as company_name,
  s.status,
  s.current_period_end,
  pl.name as plan_name,
  CASE 
    WHEN s.status = 'active' AND s.current_period_end > NOW() THEN '✅ FUNCIONANDO'
    ELSE '❌ AÚN HAY PROBLEMA'
  END as resultado
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN LATERAL (
  SELECT * FROM subscriptions 
  WHERE company_id = c.id 
  ORDER BY created_at DESC 
  LIMIT 1
) s ON true
LEFT JOIN plans pl ON s.plan_id = pl.id
WHERE p.email IN ('vanitoadette@gmail.com', 'vanithegameplay@gmail.com')
ORDER BY p.email;

-- ============================================================================
-- INSTRUCCIONES DE USO:
-- ============================================================================
-- 
-- 1. Primero ejecutar DEBUG_TWO_ACCOUNTS.sql para ver qué está mal
-- 2. Según los resultados, ejecutar SOLO la solución correspondiente:
--    - Si falta membresía → Ejecutar SOLUCIÓN 1
--    - Si no hay suscripción → Ejecutar SOLUCIÓN 2
--    - Si trial cancelado por error → Ejecutar SOLUCIÓN 3
--    - Si múltiples suscripciones → Ejecutar SOLUCIÓN 4
--    - Si quieres extender trial → Ejecutar SOLUCIÓN 5
-- 3. Ejecutar VERIFICACIÓN FINAL para confirmar que funcionó
-- 4. Pedir a los usuarios que hagan hard refresh (Ctrl + Shift + R)
--
-- ============================================================================
