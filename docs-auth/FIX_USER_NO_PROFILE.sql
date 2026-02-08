-- Script para arreglar usuarios que tienen cuenta pero no tienen perfil
-- Esto pasa cuando el trigger handle_new_user falla

-- PASO 1: Obtener el ID del usuario
DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT := 'vaunmate@gmail.com'; -- REEMPLAZA CON EL EMAIL DEL USUARIO
  v_company_id UUID;
  v_trial_plan_id UUID;
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
    RAISE NOTICE 'El usuario ya tiene perfil. No se necesita crear.';
    RETURN;
  END IF;

  -- Crear empresa con slug
  INSERT INTO public.companies (name, slug)
  VALUES ('Mi Empresa', lower(replace(v_user_email, '@', '-')) || '-' || substr(md5(random()::text), 1, 8))
  RETURNING id INTO v_company_id;

  RAISE NOTICE 'Empresa creada: %', v_company_id;

  -- Crear perfil
  INSERT INTO public.profiles (
    id,
    company_id,
    email,
    full_name,
    role
  ) VALUES (
    v_user_id,
    v_company_id,
    v_user_email,
    split_part(v_user_email, '@', 1),
    'admin'
  );

  RAISE NOTICE 'Perfil creado para: %', v_user_email;

  -- Obtener el ID del plan Trial
  SELECT id INTO v_trial_plan_id
  FROM public.plans
  WHERE name = 'Trial'
  LIMIT 1;

  IF v_trial_plan_id IS NULL THEN
    RAISE NOTICE 'Plan Trial no encontrado. No se creará suscripción.';
    RETURN;
  END IF;

  -- Verificar si el email ya usó trial
  IF EXISTS (SELECT 1 FROM public.trial_used_emails WHERE email = v_user_email) THEN
    RAISE NOTICE 'Email % ya usó trial. No se creará suscripción trial.', v_user_email;
    RETURN;
  END IF;

  -- Crear suscripción Trial
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

  RAISE NOTICE 'Suscripción Trial creada para: %', v_user_email;
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Usuario reparado exitosamente!';
  RAISE NOTICE 'El usuario puede hacer login ahora.';
  RAISE NOTICE '==============================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error reparando usuario: %', SQLERRM;
END $$;

-- Verificar que se creó correctamente
SELECT 
  u.email,
  u.email_confirmed_at,
  p.id as profile_id,
  p.company_id,
  p.role,
  c.name as company_name,
  s.status as subscription_status,
  pl.name as plan_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.companies c ON c.id = p.company_id
LEFT JOIN public.subscriptions s ON s.company_id = c.id
LEFT JOIN public.plans pl ON pl.id = s.plan_id
WHERE u.email = 'vaunmate@gmail.com'; -- REEMPLAZA CON EL EMAIL DEL USUARIO
