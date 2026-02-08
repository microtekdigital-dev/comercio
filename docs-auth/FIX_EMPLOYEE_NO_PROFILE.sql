-- Script para arreglar empleado que se registró pero no tiene perfil
-- Esto pasa cuando el trigger handle_new_user falla

DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT := 'asesorvaniyt@gmail.com'; -- REEMPLAZA CON EL EMAIL
  v_invitation RECORD;
BEGIN
  -- Obtener el ID del usuario
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado: %', v_user_email;
  END IF;

  RAISE NOTICE 'Usuario encontrado: % (ID: %)', v_user_email, v_user_id;

  -- Verificar si ya tiene perfil
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    RAISE NOTICE 'El usuario ya tiene perfil.';
    RETURN;
  END IF;

  -- Buscar la invitación
  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE email = v_user_email
  AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_invitation.id IS NULL THEN
    RAISE EXCEPTION 'No se encontró invitación pendiente para: %', v_user_email;
  END IF;

  RAISE NOTICE 'Invitación encontrada para empresa: %', v_invitation.company_id;

  -- Crear perfil con el rol de la invitación
  INSERT INTO public.profiles (
    id,
    company_id,
    email,
    full_name,
    role
  ) VALUES (
    v_user_id,
    v_invitation.company_id,
    v_user_email,
    split_part(v_user_email, '@', 1),
    v_invitation.role  -- employee o admin según la invitación
  );

  RAISE NOTICE 'Perfil creado como: %', v_invitation.role;

  -- Marcar la invitación como aceptada
  UPDATE public.invitations
  SET status = 'accepted'
  WHERE id = v_invitation.id;

  RAISE NOTICE 'Invitación marcada como aceptada';

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Empleado reparado exitosamente!';
  RAISE NOTICE 'Email: %', v_user_email;
  RAISE NOTICE 'Rol: %', v_invitation.role;
  RAISE NOTICE 'Empresa: %', v_invitation.company_id;
  RAISE NOTICE 'Ahora puede hacer login correctamente';
  RAISE NOTICE '==============================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error reparando empleado: %', SQLERRM;
END $$;

-- Verificar que se creó correctamente
SELECT 
  u.email,
  p.id as profile_id,
  p.company_id,
  p.role,
  c.name as company_name,
  s.status as subscription_status,
  i.status as invitation_status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.companies c ON c.id = p.company_id
LEFT JOIN public.subscriptions s ON s.company_id = c.id AND s.status = 'active'
LEFT JOIN public.invitations i ON i.email = u.email
WHERE u.email = 'asesorvaniyt@gmail.com' -- REEMPLAZA CON EL EMAIL
ORDER BY i.created_at DESC
LIMIT 1;
