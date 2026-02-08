-- ============================================================================
-- VERIFICAR COMPANY SIN SUSCRIPCIÓN
-- ============================================================================

-- Identificar la company sin suscripción activa
SELECT 
  '=== COMPANY SIN SUSCRIPCIÓN ===' as seccion,
  c.id as company_id,
  c.name as company_name,
  c.created_at as company_created_at,
  EXTRACT(HOUR FROM (NOW() - c.created_at)) as horas_desde_creacion,
  (SELECT COUNT(*) FROM public.profiles WHERE company_id = c.id) as usuarios_count,
  (SELECT string_agg(email, ', ') FROM public.profiles WHERE company_id = c.id) as usuarios_emails,
  (SELECT COUNT(*) FROM public.subscriptions WHERE company_id = c.id) as total_subscriptions,
  (SELECT COUNT(*) FROM public.subscriptions WHERE company_id = c.id AND status = 'cancelled') as cancelled_subscriptions,
  CASE
    WHEN c.created_at > NOW() - INTERVAL '24 hours' THEN '🆕 RECIENTE (< 24h)'
    WHEN c.created_at > NOW() - INTERVAL '7 days' THEN '⚠️ NUEVA (< 7 días)'
    ELSE '❌ ANTIGUA (> 7 días)'
  END as antiguedad,
  CASE
    WHEN (SELECT COUNT(*) FROM public.subscriptions WHERE company_id = c.id AND status = 'cancelled') > 0 
    THEN '⚠️ TUVO TRIAL CANCELADO'
    WHEN (SELECT COUNT(*) FROM public.subscriptions WHERE company_id = c.id) = 0
    THEN '❌ NUNCA TUVO SUSCRIPCIÓN'
    ELSE '✅ OK'
  END as diagnostico
FROM public.companies c
LEFT JOIN public.subscriptions s ON s.company_id = c.id AND s.status IN ('active', 'pending')
WHERE s.id IS NULL
ORDER BY c.created_at DESC;

-- Ver historial de suscripciones de esa company
SELECT 
  '=== HISTORIAL DE SUSCRIPCIONES ===' as seccion,
  s.id as subscription_id,
  c.name as company_name,
  p.name as plan_name,
  s.status,
  s.created_at,
  s.current_period_start,
  s.current_period_end,
  CASE
    WHEN s.current_period_end < NOW() THEN '⏰ EXPIRADA'
    WHEN s.status = 'cancelled' THEN '❌ CANCELADA'
    WHEN s.status = 'active' THEN '✅ ACTIVA'
    ELSE s.status
  END as estado
FROM public.subscriptions s
LEFT JOIN public.companies c ON s.company_id = c.id
LEFT JOIN public.plans p ON s.plan_id = p.id
WHERE s.company_id IN (
  SELECT c.id
  FROM public.companies c
  LEFT JOIN public.subscriptions s ON s.company_id = c.id AND s.status IN ('active', 'pending')
  WHERE s.id IS NULL
)
ORDER BY s.created_at DESC;
