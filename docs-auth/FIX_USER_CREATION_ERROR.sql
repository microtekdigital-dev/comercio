-- =====================================================
-- FIX: Error al crear nuevo usuario
-- "Database error saving new user"
-- =====================================================

-- Este script corrige los problemas más comunes que causan
-- el error al crear nuevos usuarios

SELECT '=== PASO 1: VERIFICAR Y CREAR PLAN TRIAL ===' as info;

-- Verificar si existe el plan Trial
DO $
DECLARE
  v_trial_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_trial_count
  FROM plans
  WHERE name = 'Trial' AND interval = 'month' AND is_active = true;
  
  IF v_trial_count = 0 THEN
    RAISE NOTICE 'Plan Trial no encontrado. Creando...';
    
    -- Crear plan Trial si no existe
    INSERT INTO plans (name, description, price, interval, is_active, features)
    VALUES (
      'Trial',
      'Período de prueba gratuito de 14 días',
      0,
      'month',
      true,
      jsonb_build_object(
        'max_products', 50,
        'max_customers', 50,
        'max_sales', 50,
        'max_users', 1,
        'can_export', false,
        'can_access_reports', false,
        'can_access_purchase_orders', false,
        'can_access_suppliers', false
      )
    )
    ON CONFLICT (name, interval) DO UPDATE
    SET is_active = true;
    
    RAISE NOTICE '✓ Plan Trial creado';
  ELSE
    RAISE NOTICE '✓ Plan Trial existe';
  END IF;
END $;

SELECT '=== PASO 2: ACTUALIZAR FUNCIÓN handle_new_user ===' as info;

-- Recrear la función handle_new_user SIN verificación de trial_used_emails
-- Esto permite que TODOS los usuarios nuevos puedan registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
DECLARE
  v_company_id UUID;
  v_company_slug TEXT;
  v_company_name TEXT;
  v_full_name TEXT;
  v_invite_token TEXT;
  v_invitation RECORD;
  v_user_role TEXT;
BEGIN
  -- Extract metadata from auth.users
  v_full_name := NEW.raw_user_meta_data->>'full_name';
  v_company_name := NEW.raw_user_meta_data->>'company_name';
  v_company_slug := NEW.raw_user_meta_data->>'company_slug';
  v_invite_token := NEW.raw_user_meta_data->>'invite_token';

  -- Check if user is joining via invitation
  IF v_invite_token IS NOT NULL THEN
    -- Get invitation details
    SELECT * INTO v_invitation
    FROM public.invitations
    WHERE token = v_invite_token
      AND status = 'pending'
      AND expires_at > NOW()
    LIMIT 1;

    IF FOUND THEN
      -- Use company and role from invitation
      v_company_id := v_invitation.company_id;
      v_user_role := v_invitation.role;

      -- Mark invitation as accepted
      UPDATE public.invitations
      SET status = 'accepted',
          accepted_at = NOW()
      WHERE id = v_invitation.id;
    ELSE
      -- Invalid or expired invitation - create new company
      v_user_role := 'admin';

      -- Create new company
      INSERT INTO public.companies (name, slug)
      VALUES (
        COALESCE(v_company_name, 'My Company'),
        COALESCE(v_company_slug, 'company-' || NEW.id::text)
      )
      RETURNING id INTO v_company_id;

      -- Create Trial subscription for new company
      INSERT INTO public.subscriptions (company_id, plan_id, status, current_period_start, current_period_end)
      SELECT 
        v_company_id,
        p.id,
        'active',
        NOW(),
        NOW() + INTERVAL '14 days'
      FROM public.plans p
      WHERE p.name = 'Trial' 
        AND p.interval = 'month' 
        AND p.is_active = true
      LIMIT 1;
    END IF;
  ELSE
    -- No invitation - create new company (owner)
    v_user_role := 'admin';

    -- Create new company
    INSERT INTO public.companies (name, slug)
    VALUES (
      COALESCE(v_company_name, 'My Company'),
      COALESCE(v_company_slug, 'company-' || NEW.id::text)
    )
    RETURNING id INTO v_company_id;

    -- Create Trial subscription for new company
    INSERT INTO public.subscriptions (company_id, plan_id, status, current_period_start, current_period_end)
    SELECT 
      v_company_id,
      p.id,
      'active',
      NOW(),
      NOW() + INTERVAL '14 days'
    FROM public.plans p
    WHERE p.name = 'Trial' 
      AND p.interval = 'month' 
      AND p.is_active = true
    LIMIT 1;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, company_id, email, full_name, role, has_used_trial)
  VALUES (
    NEW.id,
    v_company_id,
    NEW.email,
    v_full_name,
    v_user_role,
    CASE WHEN v_user_role = 'admin' THEN true ELSE false END
  );

  -- Create company_users record (if table exists)
  BEGIN
    INSERT INTO public.company_users (company_id, user_id, role)
    VALUES (v_company_id, NEW.id, v_user_role)
    ON CONFLICT (company_id, user_id) DO NOTHING;
  EXCEPTION
    WHEN undefined_table THEN
      -- Table doesn't exist, skip
      NULL;
  END;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error details
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.email, SQLERRM;
    RAISE EXCEPTION 'Database error saving new user: %', SQLERRM;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '=== PASO 3: VERIFICAR TRIGGER ===' as info;

-- Recrear el trigger si no existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

SELECT '=== PASO 4: VERIFICAR PERMISOS ===' as info;

-- Asegurar permisos necesarios
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.invitations TO authenticated;
GRANT SELECT ON public.plans TO authenticated;
GRANT SELECT, INSERT ON public.subscriptions TO authenticated;

SELECT '=== PASO 5: VERIFICACIÓN FINAL ===' as info;

-- Verificar que todo está en orden
SELECT 
  'Plan Trial existe' as verificacion,
  COUNT(*) as resultado
FROM plans
WHERE name = 'Trial' AND interval = 'month' AND is_active = true;

SELECT 
  'Función handle_new_user existe' as verificacion,
  COUNT(*) as resultado
FROM pg_proc
WHERE proname = 'handle_new_user';

SELECT 
  'Trigger on_auth_user_created existe' as verificacion,
  COUNT(*) as resultado
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

SELECT '=== RESUMEN ===' as info;

DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'FIX APLICADO EXITOSAMENTE';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Cambios realizados:';
  RAISE NOTICE '✓ Plan Trial verificado/creado';
  RAISE NOTICE '✓ Función handle_new_user actualizada';
  RAISE NOTICE '✓ Trigger recreado';
  RAISE NOTICE '✓ Permisos configurados';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANTE:';
  RAISE NOTICE '- La función NO verifica trial_used_emails';
  RAISE NOTICE '- TODOS los usuarios nuevos pueden registrarse';
  RAISE NOTICE '- Cada usuario nuevo recibe 14 días de Trial';
  RAISE NOTICE '';
  RAISE NOTICE 'Ahora puedes probar crear un nuevo usuario';
  RAISE NOTICE '==============================================';
END $;

SELECT '=== FIN DEL SCRIPT ===' as info;
