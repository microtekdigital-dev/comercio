-- ============================================================================
-- REPARACIÓN DE DATOS NULL EN PLANES Y SUSCRIPCIONES
-- ============================================================================
-- Este script corrige problemas con datos null en planes y suscripciones
-- IMPORTANTE: Ejecutar solo después de revisar VERIFY_PLANS_CONFIGURATION.sql
-- ============================================================================

-- PASO 1: Verificar que exista un plan Trial activo
DO $$
DECLARE
  v_trial_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_trial_count
  FROM public.plans
  WHERE name = 'Trial' 
    AND interval = 'month' 
    AND is_active = true
    AND price = 0;
  
  IF v_trial_count = 0 THEN
    RAISE EXCEPTION 'ERROR: No existe un plan Trial activo. Ejecuta seed-plans.sql primero.';
  END IF;
  
  RAISE NOTICE '✅ Plan Trial encontrado';
END $$;

-- PASO 2: Actualizar planes con max_users o max_products NULL
UPDATE public.plans
SET 
  max_users = CASE 
    WHEN name = 'Trial' THEN 3
    WHEN name = 'Básico' THEN 3
    WHEN name = 'Pro' THEN 10
    WHEN name = 'Empresarial' THEN 999999
    ELSE 3
  END,
  max_products = CASE 
    WHEN name = 'Trial' THEN 500
    WHEN name = 'Básico' THEN 500
    WHEN name = 'Pro' THEN 5000
    WHEN name = 'Empresarial' THEN 999999
    ELSE 500
  END
WHERE max_users IS NULL OR max_products IS NULL OR max_users = 0 OR max_products = 0;

-- PASO 3: Actualizar features NULL con arrays vacíos
UPDATE public.plans
SET features = '[]'::jsonb
WHERE features IS NULL;

-- PASO 4: Eliminar suscripciones con plan_id NULL (datos corruptos)
DELETE FROM public.subscriptions
WHERE plan_id IS NULL;

-- PASO 5: Cancelar suscripciones con status NULL
UPDATE public.subscriptions
SET status = 'cancelled'
WHERE status IS NULL;

-- PASO 6: Corregir suscripciones con fechas NULL
UPDATE public.subscriptions
SET 
  current_period_start = COALESCE(current_period_start, created_at, NOW()),
  current_period_end = COALESCE(
    current_period_end, 
    created_at + INTERVAL '14 days',
    NOW() + INTERVAL '14 days'
  )
WHERE current_period_start IS NULL OR current_period_end IS NULL;

-- PASO 7: Crear suscripciones Trial para usuarios sin suscripción
-- SOLO para usuarios creados recientemente (últimas 24 horas) que no tienen suscripción
DO $$
DECLARE
  v_company RECORD;
  v_trial_plan_id UUID;
BEGIN
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
  
  -- Buscar companies sin suscripción activa creadas en las últimas 24 horas
  FOR v_company IN
    SELECT DISTINCT c.id as company_id, c.name as company_name, c.created_at
    FROM public.companies c
    INNER JOIN public.profiles pr ON pr.company_id = c.id
    LEFT JOIN public.subscriptions s ON s.company_id = c.id AND s.status IN ('active', 'pending')
    WHERE s.id IS NULL
      AND c.created_at > NOW() - INTERVAL '24 hours'
  LOOP
    -- Crear suscripción Trial
    INSERT INTO public.subscriptions (
      company_id, 
      plan_id, 
      status, 
      current_period_start, 
      current_period_end
    )
    VALUES (
      v_company.company_id,
      v_trial_plan_id,
      'active',
      NOW(),
      NOW() + INTERVAL '14 days'
    );
    
    RAISE NOTICE '✅ Suscripción Trial creada para company: % (ID: %)', 
      v_company.company_name, v_company.company_id;
  END LOOP;
END $$;

-- PASO 8: Verificar resultados
SELECT 
  '=== RESULTADOS DE LA REPARACIÓN ===' as resultado,
  (SELECT COUNT(*) FROM public.plans WHERE is_active = true) as planes_activos,
  (SELECT COUNT(*) FROM public.plans WHERE max_users IS NULL OR max_products IS NULL) as planes_con_null,
  (SELECT COUNT(*) FROM public.subscriptions WHERE plan_id IS NULL) as subs_sin_plan,
  (SELECT COUNT(*) FROM public.subscriptions WHERE status IS NULL) as subs_sin_status,
  (SELECT COUNT(*) FROM public.subscriptions WHERE current_period_start IS NULL OR current_period_end IS NULL) as subs_sin_fechas,
  (SELECT COUNT(DISTINCT pr.company_id) 
   FROM public.profiles pr 
   LEFT JOIN public.subscriptions s ON pr.company_id = s.company_id AND s.status IN ('active', 'pending')
   WHERE pr.company_id IS NOT NULL AND s.id IS NULL) as companies_sin_suscripcion;

-- PASO 9: Mostrar suscripciones creadas/reparadas
SELECT 
  '=== SUSCRIPCIONES REPARADAS ===' as info,
  s.id,
  c.name as company_name,
  p.name as plan_name,
  s.status,
  s.current_period_start,
  s.current_period_end,
  EXTRACT(DAY FROM (s.current_period_end - NOW())) as dias_restantes
FROM public.subscriptions s
LEFT JOIN public.companies c ON s.company_id = c.id
LEFT JOIN public.plans p ON s.plan_id = p.id
WHERE s.updated_at > NOW() - INTERVAL '5 minutes'
ORDER BY s.updated_at DESC;
