-- Deshabilitar temporalmente los triggers en subscriptions para diagnóstico

-- Ver el estado actual de los triggers
SELECT 
  '=== ESTADO ACTUAL ===' as seccion,
  tgname as trigger_name,
  tgenabled as enabled,
  CASE tgenabled
    WHEN 'O' THEN 'Habilitado'
    WHEN 'D' THEN 'Deshabilitado'
    ELSE 'Otro'
  END as estado
FROM pg_trigger
WHERE tgrelid = 'public.subscriptions'::regclass
AND tgname LIKE 'trigger_%'
ORDER BY tgname;

-- Deshabilitar trigger_register_trial_usage
ALTER TABLE public.subscriptions 
DISABLE TRIGGER trigger_register_trial_usage;

-- Deshabilitar trigger_mark_trial_cancelled
ALTER TABLE public.subscriptions 
DISABLE TRIGGER trigger_mark_trial_cancelled;

-- Ver el estado después de deshabilitar
SELECT 
  '=== DESPUÉS DE DESHABILITAR ===' as seccion,
  tgname as trigger_name,
  tgenabled as enabled,
  CASE tgenabled
    WHEN 'O' THEN 'Habilitado'
    WHEN 'D' THEN 'Deshabilitado'
    ELSE 'Otro'
  END as estado
FROM pg_trigger
WHERE tgrelid = 'public.subscriptions'::regclass
AND tgname LIKE 'trigger_%'
ORDER BY tgname;

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'TRIGGERS DESHABILITADOS';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Los triggers han sido deshabilitados temporalmente';
  RAISE NOTICE 'Ahora prueba:';
  RAISE NOTICE '1. Cancela el plan en billing';
  RAISE NOTICE '2. Refresca la página';
  RAISE NOTICE '3. Verifica si el trial se reactiva';
  RAISE NOTICE '';
  RAISE NOTICE 'Si NO se reactiva:';
  RAISE NOTICE '→ El problema está en estos triggers';
  RAISE NOTICE '';
  RAISE NOTICE 'Si SÍ se reactiva:';
  RAISE NOTICE '→ El problema está en otro lugar';
  RAISE NOTICE '';
  RAISE NOTICE 'Para REACTIVAR los triggers:';
  RAISE NOTICE 'ALTER TABLE public.subscriptions ENABLE TRIGGER trigger_register_trial_usage;';
  RAISE NOTICE 'ALTER TABLE public.subscriptions ENABLE TRIGGER trigger_mark_trial_cancelled;';
END $$;
