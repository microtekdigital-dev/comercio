-- Fix para el problema de bloqueo de Microtek
-- Problema: Tiene 2 suscripciones (1 cancelada, 1 activa) y el sistema está tomando la cancelada

-- PASO 1: Eliminar la suscripción cancelada duplicada
DELETE FROM subscriptions 
WHERE id = 'f62f1b88-f4f0-4abe-bb97-cebe5e8675bb'
AND company_id = '6a5790b5-339b-4ab1-acf9-5df20c1421cd'
AND status = 'cancelled';

-- PASO 2: Verificar que solo quede la suscripción activa
SELECT 
  id,
  status,
  current_period_end,
  TO_CHAR(current_period_end AT TIME ZONE 'America/Argentina/Buenos_Aires', 'DD/MM/YYYY HH24:MI:SS') as vence_el,
  CASE 
    WHEN current_period_end < NOW() THEN 'VENCIDO ❌'
    ELSE 'ACTIVO ✅'
  END as estado
FROM subscriptions
WHERE company_id = '6a5790b5-339b-4ab1-acf9-5df20c1421cd'
ORDER BY created_at DESC;
