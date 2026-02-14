-- ============================================================================
-- LIMPIAR SUSCRIPCIONES DUPLICADAS
-- ============================================================================
-- IMPORTANTE: Ejecuta primero DETECTAR_SUSCRIPCIONES_DUPLICADAS.sql
-- para ver qué se va a eliminar
-- ============================================================================

BEGIN;

-- ========================================
-- 1. CANCELAR SUSCRIPCIONES DUPLICADAS
-- ========================================

-- Actualiza el estado de las suscripciones duplicadas a 'cancelled'
-- Mantiene solo la suscripción más antigua de cada empresa

UPDATE subscriptions
SET 
  status = 'cancelled',
  updated_at = NOW()
WHERE id IN (
  -- Selecciona todas las suscripciones duplicadas (no la más antigua)
  SELECT s.id
  FROM subscriptions s
  INNER JOIN (
    -- Encuentra la suscripción más antigua de cada empresa
    SELECT 
      company_id,
      MIN(created_at) as primera_suscripcion
    FROM subscriptions
    WHERE status IN ('active', 'trialing')
    GROUP BY company_id
    HAVING COUNT(*) > 1
  ) oldest ON s.company_id = oldest.company_id
  WHERE s.status IN ('active', 'trialing')
    AND s.created_at > oldest.primera_suscripcion
);

-- ========================================
-- 2. VERIFICAR RESULTADO
-- ========================================

SELECT 
  '✅ LIMPIEZA COMPLETADA' as resultado,
  COUNT(*) as suscripciones_canceladas
FROM subscriptions
WHERE status = 'cancelled'
  AND updated_at > NOW() - INTERVAL '1 minute';

-- ========================================
-- 3. VERIFICAR QUE NO QUEDAN DUPLICADOS
-- ========================================

SELECT 
  '🔍 VERIFICACIÓN' as seccion,
  c.name as empresa,
  COUNT(s.id) as suscripciones_activas,
  STRING_AGG(pl.name, ', ') as planes
FROM companies c
INNER JOIN subscriptions s ON s.company_id = c.id
INNER JOIN plans pl ON pl.id = s.plan_id
WHERE s.status IN ('active', 'trialing')
GROUP BY c.id, c.name
HAVING COUNT(s.id) > 1;

-- Si esta query no devuelve resultados, significa que se limpiaron todos los duplicados

-- ========================================
-- 4. ESTADO FINAL DE SUSCRIPCIONES
-- ========================================

SELECT 
  '📊 ESTADO FINAL' as seccion,
  c.name as empresa,
  pl.name as plan,
  s.status,
  s.current_period_start as inicio,
  s.current_period_end as fin
FROM companies c
INNER JOIN subscriptions s ON s.company_id = c.id
INNER JOIN plans pl ON pl.id = s.plan_id
WHERE s.status IN ('active', 'trialing')
ORDER BY c.name;

COMMIT;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- 
-- ✅ Las suscripciones duplicadas se cancelan
-- ✅ Cada empresa queda con solo 1 suscripción activa (la más antigua)
-- ✅ Los usuarios pueden seguir usando el sistema normalmente
-- 
-- IMPORTANTE:
-- - Este script usa BEGIN/COMMIT para hacer la operación atómica
-- - Si algo falla, se hace rollback automático
-- - Solo se cancelan las suscripciones más recientes, manteniendo la original
-- 
-- SI QUIERES DESHACER:
-- - Cambia COMMIT por ROLLBACK antes de ejecutar
-- - O ejecuta: UPDATE subscriptions SET status = 'active' WHERE ...
-- ============================================================================
