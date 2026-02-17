-- Script para arreglar usuario de Google Auth sin suscripción
-- IMPORTANTE: Primero ejecuta DEBUG_GOOGLE_AUTH_USER.sql para obtener tu user_id

-- PASO 1: Reemplaza 'USER_ID_AQUI' con el ID que obtuviste del script de debug
-- PASO 2: Ejecuta este script completo en Supabase SQL Editor

DO $$
DECLARE
  v_user_id uuid := 'USER_ID_AQUI';  -- REEMPLAZAR CON TU USER ID
  v_user_email text;
  v_company_id uuid;
  v_profile_exists boolean;
  v_company_exists boolean;
  v_subscription_exists boolean;
  v_trial_plan_id uuid;
BEGIN
  -- Obtener email del usuario
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  RAISE NOTICE 'Procesando usuario: % (%)', v_user_email, v_user_id;

  -- Verificar si existe perfil
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = v_user_id
  ) INTO v_profile_exists;

  RAISE NOTICE 'Perfil existe: %', v_profile_exists;

  -- Si no existe perfil, crearlo
  IF NOT v_profile_exists THEN
    -- Crear empresa
    INSERT INTO companies (name, created_at, updated_at)
    VALUES (
      COALESCE(split_part(v_user_email, '@', 1), 'Mi Empresa'),
      NOW(),
      NOW()
    )
    RETURNING id INTO v_company_id;

    RAISE NOTICE 'Empresa creada: %', v_company_id;

    -- Crear perfil
    INSERT INTO profiles (id, company_id, role, created_at, updated_at)
    VALUES (
      v_user_id,
      v_company_id,
      'admin',
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Perfil creado para usuario: %', v_user_id;
  ELSE
    -- Obtener company_id del perfil existente
    SELECT company_id INTO v_company_id
    FROM profiles
    WHERE id = v_user_id;

    RAISE NOTICE 'Perfil ya existe, company_id: %', v_company_id;
  END IF;

  -- Verificar si existe empresa
  SELECT EXISTS(
    SELECT 1 FROM companies WHERE id = v_company_id
  ) INTO v_company_exists;

  RAISE NOTICE 'Empresa existe: %', v_company_exists;

  -- Si no existe empresa, crearla
  IF NOT v_company_exists THEN
    INSERT INTO companies (id, name, created_at, updated_at)
    VALUES (
      v_company_id,
      COALESCE(split_part(v_user_email, '@', 1), 'Mi Empresa'),
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Empresa creada: %', v_company_id;
  END IF;

  -- Verificar si existe suscripción
  SELECT EXISTS(
    SELECT 1 FROM subscriptions WHERE company_id = v_company_id
  ) INTO v_subscription_exists;

  RAISE NOTICE 'Suscripción existe: %', v_subscription_exists;

  -- Si no existe suscripción, crear una de prueba
  IF NOT v_subscription_exists THEN
    -- Obtener el plan Trial
    SELECT id INTO v_trial_plan_id
    FROM plans
    WHERE name = 'Trial'
    LIMIT 1;

    IF v_trial_plan_id IS NULL THEN
      RAISE EXCEPTION 'No se encontró el plan Trial';
    END IF;

    RAISE NOTICE 'Plan Trial ID: %', v_trial_plan_id;

    -- Crear suscripción de prueba (7 días)
    INSERT INTO subscriptions (
      company_id,
      plan_id,
      status,
      current_period_start,
      current_period_end,
      created_at,
      updated_at
    )
    VALUES (
      v_company_id,
      v_trial_plan_id,
      'active',
      NOW(),
      NOW() + INTERVAL '7 days',
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Suscripción Trial creada para empresa: %', v_company_id;
  END IF;

  RAISE NOTICE 'Proceso completado exitosamente';
END $$;

-- Verificar que todo se creó correctamente
SELECT 
  u.email,
  p.role,
  c.name as company_name,
  s.status as subscription_status,
  pl.name as plan_name,
  s.current_period_end
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN companies c ON c.id = p.company_id
LEFT JOIN subscriptions s ON s.company_id = c.id
LEFT JOIN plans pl ON pl.id = s.plan_id
WHERE u.id = 'USER_ID_AQUI';  -- REEMPLAZAR CON TU USER ID
