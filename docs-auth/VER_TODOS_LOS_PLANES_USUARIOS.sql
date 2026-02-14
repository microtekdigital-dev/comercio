-- ============================================================================
-- VER PLANES DE TODOS LOS USUARIOS
-- ============================================================================
-- Este script muestra el plan activo de cada usuario/empresa
-- ============================================================================

-- ========================================
-- 1. VISTA COMPLETA: Usuarios con sus planes
-- ========================================

SELECT 
  '👥 USUARIOS Y SUS PLANES' as seccion,
  p.email,
  p.full_name as nombre,
  c.name as empresa,
  pl.name as plan,
  pl.interval as periodo,
  s.status as estado_suscripcion,
  s.current_period_start as inicio_periodo,
  s.current_period_end as fin_periodo,
  CASE 
    WHEN s.current_period_end < CURRENT_DATE THEN '❌ Vencida'
    WHEN s.current_period_end < CURRENT_DATE + INTERVAL '7 days' THEN '⚠️ Por vencer'
    WHEN s.status = 'active' THEN '✅ Activa'
    WHEN s.status = 'cancelled' THEN '🚫 Cancelada'
    ELSE '❓ ' || s.status
  END as estado_visual,
  p.role as rol_usuario
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
LEFT JOIN subscriptions s ON s.company_id = p.company_id AND s.status IN ('active', 'trialing')
LEFT JOIN plans pl ON pl.id = s.plan_id
ORDER BY c.name, p.email;

-- ========================================
-- 2. RESUMEN POR PLAN
-- ========================================

SELECT 
  '📊 RESUMEN POR PLAN' as seccion,
  pl.name as plan,
  pl.interval as periodo,
  COUNT(DISTINCT s.company_id) as empresas_activas,
  COUNT(DISTINCT p.id) as usuarios_totales,
  pl.price as precio
FROM plans pl
LEFT JOIN subscriptions s ON s.plan_id = pl.id AND s.status IN ('active', 'trialing')
LEFT JOIN profiles p ON p.company_id = s.company_id
GROUP BY pl.id, pl.name, pl.interval, pl.price
ORDER BY 
  CASE pl.name
    WHEN 'Trial' THEN 1
    WHEN 'Básico' THEN 2
    WHEN 'Profesional' THEN 3
    WHEN 'Empresarial' THEN 4
    ELSE 5
  END,
  pl.interval;

-- ========================================
-- 3. EMPRESAS SIN SUSCRIPCIÓN ACTIVA
-- ========================================

SELECT 
  '⚠️ EMPRESAS SIN SUSCRIPCIÓN' as seccion,
  c.name as empresa,
  c.id as company_id,
  COUNT(p.id) as usuarios,
  STRING_AGG(p.email, ', ') as emails
FROM companies c
LEFT JOIN profiles p ON p.company_id = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s 
  WHERE s.company_id = c.id 
  AND s.status IN ('active', 'trialing')
)
GROUP BY c.id, c.name
ORDER BY c.name;

-- ========================================
-- 4. SUSCRIPCIONES POR VENCER (próximos 30 días)
-- ========================================

SELECT 
  '⏰ SUSCRIPCIONES POR VENCER' as seccion,
  c.name as empresa,
  p.email as contacto,
  pl.name as plan,
  s.current_period_end as fecha_vencimiento,
  CURRENT_DATE - s.current_period_end as dias_restantes,
  CASE 
    WHEN s.current_period_end < CURRENT_DATE THEN '❌ Ya vencida'
    WHEN s.current_period_end < CURRENT_DATE + INTERVAL '7 days' THEN '🔴 Menos de 7 días'
    WHEN s.current_period_end < CURRENT_DATE + INTERVAL '15 days' THEN '🟡 Menos de 15 días'
    ELSE '🟢 Menos de 30 días'
  END as urgencia
FROM subscriptions s
JOIN companies c ON c.id = s.company_id
JOIN plans pl ON pl.id = s.plan_id
JOIN profiles p ON p.company_id = s.company_id AND p.role = 'owner'
WHERE s.status IN ('active', 'trialing')
  AND s.current_period_end <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY s.current_period_end;

-- ========================================
-- 5. BUSCAR USUARIO ESPECÍFICO
-- ========================================

-- Descomenta y reemplaza el email para buscar un usuario específico
/*
SELECT 
  '🔍 BÚSQUEDA ESPECÍFICA' as seccion,
  p.email,
  p.full_name as nombre,
  p.role as rol,
  c.name as empresa,
  pl.name as plan,
  pl.interval as periodo,
  s.status as estado,
  s.current_period_start as inicio,
  s.current_period_end as fin,
  (SELECT COUNT(*) FROM profiles WHERE company_id = p.company_id) as usuarios_actuales
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
LEFT JOIN subscriptions s ON s.company_id = p.company_id AND s.status IN ('active', 'trialing')
LEFT JOIN plans pl ON pl.id = s.plan_id
WHERE p.email = 'vanithegameplay@gmail.com'; -- Reemplaza con el email que buscas
*/

-- ========================================
-- 6. ESTADÍSTICAS GENERALES
-- ========================================

SELECT 
  '📈 ESTADÍSTICAS GENERALES' as seccion,
  (SELECT COUNT(*) FROM profiles) as total_usuarios,
  (SELECT COUNT(*) FROM companies) as total_empresas,
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as suscripciones_activas,
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'trialing') as trials_activos,
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'cancelled') as suscripciones_canceladas,
  (SELECT COUNT(DISTINCT company_id) FROM subscriptions WHERE status IN ('active', 'trialing')) as empresas_con_plan;

-- ============================================================================
-- CÓMO USAR ESTE SCRIPT
-- ============================================================================
-- 
-- 1. Copia y pega en Supabase SQL Editor
-- 2. Ejecuta el script completo
-- 3. Verás 6 secciones con información diferente:
--    - Sección 1: Lista completa de usuarios y sus planes
--    - Sección 2: Resumen por tipo de plan
--    - Sección 3: Empresas sin suscripción
--    - Sección 4: Suscripciones por vencer
--    - Sección 5: Búsqueda específica (descomenta para usar)
--    - Sección 6: Estadísticas generales
-- 
-- Para buscar un usuario específico:
-- - Ve a la Sección 5
-- - Quita los /* y */ para descomentar
-- - Reemplaza 'vanithegameplay@gmail.com' con el email que buscas
-- - Ejecuta solo esa sección
-- ============================================================================
