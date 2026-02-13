-- Confirmar manualmente el email de freyanimuetarot@gmail.com
-- SOLO ejecutar después de verificar con CHECK_USER_FREYA.sql

-- IMPORTANTE: Este script confirma manualmente el email del usuario
-- Úsalo solo si el usuario no recibió el correo de verificación

-- Confirmar el email del usuario
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'freyanimuetarot@gmail.com'
  AND email_confirmed_at IS NULL;

-- Verificar que se aplicó el cambio
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  confirmation_sent_at
FROM auth.users
WHERE email = 'freyanimuetarot@gmail.com';
