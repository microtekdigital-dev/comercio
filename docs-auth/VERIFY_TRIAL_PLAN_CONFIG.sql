-- ============================================================================
-- VERIFICAR CONFIGURACIÓN DEL PLAN TRIAL
-- ============================================================================
-- Este script verifica que el plan Trial esté correctamente configurado
-- para que el trigger de creación de usuarios funcione

-- 1. Ver TODOS los planes activos
SELECT 
  id,
  name,
  price,
  interval,
  interval_count,
  is_active,
  sort_order,
  CASE 
    WHEN name = 'Trial' AND interval = 'month' AND is_active = true THEN '✅ CORRECTO'
    WHEN price = 0 AND is_active = true THEN '⚠️ Es trial pero nombre/intervalo incorrecto'
    ELSE '❌ NO ES TRIAL'
  END as trigger_compatibility
FROM plans
ORDER BY sort_order;

-- 2. Verificar si existe el plan que busca el trigger
SELECT 
  id,
  name,
  price,
  interval,
  interval_count,
  is_active,
  '✅ Este plan será usado por el trigger' as status
FROM plans
WHERE name = 'Trial' 
  AND interval = 'month' 
  AND is_active = true
LIMIT 1;

-- 3. Si no existe, mostrar planes que podrían ser trial
SELECT 
  id,
  name,
  price,
  interval,
  interval_count,
  is_active,
  CASE 
    WHEN price = 0 THEN '💡 Este parece ser el trial (precio = 0)'
    WHEN name ILIKE '%trial%' THEN '💡 Este tiene "trial" en el nombre'
    ELSE 'Otro plan'
  END as suggestion
FROM plans
WHERE is_active = true
  AND (price = 0 OR name ILIKE '%trial%')
ORDER BY price, sort_order;

-- ============================================================================
-- INTERPRETACIÓN:
-- ============================================================================
-- 
-- Query 1: Muestra todos los planes y si son compatibles con el trigger
-- Query 2: Muestra el plan exacto que el trigger buscará
-- Query 3: Muestra planes alternativos que podrían ser el trial
--
-- PROBLEMA COMÚN:
-- Si Query 2 no devuelve resultados, el trigger NO creará suscripciones
-- automáticamente para nuevos usuarios.
--
-- SOLUCIÓN:
-- Ejecutar el script FIX_TRIAL_PLAN_NAME.sql para corregir el nombre/intervalo
-- del plan trial.
--
-- ============================================================================
