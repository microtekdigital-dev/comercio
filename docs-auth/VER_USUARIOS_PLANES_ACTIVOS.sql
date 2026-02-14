-- ============================================================================
-- VER USUARIOS CON PLANES ACTIVOS
-- ============================================================================
-- Script simple para ver todos los usuarios y sus planes activos
-- ============================================================================

SELECT 
  p.email,
  p.full_name as nombre,
  c.name as empresa,
  pl.name as plan,
  CASE pl.interval
    WHEN 'month' THEN 'Mensual'
    WHEN 'year' THEN 'Anual'
    ELSE pl.interval
  END as periodo,
  s.status as estado,
  s.current_period_start as inicio,
  s.current_period_end as vencimiento,
  CASE 
    WHEN s.current_period_end < CURRENT_DATE THEN '❌ Vencida'
    WHEN s.current_period_end < CURRENT_DATE + INTERVAL '7 days' THEN '⚠️ Por vencer (menos de 7 días)'
    WHEN s.current_period_end < CURRENT_DATE + INTERVAL '30 days' THEN '🟡 Por vencer (menos de 30 días)'
    ELSE '✅ Activa'
  END as estado_visual,
  p.role as rol
FROM profiles p
INNER JOIN companies c ON c.id = p.company_id
INNER JOIN subscriptions s ON s.company_id = p.company_id 
INNER JOIN plans pl ON pl.id = s.plan_id
WHERE s.status IN ('active', 'trialing')
ORDER BY c.name, p.email;

-- ============================================================================
-- RESULTADO
-- ============================================================================
-- Muestra todos los usuarios que tienen un plan activo o en trial
-- Incluye: email, nombre, empresa, plan, periodo, fechas y estado visual
-- ============================================================================
