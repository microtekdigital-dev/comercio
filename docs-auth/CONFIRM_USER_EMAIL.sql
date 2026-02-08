-- Script para confirmar manualmente el email de un usuario
-- Útil cuando el email de confirmación no llega o para testing

-- Reemplaza 'email@ejemplo.com' con el email del usuario
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email = 'EMAIL_DEL_USUARIO_AQUI'
AND email_confirmed_at IS NULL;

-- Verificar que se confirmó
SELECT 
  email,
  email_confirmed_at,
  confirmed_at
FROM auth.users
WHERE email = 'EMAIL_DEL_USUARIO_AQUI';
