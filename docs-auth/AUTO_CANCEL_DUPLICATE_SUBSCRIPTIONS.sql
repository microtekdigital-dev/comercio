-- ============================================================================
-- AUTO-CANCELAR SUSCRIPCIONES DUPLICADAS
-- ============================================================================
-- Este trigger permite que se creen suscripciones, pero las cancela
-- automáticamente si ya existe una suscripción cancelada para esa empresa

-- PASO 1: Crear función que auto-cancela duplicados
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_cancel_duplicate_subscriptions()
RETURNS TRIGGER AS $$
DECLARE
  v_cancelled_exists BOOLEAN;
BEGIN
  -- Verificar si ya existe una suscripción cancelada para esta empresa
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE company_id = NEW.company_id
    AND status = 'cancelled'
    AND id != NEW.id
  ) INTO v_cancelled_exists;

  -- Si existe una cancelada y esta es nueva con status active/pending
  IF v_cancelled_exists AND NEW.status IN ('active', 'pending') THEN
    -- Cambiar el status a cancelled inmediatamente
    NEW.status := 'cancelled';
    NEW.cancel_at_period_end := false;
    NEW.current_period_end := NOW();
    
    RAISE NOTICE 'Suscripción auto-cancelada porque ya existe una cancelada. Company: %, New ID: %', 
      NEW.company_id, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 2: Eliminar trigger anterior si existe
-- ============================================================================
DROP TRIGGER IF EXISTS auto_cancel_duplicates ON public.subscriptions;

-- PASO 3: Crear trigger BEFORE INSERT
-- ============================================================================
CREATE TRIGGER auto_cancel_duplicates
  BEFORE INSERT ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_cancel_duplicate_subscriptions();

-- PASO 4: Verificar que se creó
-- ============================================================================
SELECT 
  'Trigger auto_cancel_duplicates creado' as status,
  tgname as trigger_name,
  tgenabled as enabled,
  pg_get_triggerdef(oid) as trigger_def
FROM pg_trigger
WHERE tgname = 'auto_cancel_duplicates';

-- PASO 5: Instrucciones para probar
-- ============================================================================
SELECT '
============================================================================
TRIGGER DE AUTO-CANCELACIÓN ACTIVADO
============================================================================

AHORA PRUEBA:
1. Elimina las suscripciones activas de Plusmar:

   DELETE FROM subscriptions 
   WHERE company_id = ''deaf584c-8964-4ec4-a4f3-a0310aa6e308'' 
   AND status IN (''active'', ''pending'');

2. Refresca /dashboard/billing varias veces

3. Verifica el estado de las suscripciones:

   SELECT id, status, created_at, current_period_end
   FROM subscriptions 
   WHERE company_id = ''deaf584c-8964-4ec4-a4f3-a0310aa6e308''
   ORDER BY created_at DESC;

RESULTADO ESPERADO:
- Se pueden crear nuevas suscripciones
- Pero se auto-cancelan inmediatamente si ya existe una cancelada
- El usuario verá "Sin suscripción activa" en el dashboard

VENTAJA:
- No bloquea la creación (no rompe nada)
- Simplemente cancela los duplicados automáticamente
- El sistema sigue funcionando normalmente

============================================================================
' as instrucciones;
