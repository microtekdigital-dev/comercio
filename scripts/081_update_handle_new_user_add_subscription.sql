-- Update handle_new_user function to create Trial subscription
-- This fixes the "Database error saving new user" issue

-- First, add the unique constraint to company_users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'company_users_company_user_unique'
  ) THEN
    ALTER TABLE public.company_users 
    ADD CONSTRAINT company_users_company_user_unique 
    UNIQUE (company_id, user_id);
  END IF;
END $$;

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

  -- Create company_users record
  INSERT INTO public.company_users (company_id, user_id, role)
  VALUES (v_company_id, NEW.id, v_user_role)
  ON CONFLICT (company_id, user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error details
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.email, SQLERRM;
    RAISE EXCEPTION 'Database error saving new user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the function was updated
SELECT 
  routine_name,
  'Function updated successfully' as status
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';
