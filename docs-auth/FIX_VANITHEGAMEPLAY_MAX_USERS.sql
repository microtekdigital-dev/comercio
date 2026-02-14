-- Corregir el límite de usuarios del plan Profesional de vanithegameplay
-- El plan Profesional debe tener 10 usuarios, no 5

-- Verificar el límite actual
SELECT 
  id,
  name,
  interval,
  max_users,
  max_products,
  price
FROM plans
WHERE name = 'Profesional'
ORDER BY interval;

-- Actualizar el límite de usuarios a 10 para todos los planes Profesional
UPDATE plans
SET max_users = 10
WHERE name = 'Profesional'
  AND max_users != 10;

-- Verificar que se aplicó el cambio
SELECT 
  'Después del fix' as estado,
  id,
  name,
  interval,
  max_users,
  max_products,
  price
FROM plans
WHERE name = 'Profesional'
ORDER BY interval;

-- Verificación final para vanithegameplay
SELECT 
  'Verificación final para Bazar Lili' as paso,
  c.name as empresa,
  p.name as plan,
  p.interval,
  p.max_users as limite_usuarios,
  p.max_products as limite_productos,
  s.status as estado_suscripcion
FROM companies c
JOIN subscriptions s ON c.id = s.company_id AND s.status = 'active'
JOIN plans p ON s.plan_id = p.id
WHERE c.id IN (
  SELECT company_id FROM profiles WHERE email = 'vanithegameplay@gmail.com'
);
