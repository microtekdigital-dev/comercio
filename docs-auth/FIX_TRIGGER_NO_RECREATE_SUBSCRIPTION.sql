-- Script para modificar el trigger handle_new_user
-- Para que NO cree suscripciones en empresas que ya existen
-- Solo crea suscripciones para empresas NUEVAS

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_trial_plan_id UUID;
  v_invite_token TEXT;
  v_invitation RECORD;
  v_is_new_company BOOLEAN := FALSE;
BEGIN
  -- Obtener el token de invitación de los metadatos del usuario
  v_invite_token := NEW.raw_user_meta_data->>'invite_token';

  -- CASO 1: Usuario invitado (tiene token)
  IF v_invite_token IS NOT NULL THEN
    -- Buscar la invitación
    SELECT * INTO v_invitation
    FROM public.invitations
    WHERE token = v_invite_token
    AND status = 'pending'
    AND email = NEW.email
    AND expires_at > NOW();

    IF v_invitation.id IS NOT NULL THEN
      -- Invitación válida encontrada
      RAISE NOTICE 'Usuario invitado encontrado: %. Uniéndose a empresa: %', NEW.email, v_invitation.company_id;

      -- Crear perfil con el rol de la invitación
      INSERT INTO public.profiles (
        id,
        company_id,
        email,
        full_name,
        role
      ) VALUES (
        NEW.id,
        v_invitation.company_id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        v_invitation.role  -- Usar el rol de la invitación (employee o admin)
      );

      -- Marcar la invitación como aceptada
      UPDATE public.invitations
      SET status = 'accepted'
      WHERE id = v_invitation.id;

      RAISE NOTICE 'Usuario % agregado como % a la empresa %', NEW.email, v_invitation.role, v_invitation.company_id;
      
      -- NO crear suscripción para usuarios invitados
      -- La empresa ya tiene su propia suscripción
      RETURN NEW;
    ELSE
      -- Invitación no válida o expirada
      RAISE NOTICE 'Invitación no válida o expirada para: %. Creando nueva empresa.', NEW.email;
    END IF;
  END IF;

  -- CASO 2: Usuario nuevo sin invitación (crear nueva empresa)
  RAISE NOTICE 'Creando nueva empresa para: %', NEW.email;

  -- Crear empresa para el nuevo usuario
  INSERT INTO public.companies (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mi Empresa'),
    lower(replace(NEW.email, '@', '-')) || '-' || substr(md5(random()::text), 1, 8)
  )
  RETURNING id INTO v_company_id;
  
  -- Marcar que es una empresa nueva
  v_is_new_company := TRUE;

  -- Crear perfil del usuario como admin
  INSERT INTO public.profiles (
    id,
    company_id,
    email,
    full_name,
    role
  ) VALUES (
    NEW.id,
    v_company_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'admin'  -- Siempre admin para nuevas empresas
  );

  -- SOLO crear suscripción si es una empresa NUEVA
  IF v_is_new_company THEN
    -- Obtener el ID del plan Trial
    SELECT id INTO v_trial_plan_id
    FROM public.plans
    WHERE name = 'Trial'
    LIMIT 1;

    -- Crear suscripción Trial SOLO si el email NO ha sido usado antes
    IF v_trial_plan_id IS NOT NULL THEN
      -- Verificar si el email ya usó trial
      IF NOT EXISTS (
        SELECT 1 FROM public.trial_used_emails
        WHERE email = NEW.email
      ) THEN
        -- Email nuevo, crear trial
        INSERT INTO public.subscriptions (
          company_id,
          plan_id,
          status,
          current_period_start,
          current_period_end
        ) VALUES (
          v_company_id,
          v_trial_plan_id,
          'active',
          NOW(),
          NOW() + INTERVAL '14 days'
        );
        RAISE NOTICE 'Suscripción Trial creada para nueva empresa: %', NEW.email;
      ELSE
        -- Email ya usó trial, NO crear suscripción
        RAISE NOTICE 'Email % ya utilizó el trial. No se creó suscripción.', NEW.email;
      END IF;
    END IF;
  ELSE
    RAISE NOTICE 'Empresa existente, NO se crea suscripción para: %', NEW.email;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log el error pero NO bloquear la creación del usuario
    RAISE WARNING 'Error en handle_new_user para %: %', NEW.email, SQLERRM;
    -- Retornar NEW para que el usuario se cree de todas formas
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Trigger handle_new_user ACTUALIZADO';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Cambios realizados:';
  RAISE NOTICE '1. Solo crea suscripciones para empresas NUEVAS';
  RAISE NOTICE '2. NO crea suscripciones para usuarios invitados';
  RAISE NOTICE '3. NO recrea suscripciones en empresas existentes';
  RAISE NOTICE '';
  RAISE NOTICE 'Comportamiento:';
  RAISE NOTICE '- Usuario invitado → Se une a empresa SIN crear suscripción ✓';
  RAISE NOTICE '- Usuario nuevo → Crea empresa + trial (si no usó antes) ✓';
  RAISE NOTICE '- Empresa existente → NO se toca la suscripción ✓';
END $$;
