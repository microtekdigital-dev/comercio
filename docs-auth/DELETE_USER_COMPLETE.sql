-- Script para eliminar completamente un usuario de Supabase
-- Esto permite que el email pueda registrarse nuevamente

-- REEMPLAZA 'email@ejemplo.com' con el email del usuario que quieres eliminar
DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT := 'EMAIL_DEL_USUARIO_AQUI'; -- REEMPLAZA ESTO
  v_company_id UUID;
BEGIN
  -- Obtener el ID del usuario
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_user_email;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Usuario no encontrado: %', v_user_email;
    RETURN;
  END IF;

  RAISE NOTICE 'Eliminando usuario: % (ID: %)', v_user_email, v_user_id;

  -- Obtener company_id si existe
  SELECT company_id INTO v_company_id
  FROM public.profiles
  WHERE id = v_user_id;

  -- 1. Eliminar de trial_used_emails (para que pueda usar trial nuevamente)
  DELETE FROM public.trial_used_emails
  WHERE email = v_user_email;
  RAISE NOTICE '✓ Eliminado de trial_used_emails';

  -- 2. Eliminar invitaciones relacionadas
  DELETE FROM public.invitations
  WHERE email = v_user_email;
  RAISE NOTICE '✓ Eliminadas invitaciones';

  -- 3. Eliminar de company_users
  DELETE FROM public.company_users
  WHERE user_id = v_user_id;
  RAISE NOTICE '✓ Eliminado de company_users';

  -- 4. Eliminar perfil
  DELETE FROM public.profiles
  WHERE id = v_user_id;
  RAISE NOTICE '✓ Eliminado perfil';

  -- 5. Si la empresa solo tenía este usuario, eliminar la empresa
  -- (esto eliminará en cascada: suscripciones, productos, ventas, etc.)
  IF v_company_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE company_id = v_company_id
    ) THEN
      DELETE FROM public.companies
      WHERE id = v_company_id;
      RAISE NOTICE '✓ Eliminada empresa (no tenía más usuarios)';
    ELSE
      RAISE NOTICE '⚠ Empresa NO eliminada (tiene otros usuarios)';
    END IF;
  END IF;

  -- 6. Eliminar usuario de auth.users (Supabase Auth)
  DELETE FROM auth.users
  WHERE id = v_user_id;
  RAISE NOTICE '✓ Eliminado de auth.users';

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Usuario % eliminado completamente', v_user_email;
  RAISE NOTICE 'Ahora puede registrarse nuevamente con este email';
  RAISE NOTICE '==============================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error eliminando usuario: %', SQLERRM;
END $$;

-- Verificar que se eliminó
SELECT 
  'auth.users' as tabla,
  COUNT(*) as registros
FROM auth.users
WHERE email = 'EMAIL_DEL_USUARIO_AQUI' -- REEMPLAZA ESTO

UNION ALL

SELECT 
  'profiles' as tabla,
  COUNT(*) as registros
FROM public.profiles
WHERE email = 'EMAIL_DEL_USUARIO_AQUI' -- REEMPLAZA ESTO

UNION ALL

SELECT 
  'trial_used_emails' as tabla,
  COUNT(*) as registros
FROM public.trial_used_emails
WHERE email = 'EMAIL_DEL_USUARIO_AQUI'; -- REEMPLAZA ESTO
