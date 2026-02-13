-- Script para arreglar el company_id NULL de freyanimuetarot@gmail.com
-- Este usuario fue creado por invitación pero no tiene company_id asignado

-- PASO 1: Verificar el estado actual
SELECT 
  'Estado Actual' as paso,
  u.email,
  p.id as user_id,
  p.company_id,
  p.role,
  p.full_name
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE u.email = 'freyanimuetarot@gmail.com';

-- PASO 2: Buscar la invitación que usó este usuario
SELECT 
  'Invitación Usada' as paso,
  i.id as invitation_id,
  i.company_id,
  i.email,
  i.role,
  i.status,
  i.invited_by,
  c.name as company_name
FROM invitations i
LEFT JOIN companies c ON c.id = i.company_id
WHERE i.email = 'freyanimuetarot@gmail.com'
ORDER BY i.created_at DESC
LIMIT 1;

-- PASO 3: Actualizar el company_id del perfil con el de la invitación
-- IMPORTANTE: Solo ejecutar si el PASO 2 muestra una invitación válida
UPDATE profiles
SET company_id = (
  SELECT company_id 
  FROM invitations 
  WHERE email = 'freyanimuetarot@gmail.com' 
  AND status = 'accepted'
  ORDER BY created_at DESC 
  LIMIT 1
)
WHERE id = (SELECT id FROM auth.users WHERE email = 'freyanimuetarot@gmail.com')
AND company_id IS NULL;

-- PASO 4: Verificar que se actualizó correctamente
SELECT 
  'Verificación Final' as paso,
  u.email,
  p.id as user_id,
  p.company_id,
  p.role,
  c.name as company_name
FROM auth.users u
JOIN profiles p ON p.id = u.id
LEFT JOIN companies c ON c.id = p.company_id
WHERE u.email = 'freyanimuetarot@gmail.com';

-- PASO 5: Verificar que ahora puede acceder a los datos de la empresa
SELECT 
  'Acceso a Datos' as paso,
  (SELECT COUNT(*) FROM products WHERE company_id = p.company_id) as productos,
  (SELECT COUNT(*) FROM customers WHERE company_id = p.company_id) as clientes,
  (SELECT COUNT(*) FROM sales WHERE company_id = p.company_id) as ventas
FROM profiles p
WHERE p.id = (SELECT id FROM auth.users WHERE email = 'freyanimuetarot@gmail.com');
