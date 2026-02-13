-- Script para eliminar completamente la cuenta de freyanimuetarot@gmail.com
-- Esto permitirá que se vuelva a registrar desde cero
-- ADVERTENCIA: Esto eliminará TODOS los datos asociados a esta cuenta

-- PASO 1: Verificar qué se va a eliminar
SELECT 
  'Datos a Eliminar' as paso,
  u.email,
  p.id as user_id,
  p.company_id,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'freyanimuetarot@gmail.com';

-- PASO 2: Eliminar invitaciones relacionadas
DELETE FROM invitations
WHERE email = 'freyanimuetarot@gmail.com';

-- PASO 3: Eliminar el perfil del usuario
DELETE FROM profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'freyanimuetarot@gmail.com');

-- PASO 4: Eliminar el usuario de auth.users
-- IMPORTANTE: Esto debe hacerse desde el panel de Supabase Authentication
-- O usando la función admin de Supabase
-- No se puede hacer directamente con SQL por seguridad

-- Para eliminar desde el panel:
-- 1. Ve a Authentication > Users en Supabase Dashboard
-- 2. Busca freyanimuetarot@gmail.com
-- 3. Click en los tres puntos > Delete user

-- PASO 5: Verificar que se eliminó todo
SELECT 
  'Verificación' as paso,
  COUNT(*) as usuarios_encontrados
FROM auth.users
WHERE email = 'freyanimuetarot@gmail.com';

SELECT 
  'Verificación Profiles' as paso,
  COUNT(*) as perfiles_encontrados
FROM profiles
WHERE email = 'freyanimuetarot@gmail.com';

SELECT 
  'Verificación Invitations' as paso,
  COUNT(*) as invitaciones_encontradas
FROM invitations
WHERE email = 'freyanimuetarot@gmail.com';

-- NOTA: Después de ejecutar este script, el usuario podrá registrarse nuevamente
-- y el sistema creará automáticamente una nueva empresa y perfil correctamente
