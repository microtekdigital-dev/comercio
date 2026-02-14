-- Verificar exactamente qué plan tienen los usuarios que no pueden crear órdenes

SELECT 
  p.email,
  p.company_id,
  c.name as company_name,
  s.status as subscription_status,
  pl.name as plan_name,
  pl.id as plan_id,
  CASE 
    WHEN LOWER(pl.name) LIKE '%pro%' OR 
         LOWER(pl.name) LIKE '%profesional%' OR 
         LOWER(pl.name) LIKE '%empresarial%' THEN '✅ DEBERÍA TENER ACCESO'
    ELSE '❌ NO TIENE ACCESO - Plan: ' || COALESCE(pl.name, 'NULL')
  END as access_status
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
LEFT JOIN subscriptions s ON s.company_id = p.company_id AND s.status = 'active'
LEFT JOIN plans pl ON pl.id = s.plan_id
WHERE p.email IN ('vanitoadette1985@gmail.com', 'vanithegameplay@gmail.com', 'microtekdigital@gmail.com')
ORDER BY p.email;
