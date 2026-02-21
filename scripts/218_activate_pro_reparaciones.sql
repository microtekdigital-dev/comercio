-- =====================================================
-- Script: Activate Pro Reparaciones Plan
-- Description: Changes a company's subscription to "Pro Reparaciones" plan
-- Version: 1.0
-- Date: 2026-02-20
-- =====================================================

-- INSTRUCCIONES:
-- 1. Reemplaza 'EMAIL_DEL_USUARIO' con el email del usuario/empresa que quieres cambiar
-- 2. Elige si quieres el plan mensual o anual (comenta el que NO quieras usar)
-- 3. Ejecuta este script en Supabase SQL Editor

-- =====================================================
-- PASO 1: Buscar la empresa del usuario
-- =====================================================
DO $$
DECLARE
  v_user_email TEXT := 'EMAIL_DEL_USUARIO'; -- CAMBIAR ESTE EMAIL
  v_company_id UUID;
  v_user_id UUID;
  v_old_subscription_id UUID;
  v_new_plan_id UUID;
  v_plan_interval TEXT := 'month'; -- Cambiar a 'year' para plan anual
BEGIN
  -- Buscar el usuario por email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_user_email
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario con email % no encontrado', v_user_email;
  END IF;
  
  RAISE NOTICE 'Usuario encontrado: %', v_user_id;
  
  -- Buscar la empresa del usuario
  SELECT company_id INTO v_company_id
  FROM profiles
  WHERE id = v_user_id
  LIMIT 1;
  
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'El usuario % no tiene empresa asignada', v_user_email;
  END IF;
  
  RAISE NOTICE 'Empresa encontrada: %', v_company_id;
  
  -- Buscar el plan "Pro Reparaciones"
  SELECT id INTO v_new_plan_id
  FROM plans
  WHERE name = 'Pro Reparaciones' 
    AND interval = v_plan_interval
    AND is_active = true
  LIMIT 1;
  
  IF v_new_plan_id IS NULL THEN
    RAISE EXCEPTION 'Plan "Pro Reparaciones" (%) no encontrado', v_plan_interval;
  END IF;
  
  RAISE NOTICE 'Plan "Pro Reparaciones" encontrado: %', v_new_plan_id;
  
  -- Buscar suscripción actual
  SELECT id INTO v_old_subscription_id
  FROM subscriptions
  WHERE company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_old_subscription_id IS NOT NULL THEN
    -- Actualizar suscripción existente
    UPDATE subscriptions
    SET 
      plan_id = v_new_plan_id,
      status = 'active',
      current_period_start = NOW(),
      current_period_end = CASE 
        WHEN v_plan_interval = 'month' THEN NOW() + INTERVAL '1 month'
        WHEN v_plan_interval = 'year' THEN NOW() + INTERVAL '1 year'
        ELSE NOW() + INTERVAL '1 month'
      END,
      cancel_at_period_end = false,
      updated_at = NOW()
    WHERE id = v_old_subscription_id;
    
    RAISE NOTICE 'Suscripción actualizada: %', v_old_subscription_id;
  ELSE
    -- Crear nueva suscripción
    INSERT INTO subscriptions (
      company_id,
      plan_id,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end
    ) VALUES (
      v_company_id,
      v_new_plan_id,
      'active',
      NOW(),
      CASE 
        WHEN v_plan_interval = 'month' THEN NOW() + INTERVAL '1 month'
        WHEN v_plan_interval = 'year' THEN NOW() + INTERVAL '1 year'
        ELSE NOW() + INTERVAL '1 month'
      END,
      false
    )
    RETURNING id INTO v_old_subscription_id;
    
    RAISE NOTICE 'Nueva suscripción creada: %', v_old_subscription_id;
  END IF;
  
  RAISE NOTICE '✅ Suscripción activada exitosamente para %', v_user_email;
  RAISE NOTICE 'Plan: Pro Reparaciones (%)' , v_plan_interval;
END $$;

-- =====================================================
-- PASO 2: Verificar el cambio
-- =====================================================
SELECT 
  c.name as empresa,
  u.email as usuario,
  p.name as plan,
  p.interval as intervalo,
  p.price as precio,
  s.status as estado,
  s.current_period_start as inicio_periodo,
  s.current_period_end as fin_periodo
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
JOIN plans p ON s.plan_id = p.id
JOIN profiles pr ON pr.company_id = c.id
JOIN auth.users u ON u.id = pr.id
WHERE u.email = 'EMAIL_DEL_USUARIO' -- CAMBIAR ESTE EMAIL
ORDER BY s.created_at DESC
LIMIT 1;

-- =====================================================
-- ALTERNATIVA: Activar por nombre de empresa
-- =====================================================
-- Si prefieres buscar por nombre de empresa en lugar de email,
-- descomenta y usa este bloque:

/*
DO $$
DECLARE
  v_company_name TEXT := 'NOMBRE_DE_LA_EMPRESA'; -- CAMBIAR ESTE NOMBRE
  v_company_id UUID;
  v_old_subscription_id UUID;
  v_new_plan_id UUID;
  v_plan_interval TEXT := 'month'; -- Cambiar a 'year' para plan anual
BEGIN
  -- Buscar la empresa por nombre
  SELECT id INTO v_company_id
  FROM companies
  WHERE name ILIKE '%' || v_company_name || '%'
  LIMIT 1;
  
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Empresa con nombre % no encontrada', v_company_name;
  END IF;
  
  RAISE NOTICE 'Empresa encontrada: %', v_company_id;
  
  -- Buscar el plan "Pro Reparaciones"
  SELECT id INTO v_new_plan_id
  FROM plans
  WHERE name = 'Pro Reparaciones' 
    AND interval = v_plan_interval
    AND is_active = true
  LIMIT 1;
  
  IF v_new_plan_id IS NULL THEN
    RAISE EXCEPTION 'Plan "Pro Reparaciones" (%) no encontrado', v_plan_interval;
  END IF;
  
  RAISE NOTICE 'Plan "Pro Reparaciones" encontrado: %', v_new_plan_id;
  
  -- Buscar suscripción actual
  SELECT id INTO v_old_subscription_id
  FROM subscriptions
  WHERE company_id = v_company_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_old_subscription_id IS NOT NULL THEN
    -- Actualizar suscripción existente
    UPDATE subscriptions
    SET 
      plan_id = v_new_plan_id,
      status = 'active',
      current_period_start = NOW(),
      current_period_end = CASE 
        WHEN v_plan_interval = 'month' THEN NOW() + INTERVAL '1 month'
        WHEN v_plan_interval = 'year' THEN NOW() + INTERVAL '1 year'
        ELSE NOW() + INTERVAL '1 month'
      END,
      cancel_at_period_end = false,
      updated_at = NOW()
    WHERE id = v_old_subscription_id;
    
    RAISE NOTICE 'Suscripción actualizada: %', v_old_subscription_id;
  ELSE
    -- Crear nueva suscripción
    INSERT INTO subscriptions (
      company_id,
      plan_id,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end
    ) VALUES (
      v_company_id,
      v_new_plan_id,
      'active',
      NOW(),
      CASE 
        WHEN v_plan_interval = 'month' THEN NOW() + INTERVAL '1 month'
        WHEN v_plan_interval = 'year' THEN NOW() + INTERVAL '1 year'
        ELSE NOW() + INTERVAL '1 month'
      END,
      false
    )
    RETURNING id INTO v_old_subscription_id;
    
    RAISE NOTICE 'Nueva suscripción creada: %', v_old_subscription_id;
  END IF;
  
  RAISE NOTICE '✅ Suscripción activada exitosamente para empresa: %', v_company_name;
  RAISE NOTICE 'Plan: Pro Reparaciones (%)' , v_plan_interval;
END $$;
*/
