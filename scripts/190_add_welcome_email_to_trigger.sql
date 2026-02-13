-- Add welcome email functionality to user creation trigger
-- This script updates the handle_new_user function to send welcome emails
-- Note: Requires pg_net extension and app.settings.api_url configuration

-- First, ensure pg_net extension is enabled (if available)
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- Set the API URL configuration (update this with your actual URL)
-- ALTER DATABASE postgres SET app.settings.api_url = 'https://your-domain.com';
-- Or for local development:
-- ALTER DATABASE postgres SET app.settings.api_url = 'http://localhost:3000';

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create updated function with welcome email support
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
  new_company_name TEXT;
  invite_record RECORD;
  welcome_email_payload JSONB;
  api_url TEXT;
BEGIN
  -- Get API URL from configuration
  BEGIN
    api_url := CURRENT_SETTING('app.settings.api_url', true);
  EXCEPTION
    WHEN OTHERS THEN
      api_url := NULL;
  END;

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

      -- Get company name for welcome email
      SELECT name INTO new_company_name
      FROM public.companies
      WHERE id = invite_record.company_id;

      -- Send welcome email for invited user (if pg_net is available and API URL is configured)
      IF api_url IS NOT NULL THEN
        BEGIN
          welcome_email_payload := jsonb_build_object(
            'email', NEW.email,
            'userName', COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
            'companyName', COALESCE(new_company_name, 'Tu Empresa')
          );
          
          -- Attempt to send welcome email via HTTP request
          PERFORM net.http_post(
            url := api_url || '/api/welcome-email',
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := welcome_email_payload
          );
        EXCEPTION
          WHEN OTHERS THEN
            -- Log warning but don't fail the user creation
            RAISE WARNING 'Could not send welcome email for invited user: %', SQLERRM;
        END;
      END IF;

      RETURN NEW;
    END IF;
  END IF;

  -- If not an invitation, create new company and admin profile
  -- Create company
  new_company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company');
  
  INSERT INTO public.companies (name, slug)
  VALUES (
    new_company_name,
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

  -- Send welcome email for new user (if pg_net is available and API URL is configured)
  IF api_url IS NOT NULL THEN
    BEGIN
      welcome_email_payload := jsonb_build_object(
        'email', NEW.email,
        'userName', COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
        'companyName', new_company_name
      );
      
      -- Attempt to send welcome email via HTTP request
      PERFORM net.http_post(
        url := api_url || '/api/welcome-email',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := welcome_email_payload
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Log warning but don't fail the user creation
        RAISE WARNING 'Could not send welcome email for new user: %', SQLERRM;
    END;
  END IF;

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

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates company, profile, trial subscription, and sends welcome email for new users';

-- Instructions for setup:
-- 1. Enable pg_net extension (if not already enabled):
--    CREATE EXTENSION IF NOT EXISTS pg_net;
--
-- 2. Configure API URL (replace with your actual domain):
--    For production:
--    ALTER DATABASE postgres SET app.settings.api_url = 'https://your-domain.com';
--    
--    For local development:
--    ALTER DATABASE postgres SET app.settings.api_url = 'http://localhost:3000';
--
-- 3. Ensure RESEND_API_KEY and RESEND_FROM_EMAIL are configured in your environment variables
--
-- 4. Run this script in your Supabase SQL Editor
