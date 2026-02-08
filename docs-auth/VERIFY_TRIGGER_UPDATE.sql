-- Script para verificar si el trigger handle_new_user se actualizó correctamente

-- ============================================================================
-- VERIFICAR EL CÓDIGO DEL TRIGGER ACTUAL
-- ============================================================================
SELECT 
  proname as nombre_funcion,
  prosrc as codigo_funcion
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ============================================================================
-- BUSCAR LA LÍNEA CLAVE: v_is_new_company
-- ============================================================================
-- Si el trigger está actualizado, debe contener:
-- 1. "v_is_new_company BOOLEAN := FALSE;"
-- 2. "IF v_is_new_company THEN"
-- 3. "ELSE RAISE NOTICE 'Empresa existente, NO se crea suscripción'"

-- ============================================================================
-- INSTRUCCIONES
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'VERIFICACIÓN DEL TRIGGER';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Revisa el código arriba y busca:';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Debe tener: v_is_new_company BOOLEAN := FALSE;';
  RAISE NOTICE '✓ Debe tener: v_is_new_company := TRUE;';
  RAISE NOTICE '✓ Debe tener: IF v_is_new_company THEN';
  RAISE NOTICE '✓ Debe tener: ELSE RAISE NOTICE ''Empresa existente''';
  RAISE NOTICE '';
  RAISE NOTICE 'Si NO tiene estas líneas:';
  RAISE NOTICE '→ El trigger NO se actualizó correctamente';
  RAISE NOTICE '→ Ejecuta FIX_TRIGGER_NO_RECREATE_SUBSCRIPTION.sql de nuevo';
  RAISE NOTICE '';
  RAISE NOTICE 'Si SÍ tiene estas líneas:';
  RAISE NOTICE '→ El trigger está correcto';
  RAISE NOTICE '→ El problema está en otro lugar';
END $$;
