-- Verificar los nombres exactos de los planes de los usuarios afectados
-- Esto nos dirá si el problema es que el nombre del plan no coincide con los permitidos

SELECT 
  p.email,
  p.company_id,
  s.status as subscription_status,
  pl.name as plan_name,
  pl.id as plan_id,
  pl.features,
  CASE 
    WHEN pl.name IN ('Pro', 'Profesional', 'Empresarial') THEN '✅ PERMITIDO'
    ELSE '❌ BLOQUEADO - Plan: ' || COALESCE(pl.name, 'NULL')
  END as access_status
FROM profiles p
LEFT JOIN subscriptions s ON s.company_id = p.company_id AND s.status = 'active'
LEFT JOIN plans pl ON pl.id = s.plan_id
WHERE p.email IN ('vanitoadette1985@gmail.com', 'vanithegameplay@gmail.com', 'microtekdigital@gmail.com')
ORDER BY p.email;

-- También verificar todos los planes disponibles en el sistema
SELECT 
  '--- PLANES DISPONIBLES EN EL SISTEMA ---' as info;

SELECT 
  id,
  name,
  max_users,
  max_products,
  features
FROM plans
ORDER BY name;
