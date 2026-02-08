-- Script para arreglar usuarios que tienen perfil pero no tienen suscripción

DO $$
DECLARE
  v_user_email TEXT := 'electronica7165@gmail.com'; -- REEMPLAZA CON EL EMAIL
  v_company_id UUID;
  v_trial_plan_id UUID;
BEGIN
  -- Obtener company_id del usuario
  SELECT company_id INTO v_company_id
  FROM public.profiles
  WHERE email = v_user_email;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado: %', v_user_email;
  END IF;

  -- Verificar si ya tiene suscripción
  IF EXISTS (SELECT 1 FROM public.subscriptions WHERE company_id = v_company_id) THEN
    RAISE NOTICE 'El usuario ya tiene suscripción.';
    RETURN;
  END IF;

  -- Obtener el ID del plan Trial
  SELECT id INTO v_trial_plan_id
  FROM public.plans
  WHERE name = 'Trial'
  LIMIT 1;

  IF v_trial_plan_id IS NULL THEN
    RAISE EXCEPTION 'Plan Trial no encontrado';
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

END $$;

-- Verificar
SELECT 
  p.email,
  s.status as subscription_status,
  pl.name as plan_name,
  s.current_period_end
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.company_id = p.company_id
LEFT JOIN public.plans pl ON pl.id = s.plan_id
WHERE p.email = 'electronica7165@gmail.com'; -- REEMPLAZA CON EL EMAIL
