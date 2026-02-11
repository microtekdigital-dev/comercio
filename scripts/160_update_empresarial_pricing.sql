-- ============================================================================
-- Script: Actualizar precios del plan Empresarial
-- Descripción: Cambia el precio del plan Empresarial a $30,000 mensual y anual
-- Fecha: 2026-02-11
-- ============================================================================

-- Actualizar plan Empresarial mensual a $30,000
UPDATE plans
SET price = 30000
WHERE 
  name = 'Empresarial' 
  AND interval = 'month'
  AND is_active = true;

-- Actualizar plan Empresarial anual a $300,000
UPDATE plans
SET price = 300000
WHERE 
  name = 'Empresarial' 
  AND interval = 'year'
  AND is_active = true;

-- Verificar los cambios
SELECT 
  id,
  name,
  price,
  currency,
  interval,
  description,
  is_active
FROM plans
WHERE name = 'Empresarial'
ORDER BY interval;
