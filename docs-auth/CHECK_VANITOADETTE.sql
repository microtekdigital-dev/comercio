-- ============================================================================
-- DIAGNÓSTICO: vanitoadette@gmail.com
-- ============================================================================

-- Ver información completa de vanitoadette
SELECT 
  p.email as user_email,
  c.name as company_name,
  s.id as subscription_id,
  s.status,
  s.current_period_end,
  pl.name as plan_name,
  pl.price,
  CASE 
    WHEN s.status = 'active' AND s.current_period_end > NOW() THEN '✅ DEBERÍA FUNCIONAR'
    WHEN s.status = 'cancelled' THEN '❌ CANCELADA - Necesita nuevo plan'
    WHEN s.current_period_end < NOW() THEN '❌ VENCIDA - Necesita renovación'
    WHEN s.id IS NULL THEN '❌ SIN SUSCRIPCIÓN'
    ELSE '⚠️ Estado: ' || s.status
  END as diagnostico_final
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN LATERAL (
  SELECT * FROM subscriptions 
  WHERE company_id = c.id 
  ORDER BY created_at DESC 
  LIMIT 1
) s ON true
LEFT JOIN plans pl ON s.plan_id = pl.id
WHERE p.email = 'vanitoadette@gmail.com';
