-- Renovar plan de vanitoadette1985@gmail.com
-- Paso 1: Ver estado actual
SELECT 
  au.email,
  s.id as subscription_id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  pl.name as plan_name,
  pl.id as plan_id,
  c.id as company_id,
  c.name as company_name
FROM auth.users au
JOIN profiles pr ON pr.id = au.id
JOIN companies c ON c.id = pr.company_id
JOIN subscriptions s ON s.company_id = c.id
JOIN plans pl ON pl.id = s.plan_id
WHERE au.email = 'vanitoadette1985@gmail.com'
ORDER BY s.created_at DESC;

-- ============================================================
-- Paso 2: Renovar por 1 año (ejecutar DESPUÉS de ver el paso 1)
-- Reemplaza <SUBSCRIPTION_ID> con el id del paso 1
-- ============================================================

/*
UPDATE subscriptions
SET 
  status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 year',
  updated_at = NOW()
WHERE id = '<SUBSCRIPTION_ID>';
*/

-- ============================================================
-- Paso 2 alternativo: Renovar por 1 mes
-- ============================================================

/*
UPDATE subscriptions
SET 
  status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 month',
  updated_at = NOW()
WHERE id = '<SUBSCRIPTION_ID>';
*/

-- Paso 3: Verificar que quedó bien
/*
SELECT id, status, current_period_start, current_period_end
FROM subscriptions
WHERE id = '<SUBSCRIPTION_ID>';
*/
