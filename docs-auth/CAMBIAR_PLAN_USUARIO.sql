-- ============================================
-- SCRIPT PARA CAMBIAR EL PLAN DE UN USUARIO
-- ============================================
-- Este script te permite cambiar el plan de suscripción de un usuario
-- de forma manual desde la base de datos.

-- PASO 1: Buscar el usuario y su compañía
-- Reemplaza 'email@ejemplo.com' con el email del usuario
SELECT 
  u.id as user_id,
  u.email,
  cu.company_id,
  c.name as company_name,
  s.id as subscription_id,
  s.status as subscription_status,
  p.name as current_plan,
  p.id as current_plan_id
FROM auth.users u
JOIN public.company_users cu ON cu.user_id = u.id
JOIN public.companies c ON c.id = cu.company_id
LEFT JOIN public.subscriptions s ON s.company_id = c.id AND s.status = 'active'
LEFT JOIN public.plans p ON p.id = s.plan_id
WHERE u.email = 'email@ejemplo.com';

-- PASO 2: Ver los planes disponibles
SELECT 
  id,
  name,
  description,
  price,
  currency,
  interval,
  is_active
FROM public.plans
WHERE is_active = true
ORDER BY sort_order;

-- PASO 3: Cambiar el plan del usuario
-- IMPORTANTE: Reemplaza los valores entre comillas simples:
-- - 'COMPANY_ID_AQUI' con el company_id del PASO 1
-- - 'NUEVO_PLAN_ID_AQUI' con el id del plan deseado del PASO 2

DO $$
DECLARE
  v_company_id UUID := 'COMPANY_ID_AQUI'; -- Reemplazar con el company_id
  v_new_plan_id UUID := 'NUEVO_PLAN_ID_AQUI'; -- Reemplazar con el nuevo plan_id
  v_old_subscription_id UUID;
BEGIN
  -- Cancelar suscripción actual si existe
  UPDATE public.subscriptions
  SET 
    status = 'cancelled',
    cancel_at_period_end = true,
    updated_at = NOW()
  WHERE company_id = v_company_id 
    AND status = 'active'
  RETURNING id INTO v_old_subscription_id;

  -- Crear nueva suscripción
  INSERT INTO public.subscriptions (
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
    NOW() + INTERVAL '1 month', -- Ajustar según el intervalo del plan
    false
  );

  RAISE NOTICE 'Plan cambiado exitosamente. Suscripción anterior: %, Nueva suscripción creada', v_old_subscription_id;
END $$;

-- PASO 4: Verificar el cambio
-- Reemplaza 'email@ejemplo.com' con el email del usuario
SELECT 
  u.email,
  c.name as company_name,
  s.status as subscription_status,
  p.name as plan_name,
  p.price,
  s.current_period_start,
  s.current_period_end
FROM auth.users u
JOIN public.company_users cu ON cu.user_id = u.id
JOIN public.companies c ON c.id = cu.company_id
JOIN public.subscriptions s ON s.company_id = c.id AND s.status = 'active'
JOIN public.plans p ON p.id = s.plan_id
WHERE u.email = 'email@ejemplo.com';
