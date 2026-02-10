-- =====================================================
-- FIX: Problema de schema search_path
-- La tabla existe pero el trigger no la encuentra
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_company_id UUID;
  v_invite_token TEXT;
  v_invitation RECORD;
  v_user_role TEXT;
BEGIN
  -- Extract metadata
  v_invite_token := NEW.raw_user_meta_data->>'invite_token';

  -- Check invitation
  IF v_invite_token IS NOT NULL THEN
    SELECT * INTO v_invitation
    FROM public.invitations
    WHERE token = v_invite_token
      AND status = 'pending'
      AND expires_at > NOW()
    LIMIT 1;

    IF FOUND THEN
      -- Usuario aceptando invitación válida
      v_company_id := v_invitation.company_id;
      v_user_role := v_invitation.role;

      -- Crear perfil para usuario invitado
      INSERT INTO public.profiles (id, company_id, email, full_name, role)
      VALUES (
        NEW.id,
        v_company_id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        v_user_role
      );

      -- Marcar invitación como aceptada
      UPDATE public.invitations
      SET status = 'accepted', accepted_at = NOW()
      WHERE id = v_invitation.id;

      -- Insertar en company_users si existe
      BEGIN
        INSERT INTO public.company_users (company_id, user_id, role)
        VALUES (v_company_id, NEW.id, v_user_role)
        ON CONFLICT (company_id, user_id) DO NOTHING;
      EXCEPTION
        WHEN undefined_table THEN NULL;
      END;

      RETURN NEW;
    END IF;
  END IF;

  -- Si no hay invitación válida, crear nueva compañía
  v_user_role := 'admin';

  -- Crear compañía
  INSERT INTO public.companies (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'),
    COALESCE(NEW.raw_user_meta_data->>'company_slug', 'company-' || NEW.id::text)
  )
  RETURNING id INTO v_company_id;

  -- Crear perfil como admin
  INSERT INTO public.profiles (id, company_id, email, full_name, role, has_used_trial)
  VALUES (
    NEW.id,
    v_company_id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'admin',
    true
  );

  -- Crear suscripción Trial (con schema explícito)
  INSERT INTO public.subscriptions (company_id, plan_id, status, current_period_start, current_period_end)
  SELECT 
    v_company_id,
    p.id,
    'active',
    NOW(),
    NOW() + INTERVAL '14 days'
  FROM public.plans p
  WHERE p.name = 'Trial' AND p.interval = 'month' AND p.is_active = true
  LIMIT 1;

  -- Insertar en company_users si existe
  BEGIN
    INSERT INTO public.company_users (company_id, user_id, role)
    VALUES (v_company_id, NEW.id, v_user_role)
    ON CONFLICT (company_id, user_id) DO NOTHING;
  EXCEPTION
    WHEN undefined_table THEN NULL;
  END;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.email, SQLERRM;
    RAISE EXCEPTION 'Database error saving new user: %', SQLERRM;
END;
$$;

-- Recrear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Configurar permisos explícitos
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- Permisos específicos para authenticated
GRANT SELECT, INSERT, UPDATE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.invitations TO authenticated;
GRANT SELECT ON public.plans TO authenticated;
GRANT SELECT, INSERT ON public.subscriptions TO authenticated;

-- Verificar que la función puede ver la tabla
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.subscriptions;
  RAISE NOTICE 'La función puede ver % registros en subscriptions', v_count;
END $$;

SELECT 'Fix de schema_path aplicado' as resultado;
