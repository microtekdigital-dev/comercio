-- ============================================================================
-- DETECTAR SUSCRIPCIONES DUPLICADAS
-- ============================================================================
-- Encuentra empresas con múltiples suscripciones activas
-- ============================================================================

-- ========================================
-- 1. EMPRESAS CON MÚLTIPLES SUSCRIPCIONES ACTIVAS
-- ========================================

SELECT 
  '🔍 EMPRESAS CON DUPLICADOS' as seccion,
  c.name as empresa,
  c.id as company_id,
  COUNT(s.id) as suscripciones_activas,
  STRING_AGG(pl.name || ' (' || s.status || ')', ', ') as planes
FROM companies c
INNER JOIN subscriptions s ON s.company_id = c.id
INNER JOIN plans pl ON pl.id = s.plan_id
WHERE s.status IN ('active', 'trialing')
GROUP BY c.id, c.name
HAVING COUNT(s.id) > 1
ORDER BY COUNT(s.id) DESC, c.name;

-- ========================================
-- 2. DETALLE DE SUSCRIPCIONES DUPLICADAS
-- ========================================

SELECT 
  '📋 DETALLE DE DUPLICADOS' as seccion,
  c.name as empresa,
  s.id as subscription_id,
  pl.name as plan,
  s.status,
  s.current_period_start as inicio,
  s.current_period_end as fin,
  s.created_at as fecha_creacion,
  CASE 
    WHEN s.created_at = (
      SELECT MIN(s2.created_at) 
      FROM subscriptions s2 
      WHERE s2.company_id = c.id 
      AND s2.status IN ('active', 'trialing')
    ) THEN '✅ Más antigua (MANTENER)'
    ELSE '❌ Duplicada (ELIMINAR)'
  END as accion_recomendada
FROM companies c
INNER JOIN subscriptions s ON s.company_id = c.id
INNER JOIN plans pl ON pl.id = s.plan_id
WHERE s.status IN ('active', 'trialing')
  AND c.id IN (
    SELECT company_id 
    FROM subscriptions 
    WHERE status IN ('active', 'trialing')
    GROUP BY company_id 
    HAVING COUNT(*) > 1
  )
ORDER BY c.name, s.created_at;

-- ========================================
-- 3. USUARIOS AFECTADOS
-- ========================================

SELECT 
  '👥 USUARIOS AFECTADOS' as seccion,
  c.name as empresa,
  p.email,
  p.full_name as nombre,
  p.role as rol,
  COUNT(DISTINCT s.id) as suscripciones_activas
FROM companies c
INNER JOIN profiles p ON p.company_id = c.id
INNER JOIN subscriptions s ON s.company_id = c.id
WHERE s.status IN ('active', 'trialing')
  AND c.id IN (
    SELECT company_id 
    FROM subscriptions 
    WHERE status IN ('active', 'trialing')
    GROUP BY company_id 
    HAVING COUNT(*) > 1
  )
GROUP BY c.id, c.name, p.id, p.email, p.full_name, p.role
ORDER BY c.name, p.email;

-- ========================================
-- 4. RESUMEN
-- ========================================

SELECT 
  '📊 RESUMEN' as seccion,
  COUNT(DISTINCT c.id) as empresas_con_duplicados,
  COUNT(s.id) as total_suscripciones_duplicadas,
  COUNT(s.id) - COUNT(DISTINCT c.id) as suscripciones_a_eliminar
FROM companies c
INNER JOIN subscriptions s ON s.company_id = c.id
WHERE s.status IN ('active', 'trialing')
  AND c.id IN (
    SELECT company_id 
    FROM subscriptions 
    WHERE status IN ('active', 'trialing')
    GROUP BY company_id 
    HAVING COUNT(*) > 1
  );

-- ============================================================================
-- INTERPRETACIÓN
-- ============================================================================
-- 
-- Sección 1: Lista de empresas con múltiples suscripciones
-- Sección 2: Detalle de cada suscripción duplicada con recomendación
-- Sección 3: Usuarios afectados por los duplicados
-- Sección 4: Resumen de cuántas suscripciones hay que limpiar
-- 
-- ACCIÓN RECOMENDADA:
-- - Mantener la suscripción más antigua (primera creada)
-- - Cancelar las suscripciones duplicadas más recientes
-- ============================================================================
