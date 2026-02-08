-- ============================================================================
-- REPARAR PROBLEMA DE PLUSMAR - 42 TRIALS CANCELADOS
-- ============================================================================
-- Esta empresa tiene 42 suscripciones Trial canceladas creadas hoy
-- Todas fueron canceladas inmediatamente después de crearse
-- Necesitamos limpiar y darle una suscripción Trial válida de 14 días
-- ============================================================================

-- PASO 1: Verificar la situación actual de Plusmar
SELECT 
  '=== SITUACIÓN ACTUAL DE PLUSMAR ===' as info,
  c.id as company_id,
  c.name as company_name,
  (SELECT COUNT(*) FROM public.subscriptions WHERE company_id = c.id) as total_subscriptions,
  (SELECT COUNT(*) FROM public.subscriptions WHERE company_id = c.id AND status = 'cancelled') as cancelled_count,
  (SELECT COUNT(*) FROM public.subscriptions WHERE company_id = c.id AND status = 'active') as active_count,
  (SELECT COUNT(*) FROM public.profiles WHERE company_id = c.id) as users_count
FROM public.companies c
WHERE c.name = 'Plusmar';

-- PASO 2: Eliminar TODAS las suscripciones canceladas de Plusmar
-- Esto limpiará el historial corrupto
DELETE FROM public.subscriptions
WHERE company_id IN (SELECT id FROM public.companies WHERE name = 'Plusmar')
  AND status = 'cancelled';

-- PASO 3: Verificar que se eliminaron
SELECT 
  '=== DESPUÉS DE LIMPIEZA ===' as info,
  COUNT(*) as subscriptions_restantes
FROM public.subscriptions
WHERE company_id IN (SELECT id FROM public.companies WHERE name = 'Plusmar');

-- PASO 4: Crear una nueva suscripción Trial válida de 14 días
DO $$
DECLARE
  v_company_id UUID;
  v_trial_plan_id UUID;
BEGIN
  -- Obtener el ID de la company Plusmar
  SELECT id INTO v_company_id
  FROM public.companies
  WHERE name = 'Plusmar'
  LIMIT 1;
  
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró la empresa Plusmar';
  END IF;
  
  -- Obtener el ID del plan Trial
  SELECT id INTO v_trial_plan_id
  FROM public.plans
  WHERE name = 'Trial' 
    AND interval = 'month' 
    AND is_active = true
    AND price = 0
  LIMIT 1;
  
  IF v_trial_plan_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el plan Trial';
  END IF;
  
  -- Crear suscripción Trial válida de 14 días
  INSERT INTO public.subscriptions (
    company_id, 
    plan_id, 
    status, 
    current_period_start, 
    current_period_end,
    cancel_at_period_end
  )
  VALUES (
    v_company_id,
    v_trial_plan_id,
    'active',
    NOW(),
    NOW() + INTERVAL '14 days',  -- 14 días completos
    false
  );
  
  RAISE NOTICE '✅ Suscripción Trial de 14 días creada para Plusmar';
END $$;

-- PASO 5: Actualizar el perfil para marcar que usó el trial
UPDATE public.profiles
SET has_used_trial = true
WHERE company_id IN (SELECT id FROM public.companies WHERE name = 'Plusmar');

-- PASO 6: Verificar el resultado final
SELECT 
  '=== RESULTADO FINAL ===' as info,
  s.id as subscription_id,
  c.name as company_name,
  p.name as plan_name,
  s.status,
  s.current_period_start,
  s.current_period_end,
  EXTRACT(DAY FROM (s.current_period_end - NOW())) as dias_restantes,
  CASE
    WHEN s.current_period_end > NOW() AND s.status = 'active' THEN '✅ TRIAL ACTIVO Y VÁLIDO'
    ELSE '❌ PROBLEMA'
  END as estado
FROM public.subscriptions s
LEFT JOIN public.companies c ON s.company_id = c.id
LEFT JOIN public.plans p ON s.plan_id = p.id
WHERE c.name = 'Plusmar'
ORDER BY s.created_at DESC;

-- PASO 7: Verificar usuarios de Plusmar
SELECT 
  '=== USUARIOS DE PLUSMAR ===' as info,
  pr.id,
  pr.email,
  pr.role,
  pr.has_used_trial,
  pr.created_at
FROM public.profiles pr
WHERE pr.company_id IN (SELECT id FROM public.companies WHERE name = 'Plusmar')
ORDER BY pr.created_at;
