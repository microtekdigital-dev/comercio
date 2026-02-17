-- Script de solución para problema de acceso con Google Auth
-- Ejecutar DESPUÉS de revisar el diagnóstico
-- REEMPLAZAR 'TU_EMAIL_AQUI@gmail.com' con tu email real

-- ============================================================================
-- SOLUCIÓN 1: Asegurar que company_id esté asignado en profiles
-- ============================================================================
DO $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
  v_email TEXT := 'TU_EMAIL_AQUI@gmail.com';  -- REEMPLAZAR
BEGIN
  -- Obtener user_id
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'ERROR: Usuario no encontrado con email %', v_email;
    RETURN;
  END IF;
  
  -- Verificar si tiene company_id
  SELECT company_id INTO v_company_id
  FROM profiles
  WHERE id = v_user_id;
  
  IF v_company_id IS NULL THEN
    RAISE NOTICE 'company_id es NULL, creando empresa...';
    
    -- Crear empresa
    INSERT INTO companies (name)
    VALUES ('Empresa de ' || v_email)
    RETURNING id INTO v_company_id;
    
    -- Asignar company_id al perfil
    UPDATE profiles
    SET company_id = v_company_id,
        role = 'owner'
    WHERE id = v_user_id;
    
    RAISE NOTICE '✓ Empresa creada y asignada: %', v_company_id;
  ELSE
    RAISE NOTICE '✓ company_id ya existe: %', v_company_id;
  END IF;
END $$;

-- ============================================================================
-- SOLUCIÓN 2: Asegurar membresía en company_users
-- ============================================================================
DO $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
  v_role TEXT;
  v_email TEXT := 'TU_EMAIL_AQUI@gmail.com';  -- REEMPLAZAR
BEGIN
  -- Obtener datos del usuario
  SELECT p.id, p.company_id, p.role
  INTO v_user_id, v_company_id, v_role
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'ERROR: Usuario no encontrado';
    RETURN;
  END IF;
  
  IF v_company_id IS NULL THEN
    RAISE NOTICE 'ERROR: company_id es NULL, ejecutar SOLUCIÓN 1 primero';
    RETURN;
  END IF;
  
  -- Verificar si existe en company_users
  IF NOT EXISTS (
    SELECT 1 FROM company_users
    WHERE user_id = v_user_id AND company_id = v_company_id
  ) THEN
    RAISE NOTICE 'Creando membresía en company_users...';
    
    INSERT INTO company_users (user_id, company_id, role)
    VALUES (v_user_id, v_company_id, v_role)
    ON CONFLICT (user_id, company_id) DO NOTHING;
    
    RAISE NOTICE '✓ Membresía creada en company_users';
  ELSE
    RAISE NOTICE '✓ Membresía ya existe en company_users';
  END IF;
END $$;

-- ============================================================================
-- SOLUCIÓN 3: Verificar y crear suscripción Trial si no existe
-- ============================================================================
DO $$
DECLARE
  v_company_id UUID;
  v_trial_plan_id UUID;
  v_email TEXT := 'TU_EMAIL_AQUI@gmail.com';  -- REEMPLAZAR
  v_subscription_count INT;
BEGIN
  -- Obtener company_id
  SELECT p.company_id INTO v_company_id
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = v_email;
  
  IF v_company_id IS NULL THEN
    RAISE NOTICE 'ERROR: company_id es NULL, ejecutar SOLUCIÓN 1 primero';
    RETURN;
  END IF;
  
  -- Contar suscripciones activas
  SELECT COUNT(*) INTO v_subscription_count
  FROM subscriptions
  WHERE company_id = v_company_id
  AND status IN ('active', 'pending');
  
  IF v_subscription_count > 0 THEN
    RAISE NOTICE '✓ Ya existe una suscripción activa';
    RETURN;
  END IF;
  
  RAISE NOTICE 'No hay suscripción activa, creando Trial...';
  
  -- Obtener ID del plan Trial
  SELECT id INTO v_trial_plan_id
  FROM plans
  WHERE name = 'Trial'
  AND is_active = true
  LIMIT 1;
  
  IF v_trial_plan_id IS NULL THEN
    RAISE NOTICE 'ERROR: Plan Trial no encontrado';
    RETURN;
  END IF;
  
  -- Crear suscripción Trial
  INSERT INTO subscriptions (
    company_id,
    plan_id,
    status,
    current_period_start,
    current_period_end
  )
  VALUES (
    v_company_id,
    v_trial_plan_id,
    'active',
    NOW(),
    NOW() + INTERVAL '14 days'
  );
  
  RAISE NOTICE '✓ Suscripción Trial creada (válida por 14 días)';
END $$;

-- ============================================================================
-- SOLUCIÓN 4: Limpiar suscripciones duplicadas (si existen)
-- ============================================================================
DO $$
DECLARE
  v_company_id UUID;
  v_email TEXT := 'TU_EMAIL_AQUI@gmail.com';  -- REEMPLAZAR
  v_subscription_count INT;
BEGIN
  -- Obtener company_id
  SELECT p.company_id INTO v_company_id
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = v_email;
  
  IF v_company_id IS NULL THEN
    RAISE NOTICE 'ERROR: company_id es NULL';
    RETURN;
  END IF;
  
  -- Contar suscripciones activas
  SELECT COUNT(*) INTO v_subscription_count
  FROM subscriptions
  WHERE company_id = v_company_id
  AND status IN ('active', 'pending');
  
  IF v_subscription_count <= 1 THEN
    RAISE NOTICE '✓ No hay suscripciones duplicadas';
    RETURN;
  END IF;
  
  RAISE NOTICE '⚠ Encontradas % suscripciones activas, limpiando...', v_subscription_count;
  
  -- Mantener solo la más reciente, cancelar las demás
  UPDATE subscriptions
  SET status = 'cancelled'
  WHERE company_id = v_company_id
  AND status IN ('active', 'pending')
  AND id NOT IN (
    SELECT id
    FROM subscriptions
    WHERE company_id = v_company_id
    AND status IN ('active', 'pending')
    ORDER BY created_at DESC
    LIMIT 1
  );
  
  RAISE NOTICE '✓ Suscripciones duplicadas canceladas';
END $$;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
SELECT 
  '=== VERIFICACIÓN FINAL ===' as resultado,
  u.email,
  p.company_id,
  p.role,
  c.name as company_name,
  s.status as subscription_status,
  pl.name as plan_name,
  s.current_period_end,
  CASE 
    WHEN s.status = 'active' AND s.current_period_end > NOW() THEN '✓ ACCESO DEBERÍA FUNCIONAR'
    ELSE '✗ REVISAR PROBLEMA'
  END as estado_final
FROM auth.users u
JOIN profiles p ON p.id = u.id
JOIN companies c ON c.id = p.company_id
LEFT JOIN subscriptions s ON s.company_id = c.id AND s.status IN ('active', 'pending')
LEFT JOIN plans pl ON pl.id = s.plan_id
WHERE u.email = 'TU_EMAIL_AQUI@gmail.com'  -- REEMPLAZAR
ORDER BY s.created_at DESC
LIMIT 1;
