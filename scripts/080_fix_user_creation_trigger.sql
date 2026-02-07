-- Fix: Create trigger to handle new user registration
-- This trigger creates the company and profile when a new user signs up

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user
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

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.invitations TO authenticated;
GRANT SELECT ON public.plans TO authenticated;
GRANT SELECT, INSERT ON public.subscriptions TO authenticated;

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates company, profile, and trial subscription for new users, or adds user to existing company if accepting invitation';
