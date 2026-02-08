-- ============================================================================
-- SOLUCIÓN: Crear trial para vanithegameplay@gmail.com (Bazar Lili)
-- ============================================================================
-- El usuario no tiene ninguna suscripción, necesita un trial

-- 1. Verificar que el usuario existe y tiene empresa
SELECT 
  p.id as user_id,
  p.email,
  p.company_id,
  c.name as company_name,
  p.role
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.email = 'vanithegameplay@gmail.com';

-- 2. Verificar que NO tiene suscripciones
SELECT COUNT(*) as total_subscriptions
FROM subscriptions s
JOIN profiles p ON s.company_id = p.company_id
WHERE p.email = 'vanithegameplay@gmail.com';

-- 3. Crear trial de 28 días para Bazar Lili
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
  AND p.company_id IS NOT NULL;

-- 4. Asegurar membresía en company_users
INSERT INTO company_users (company_id, user_id, role)
SELECT 
  p.company_id,
  p.id,
  COALESCE(p.role, 'owner') as role
FROM profiles p
WHERE p.email = 'vanithegameplay@gmail.com'
  AND p.company_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM company_users cu 
    WHERE cu.user_id = p.id AND cu.company_id = p.company_id
  );

-- 5. VERIFICACIÓN FINAL
SELECT 
  p.email,
  c.name as company_name,
  s.id as subscription_id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  pl.name as plan_name,
  pl.price,
  EXTRACT(DAY FROM (s.current_period_end - NOW())) as dias_restantes,
  CASE 
    WHEN s.status = 'active' AND s.current_period_end > NOW() THEN '✅ TRIAL CREADO - FUNCIONANDO'
    ELSE '❌ AÚN HAY PROBLEMA'
  END as resultado
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN subscriptions s ON s.company_id = c.id
LEFT JOIN plans pl ON s.plan_id = pl.id
WHERE p.email = 'vanithegameplay@gmail.com'
ORDER BY s.created_at DESC
LIMIT 1;

-- ============================================================================
-- INSTRUCCIONES:
-- ============================================================================
-- 1. Ejecutar Query 1 para verificar que el usuario existe
-- 2. Ejecutar Query 2 para confirmar que NO tiene suscripciones (debe dar 0)
-- 3. Ejecutar Query 3 para crear el trial de 28 días
-- 4. Ejecutar Query 4 para asegurar membresía en company_users
-- 5. Ejecutar Query 5 para verificar que todo funcionó
-- 6. Pedir al usuario que haga hard refresh: Ctrl + Shift + R
-- 7. Si persiste, pedir que cierre sesión y vuelva a entrar
-- ============================================================================
