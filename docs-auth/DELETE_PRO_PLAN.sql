-- ELIMINAR PLAN "PRO" COMPLETAMENTE
-- Este script elimina los planes "Pro" de la base de datos

-- ============================================================================
-- PASO 1: VERIFICAR QUE NO HAY SUSCRIPCIONES ACTIVAS CON PLAN "PRO"
-- ============================================================================

SELECT '=== VERIFICACIÓN PREVIA ===' as info;

-- Verificar que no hay suscripciones activas con plan "Pro"
SELECT 
  'Suscripciones activas con plan Pro:' as info,
  COUNT(*) as total
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE p.name = 'Pro'
AND s.status = 'active';

-- Si el resultado es 0, es seguro eliminar
-- Si el resultado es > 0, NO ejecutes el resto del script

-- ============================================================================
-- PASO 2: VER QUÉ PLANES "PRO" EXISTEN
-- ============================================================================

SELECT '=== PLANES PRO A ELIMINAR ===' as info;

SELECT 
  id,
  name,
  interval,
  price,
  is_active
FROM plans
WHERE name = 'Pro'
ORDER BY interval;

-- ============================================================================
-- PASO 3: ELIMINAR PLANES "PRO"
-- ============================================================================

SELECT '=== ELIMINANDO PLANES PRO ===' as info;

-- Eliminar todos los planes con nombre "Pro"
DELETE FROM plans
WHERE name = 'Pro';

SELECT 'Planes Pro eliminados' as resultado;

-- ============================================================================
-- PASO 4: VERIFICAR RESULTADO
-- ============================================================================

SELECT '=== VERIFICACIÓN FINAL ===' as info;

-- Verificar que no quedan planes "Pro"
SELECT 
  'Planes Pro restantes:' as info,
  COUNT(*) as total
FROM plans
WHERE name = 'Pro';

-- Ver todos los planes que quedan
SELECT 
  'Planes disponibles:' as info;

SELECT 
  name,
  interval,
  price,
  is_active,
  CASE 
    WHEN is_active THEN '✅ Activo'
    ELSE '❌ Desactivado'
  END as estado
FROM plans
ORDER BY 
  CASE name
    WHEN 'Trial' THEN 1
    WHEN 'Básico' THEN 2
    WHEN 'Profesional' THEN 3
    WHEN 'Empresarial' THEN 4
    ELSE 5
  END,
  CASE interval
    WHEN 'month' THEN 1
    WHEN 'year' THEN 2
    ELSE 3
  END;

-- ============================================================================
-- RESUMEN
-- ============================================================================

SELECT '=== RESUMEN ===' as info;

/*
✅ PLANES "PRO" ELIMINADOS

RESULTADO:
- Los planes "Pro" han sido eliminados completamente de la base de datos
- Solo quedan los planes: Trial, Básico, Profesional, Empresarial
- Cada plan tiene versión mensual y anual (excepto Trial)

PLANES FINALES:
- Trial (month)
- Básico (month, year)
- Profesional (month, year)
- Empresarial (month, year)

NOTA:
Si necesitas revertir esta acción, tendrás que recrear los planes "Pro"
manualmente usando un script de inserción.
*/

SELECT '=== FIN DEL SCRIPT ===' as info;
