-- ============================================================================
-- LIMPIAR SUSCRIPCIONES DUPLICADAS DE PLUSMAR
-- ============================================================================
-- Plusmar tiene 42 suscripciones Trial canceladas (duplicados)
-- Vamos a mantener solo la MÁS RECIENTE y eliminar las otras 41
-- Esto limpiará la base de datos pero mantendrá el historial de que canceló
-- ============================================================================

-- PASO 1: Ver la situación actual
SELECT 
  '=== ANTES DE LIMPIEZA ===' as info,
  COUNT(*) as total_subscriptions,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
  MIN(created_at) as primera_subscription,
  MAX(created_at) as ultima_subscription
FROM public.subscriptions
WHERE company_id IN (SELECT id FROM public.companies WHERE name = 'Plusmar');

-- PASO 2: Eliminar todas las suscripciones canceladas EXCEPTO la más reciente
DELETE FROM public.subscriptions
WHERE id IN (
  SELECT id 
  FROM public.subscriptions
  WHERE company_id IN (SELECT id FROM public.companies WHERE name = 'Plusmar')
    AND status = 'cancelled'
  ORDER BY created_at DESC
  OFFSET 1  -- Mantener la más reciente, eliminar el resto
);

-- PASO 3: Ver el resultado
SELECT 
  '=== DESPUÉS DE LIMPIEZA ===' as info,
  COUNT(*) as total_subscriptions,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
FROM public.subscriptions
WHERE company_id IN (SELECT id FROM public.companies WHERE name = 'Plusmar');

-- PASO 4: Mostrar la suscripción que quedó
SELECT 
  '=== SUSCRIPCIÓN FINAL ===' as info,
  s.id,
  c.name as company_name,
  p.name as plan_name,
  s.status,
  s.created_at,
  s.current_period_start,
  s.current_period_end,
  '✅ Esta es la única que debe quedar' as nota
FROM public.subscriptions s
LEFT JOIN public.companies c ON s.company_id = c.id
LEFT JOIN public.plans p ON s.plan_id = p.id
WHERE c.name = 'Plusmar'
ORDER BY s.created_at DESC;

-- PASO 5: Verificar que Plusmar puede acceder a billing
SELECT 
  '=== VERIFICACIÓN FINAL ===' as info,
  c.name as company_name,
  (SELECT COUNT(*) FROM public.subscriptions WHERE company_id = c.id AND status = 'cancelled') as trials_cancelados,
  (SELECT COUNT(*) FROM public.subscriptions WHERE company_id = c.id AND status = 'active') as trials_activos,
  CASE
    WHEN (SELECT COUNT(*) FROM public.subscriptions WHERE company_id = c.id AND status = 'cancelled') = 1
      AND (SELECT COUNT(*) FROM public.subscriptions WHERE company_id = c.id AND status = 'active') = 0
    THEN '✅ CORRECTO: Puede acceder a billing para seleccionar plan'
    ELSE '⚠️ Revisar configuración'
  END as estado
FROM public.companies c
WHERE c.name = 'Plusmar';
