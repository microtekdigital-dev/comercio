-- SOLUCIÓN FLEXIBLE: Activar Plan Anual
-- Este script busca la empresa por diferentes criterios

-- ============================================================================
-- PASO 1: BUSCAR LA EMPRESA
-- ============================================================================

SELECT '=== BUSCANDO EMPRESA ===' as info;

-- Buscar empresas que contengan "vani" o "game"
SELECT 
  id,
  name,
  slug,
  created_at
FROM companies
WHERE name ILIKE '%vani%'
   OR name ILIKE '%game%'
   OR slug ILIKE '%vani%'
ORDER BY created_at DESC;

-- ============================================================================
-- PASO 2: VER SUSCRIPCIONES ACTUALES DE TODAS LAS EMPRESAS
-- ============================================================================

SELECT '=== SUSCRIPCIONES ACTUALES ===' as info;

SELECT 
  c.name as empresa,
  s.id as subscription_id,
  s.status,
  p.name as plan_name,
  p.interval,
  s.created_at
FROM companies c
LEFT JOIN subscriptions s ON s.company_id = c.id
LEFT JOIN plans p ON s.plan_id = p.id
ORDER BY c.name, s.created_at DESC;

-- ============================================================================
-- PASO 3: INSTRUCCIONES MANUALES
-- ============================================================================

/*
INSTRUCCIONES:

1. Ejecuta las consultas anteriores
2. Identifica el ID de la empresa que quieres actualizar
3. Copia el ID de la empresa
4. Ejecuta el siguiente bloque reemplazando 'COMPANY_ID_AQUI' con el ID real

EJEMPLO:
Si el ID de la empresa es: 12345678-1234-1234-1234-123456789abc

Entonces ejecuta:

-- REEMPLAZA ESTE ID CON EL ID REAL DE LA EMPRESA
DO $$
DECLARE
  v_company_id UUID := '12345678-1234-1234-1234-123456789abc'; -- REEMPLAZA AQUÍ
  v_plan_id UUID;
  v_subscription_id UUID;
BEGIN
  -- Obtener plan_id del plan Profesional anual
  SELECT id INTO v_plan_id
  FROM plans
  WHERE name = 'Profesional'
  AND interval = 'year'
  AND is_active = true
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Plan Profesional anual no encontrado';
  END IF;

  -- Eliminar suscripciones existentes
  DELETE FROM subscriptions WHERE company_id = v_company_id;

  -- Crear la suscripción anual
  INSERT INTO subscriptions (
    company_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    created_at,
    updated_at
  ) VALUES (
    v_company_id,
    v_plan_id,
    'active',
    NOW(),
    NOW() + INTERVAL '1 year',
    false,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_subscription_id;

  RAISE NOTICE 'Suscripción creada con ID: %', v_subscription_id;
END $$;

*/

-- ============================================================================
-- ALTERNATIVA: SCRIPT PARA MÚLTIPLES EMPRESAS
-- ============================================================================

/*
Si quieres activar el plan anual para TODAS las empresas que tienen Trial,
ejecuta este bloque:

DO $$
DECLARE
  company_record RECORD;
  v_plan_id UUID;
BEGIN
  -- Obtener plan Profesional anual
  SELECT id INTO v_plan_id
  FROM plans
  WHERE name = 'Profesional'
  AND interval = 'year'
  AND is_active = true
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Plan Profesional anual no encontrado';
  END IF;

  -- Para cada empresa con suscripción Trial
  FOR company_record IN
    SELECT DISTINCT c.id, c.name
    FROM companies c
    JOIN subscriptions s ON s.company_id = c.id
    JOIN plans p ON s.plan_id = p.id
    WHERE p.name = 'Trial'
    AND s.status = 'active'
  LOOP
    RAISE NOTICE 'Actualizando empresa: %', company_record.name;
    
    -- Eliminar suscripciones existentes
    DELETE FROM subscriptions WHERE company_id = company_record.id;
    
    -- Crear suscripción anual
    INSERT INTO subscriptions (
      company_id,
      plan_id,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end
    ) VALUES (
      company_record.id,
      v_plan_id,
      'active',
      NOW(),
      NOW() + INTERVAL '1 year',
      false
    );
  END LOOP;

  RAISE NOTICE 'Proceso completado';
END $$;

*/
