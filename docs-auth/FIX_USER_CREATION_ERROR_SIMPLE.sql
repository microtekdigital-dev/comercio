-- =====================================================
-- FIX SIMPLE: Error al crear nuevo usuario
-- "Database error saving new user"
-- =====================================================

-- PASO 1: Verificar plan Trial
SELECT '=== VERIFICANDO PLAN TRIAL ===' as info;

SELECT 
  id,
  name,
  interval,
  is_active,
  price
FROM plans
WHERE name = 'Trial' AND interval = 'month';

-- Si no existe, crear plan Trial
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

-- PASO 2: Actualizar función handle_new_user
SELECT '=== ACTUALIZANDO FUNCIÓN ===' as info;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_company_slug TEXT;
  v_company_name TEXT;
  v_full_name TEXT;
  v_invite_token TEXT;
  v_invitation RECORD;
  v_user_role TEXT;
BEGIN
  -- Extract metadata
  v_full_name := NEW.raw_user_meta_data->>'full_name';
  v_company_name := NEW.raw_user_meta_data->>'company_name';
  v_company_slug := NEW.raw_user_meta_data->>'company_slug';
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
      v_company_id := v_invitation.company_id;
      v_user_role := v_invitation.role;

      UPDATE public.invitations
      SET status = 'accepted', accepted_at = NOW()
      WHERE id = v_invitation.id;
    ELSE
      v_user_role := 'admin';

      INSERT INTO public.companies (name, slug)
      VALUES (
        COALESCE(v_company_name, 'My Company'),
        COALESCE(v_company_slug, 'company-' || NEW.id::text)
      )
      RETURNING id INTO v_company_id;

      INSERT INTO public.subscriptions (company_id, plan_id, status, current_period_start, current_period_end)
      SELECT 
        v_company_id, p.id, 'active', NOW(), NOW() + INTERVAL '14 days'
      FROM public.plans p
      WHERE p.name = 'Trial' AND p.interval = 'month' AND p.is_active = true
      LIMIT 1;
    END IF;
  ELSE
    v_user_role := 'admin';

    INSERT INTO public.companies (name, slug)
    VALUES (
      COALESCE(v_company_name, 'My Company'),
      COALESCE(v_company_slug, 'company-' || NEW.id::text)
    )
    RETURNING id INTO v_company_id;

    INSERT INTO public.subscriptions (company_id, plan_id, status, current_period_start, current_period_end)
    SELECT 
      v_company_id, p.id, 'active', NOW(), NOW() + INTERVAL '14 days'
    FROM public.plans p
    WHERE p.name = 'Trial' AND p.interval = 'month' AND p.is_active = true
    LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, company_id, email, full_name, role, has_used_trial)
  VALUES (
    NEW.id, v_company_id, NEW.email, v_full_name, v_user_role,
    CASE WHEN v_user_role = 'admin' THEN true ELSE false END
  );

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 3: Recrear trigger
SELECT '=== RECREANDO TRIGGER ===' as info;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASO 4: Configurar permisos
SELECT '=== CONFIGURANDO PERMISOS ===' as info;

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.invitations TO authenticated;
GRANT SELECT ON public.plans TO authenticated;
GRANT SELECT, INSERT ON public.subscriptions TO authenticated;

-- VERIFICACIÓN FINAL
SELECT '=== VERIFICACIÓN ===' as info;

SELECT 'Plan Trial' as item, COUNT(*)::text as resultado
FROM plans WHERE name = 'Trial' AND interval = 'month' AND is_active = true
UNION ALL
SELECT 'Función handle_new_user' as item, COUNT(*)::text as resultado
FROM pg_proc WHERE proname = 'handle_new_user'
UNION ALL
SELECT 'Trigger on_auth_user_created' as item, COUNT(*)::text as resultado
FROM pg_trigger WHERE tgname = 'on_auth_user_created';

SELECT '=== FIX COMPLETADO ===' as info;
