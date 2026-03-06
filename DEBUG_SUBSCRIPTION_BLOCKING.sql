-- Script de diagnóstico para verificar el bloqueo de suscripción
-- Ejecutar en Supabase SQL Editor

-- 1. Ver tu suscripción actual con fechas
SELECT 
  s.id,
  s.company_id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  s.created_at,
  p.name as plan_name,
  p.price,
  -- Calcular días restantes
  CASE 
    WHEN s.current_period_end IS NOT NULL THEN
      EXTRACT(DAY FROM (s.current_period_end::timestamp - NOW()))
    ELSE NULL
  END as days_remaining,
  -- Verificar si está vencido
  CASE 
    WHEN s.current_period_end IS NOT NULL AND s.current_period_end < NOW() THEN 'VENCIDO'
    WHEN s.current_period_end IS NOT NULL AND s.current_period_end >= NOW() THEN 'ACTIVO'
    ELSE 'SIN FECHA'
  END as expiry_status,
  -- Mostrar fecha actual del servidor
  NOW() as server_time,
  -- Mostrar diferencia en horas
  CASE 
    WHEN s.current_period_end IS NOT NULL THEN
      EXTRACT(EPOCH FROM (s.current_period_end::timestamp - NOW())) / 3600
    ELSE NULL
  END as hours_remaining
FROM subscriptions s
LEFT JOIN plans p ON s.plan_id = p.id
WHERE s.status IN ('active', 'pending')
ORDER BY s.created_at DESC
LIMIT 5;

-- 2. Ver todas las suscripciones de tu empresa (reemplaza con tu company_id)
-- SELECT 
--   s.*,
--   p.name as plan_name
-- FROM subscriptions s
-- LEFT JOIN plans p ON s.plan_id = p.id
-- WHERE s.company_id = 'TU_COMPANY_ID_AQUI'
-- ORDER BY s.created_at DESC;
