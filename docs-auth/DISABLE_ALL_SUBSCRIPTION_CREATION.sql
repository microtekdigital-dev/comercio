-- DESHABILITAR COMPLETAMENTE LA CREACIÓN DE SUSCRIPCIONES
-- Este es un enfoque nuclear para detener el problema

-- Modificar handle_new_user para que NUNCA cree suscripciones
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_invite_token TEXT;
  v_invitation RECORD;
BEGIN
  -- Obtener el token de invitación
  v_invite_token := NEW.raw_user_meta_data->>'invite_token';

  -- CASO 1: Usuario invitado
  IF v_invite_token IS NOT NULL THEN
    SELECT * INTO v_invitation
    FROM public.invitations
    WHERE token = v_invite_token
    AND status = 'pending'
    AND email = NEW.email
    AND expires_at > NOW();

    IF v_invitation.id IS NOT NULL THEN
      -- Crear perfil
      INSERT INTO public.profiles (id, company_id, email, full_name, role)
      VALUES (
        NEW.id,
        v_invitation.company_id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        v_invitation.role
      );

      -- Marcar invitación como aceptada
      UPDATE public.invitations
      SET status = 'accepted'
      WHERE id = v_invitation.id;

      RETURN NEW;
    END IF;
  END IF;

  -- CASO 2: Usuario nuevo - crear empresa pero NO suscripción
  INSERT INTO public.companies (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mi Empresa'),
    lower(replace(NEW.email, '@', '-')) || '-' || substr(md5(random()::text), 1, 8)
  )
  RETURNING id INTO v_company_id;

  -- Crear perfil
  INSERT INTO public.profiles (id, company_id, email, full_name, role)
  VALUES (
    NEW.id,
    v_company_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'admin'
  );

  -- ============================================================================
  -- CRÍTICO: NO CREAR SUSCRIPCIÓN
  -- Las suscripciones deben crearse manualmente desde el dashboard
  -- ============================================================================
  RAISE NOTICE 'Usuario creado SIN suscripción: %', NEW.email;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error en handle_new_user para %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'CREACIÓN DE SUSCRIPCIONES DESHABILITADA';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'El trigger handle_new_user ya NO crea suscripciones';
  RAISE NOTICE 'Los usuarios nuevos NO tendrán trial automático';
  RAISE NOTICE 'Las suscripciones deben crearse manualmente';
  RAISE NOTICE '';
  RAISE NOTICE 'Ahora:';
  RAISE NOTICE '1. Elimina todas las suscripciones activas';
  RAISE NOTICE '2. Refresca billing';
  RAISE NOTICE '3. NO debería crearse ninguna suscripción';
END $$;
