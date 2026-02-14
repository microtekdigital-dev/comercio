-- ============================================================================
-- Script: Actualizar precios de planes 2026
-- Descripción: Actualiza los precios de todos los planes (mensuales y anuales)
-- Fecha: 2026-02-14
-- ============================================================================

-- Nuevos precios:
-- Básico Mensual: $15,000
-- Profesional Mensual: $30,000
-- Empresarial Mensual: $55,000
-- Básico Anual: $150,000
-- Profesional Anual: $300,000
-- Empresarial Anual: $500,000

BEGIN;

-- ============================================================================
-- 1. ACTUALIZAR PLANES MENSUALES
-- ============================================================================

-- Actualizar Plan Básico Mensual
UPDATE plans
SET price = 15000
WHERE name = 'Básico'
  AND interval = 'month';

-- Actualizar Plan Profesional Mensual
UPDATE plans
SET price = 30000
WHERE name = 'Profesional'
  AND interval = 'month';

-- Actualizar Plan Empresarial Mensual
UPDATE plans
SET price = 55000
WHERE name = 'Empresarial'
  AND interval = 'month';

-- ============================================================================
-- 2. ACTUALIZAR PLANES ANUALES
-- ============================================================================

-- Actualizar Plan Básico Anual
UPDATE plans
SET price = 150000
WHERE name = 'Básico'
  AND interval = 'year';

-- Actualizar Plan Profesional Anual
UPDATE plans
SET price = 300000
WHERE name = 'Profesional'
  AND interval = 'year';

-- Actualizar Plan Empresarial Anual
UPDATE plans
SET price = 500000
WHERE name = 'Empresarial'
  AND interval = 'year';

-- ============================================================================
-- 3. VERIFICAR CAMBIOS
-- ============================================================================

-- Mostrar todos los planes con sus nuevos precios
SELECT 
  id,
  name,
  interval,
  price,
  description
FROM plans
WHERE name IN ('Básico', 'Profesional', 'Empresarial')
ORDER BY 
  CASE name
    WHEN 'Básico' THEN 1
    WHEN 'Profesional' THEN 2
    WHEN 'Empresarial' THEN 3
  END,
  CASE interval
    WHEN 'month' THEN 1
    WHEN 'year' THEN 2
  END;

COMMIT;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 
-- 1. Este script actualiza los precios de los planes existentes
-- 2. NO afecta a las suscripciones activas de los usuarios
-- 3. Los nuevos precios se aplicarán a:
--    - Nuevas suscripciones
--    - Renovaciones de suscripciones
--    - Cambios de plan
-- 
-- 4. Precios actualizados:
--    Mensuales:
--    - Básico: $15,000
--    - Profesional: $30,000
--    - Empresarial: $55,000
--    
--    Anuales:
--    - Básico: $150,000 (ahorro de $30,000 vs mensual)
--    - Profesional: $300,000 (ahorro de $60,000 vs mensual)
--    - Empresarial: $500,000 (ahorro de $160,000 vs mensual)
-- 
-- ============================================================================
