-- ============================================================================
-- DESHABILITAR TEMPORALMENTE EL TRIGGER handle_new_user
-- ============================================================================
-- Este script deshabilita el trigger para probar si es el causante

-- PASO 1: Deshabilitar el trigger
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

SELECT 'Trigger on_auth_user_created DESHABILITADO' as status;

-- PASO 2: Instrucciones
-- ============================================================================
SELECT '
============================================================================
TRIGGER DESHABILITADO
============================================================================

AHORA PRUEBA:
1. Elimina las suscripciones activas de Plusmar:

   DELETE FROM subscriptions 
   WHERE company_id = ''deaf584c-8964-4ec4-a4f3-a0310aa6e308'' 
   AND status IN (''active'', ''pending'');

2. Refresca /dashboard/billing varias veces

3. Verifica si se crean nuevas suscripciones:

   SELECT id, status, created_at 
   FROM subscriptions 
   WHERE company_id = ''deaf584c-8964-4ec4-a4f3-a0310aa6e308''
   ORDER BY created_at DESC;

SI NO SE CREAN SUSCRIPCIONES:
- El problema está en el trigger handle_new_user
- Necesitamos actualizar ese trigger

SI SE SIGUEN CREANDO SUSCRIPCIONES:
- El problema está en otro lugar (Edge Function, otro trigger, etc.)
- Necesitamos investigar más

============================================================================
' as instrucciones;

-- PASO 3: Para REACTIVAR el trigger después de la prueba
-- ============================================================================
SELECT '
Para REACTIVAR el trigger después de la prueba, ejecuta:

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

' as reactivar_trigger;
