-- =====================================================
-- DESHABILITAR TRIGGER TEMPORALMENTE
-- Para permitir creación de usuarios mientras diagnosticamos
-- =====================================================

SELECT '=== DESHABILITANDO TRIGGER ===' as info;

-- Deshabilitar el trigger
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

SELECT 'Trigger deshabilitado temporalmente' as resultado;

SELECT '=== IMPORTANTE ===' as info;

/*
⚠️ ATENCIÓN:

El trigger está DESHABILITADO. Esto significa que:

1. Los usuarios PUEDEN registrarse
2. Pero NO se crearán automáticamente:
   - La empresa (company)
   - El perfil (profile)
   - La suscripción (subscription)

DEBES crear estos manualmente después de que el usuario se registre.

Para REACTIVAR el trigger más tarde:
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

*/

SELECT '=== FIN ===' as info;
