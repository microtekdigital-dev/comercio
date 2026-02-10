-- =====================================================
-- FIX FINAL: Restaurar trigger handle_new_user
-- SIN TOCAR el sistema de bloqueo de trial
-- =====================================================

-- PASO 1: Eliminar trigger y función actuales
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- PASO 2: Recrear función handle_new_user (versión que funcionaba)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
  invite_record RECORD;
BEGIN
  -- Check if user is accepting an invitation
  IF NEW.raw_user_meta_data->>'invite_token' IS NOT NULL THEN
    -- Get invitation details
    SELECT * INTO invite_record
    FROM public.invitations
    WHERE token = NEW.raw_user_meta_data->>'invite_token'
      AND status = 'pending'
      AND expires_at > NOW()
    LIMIT 1;

    IF invite_record IS NOT NULL THEN
      -- Create profile for invited user
      INSERT INTO public.profiles (id, company_id, email, full_name, role)
      VALUES (
        NEW.id,
        invite_record.company_id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        invite_record.role
      );

      -- Mark invitation as accepted
      UPDATE public.invitations
      SET status = 'accepted', accepted_at = NOW()
      WHERE id = invite_record.id;

      RETURN NEW;
    END IF;
  END IF;

  -- If not an invitation, create new company and admin profile
  -- Create company
  INSERT INTO public.companies (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'),
    COALESCE(NEW.raw_user_meta_data->>'company_slug', 'company-' || NEW.id)
  )
  RETURNING id INTO new_company_id;

  -- Create profile as admin
  INSERT INTO public.profiles (id, company_id, email, full_name, role, has_used_trial)
  VALUES (
    NEW.id,
    new_company_id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'admin',
    true  -- Mark that they've used their trial
  );

  -- Create trial subscription for new company
  INSERT INTO public.subscriptions (company_id, plan_id, status, current_period_start, current_period_end)
  SELECT 
    new_company_id,
    p.id,
    'active',
    NOW(),
    NOW() + INTERVAL '14 days'
  FROM public.plans p
  WHERE p.name = 'Trial' AND p.interval = 'month' AND p.is_active = true
  LIMIT 1;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RAISE EXCEPTION 'Database error saving new user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 3: Recrear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASO 4: Configurar permisos
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.invitations TO authenticated;
GRANT SELECT ON public.plans TO authenticated;
GRANT SELECT, INSERT ON public.subscriptions TO authenticated;

-- PASO 5: Verificación
SELECT 
  'Función handle_new_user' as componente,
  CASE WHEN COUNT(*) > 0 THEN '✓ Instalada' ELSE '✗ No encontrada' END as estado
FROM pg_proc 
WHERE proname = 'handle_new_user'
UNION ALL
SELECT 
  'Trigger on_auth_user_created' as componente,
  CASE WHEN COUNT(*) > 0 THEN '✓ Instalado' ELSE '✗ No encontrado' END as estado
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created'
UNION ALL
SELECT 
  'Plan Trial activo' as componente,
  CASE WHEN COUNT(*) > 0 THEN '✓ Existe' ELSE '✗ No encontrado' END as estado
FROM plans 
WHERE name = 'Trial' AND interval = 'month' AND is_active = true
UNION ALL
SELECT 
  'Sistema bloqueo trial' as componente,
  CASE WHEN COUNT(*) > 0 THEN '✓ ACTIVO (no modificado)' ELSE '✗ No encontrado' END as estado
FROM information_schema.tables
WHERE table_name = 'trial_used_emails';
