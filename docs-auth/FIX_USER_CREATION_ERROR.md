# Fix: Error "Database error saving new user"

## Problema
Al crear un nuevo usuario aparece el error: "Database error saving new user: relation 'subscriptions' does not exist"

## Causa
La tabla `subscriptions` no existe en la base de datos, pero el trigger `handle_new_user` intenta insertar en ella.

## Solución - PASO A PASO

### PASO 1: Verificar qué tablas existen
Ejecuta este script en Supabase SQL Editor:

```sql
-- Ver todas las tablas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**IMPORTANTE**: Copia y pega aquí el resultado completo antes de continuar.

### PASO 2: Crear las tablas faltantes (SI NO EXISTEN)

Si las tablas `plans` y `subscriptions` NO aparecen en el resultado del PASO 1, ejecuta:

```sql
-- Ejecutar scripts en este orden:
-- 1. scripts/002_create_plans_subscriptions.sql
-- 2. scripts/091_trial_cancellation_simple.sql (para mantener el bloqueo de trial)
```

### PASO 3: Actualizar el trigger handle_new_user

Una vez que las tablas existan, ejecuta el script:
`docs-auth/RESTORE_WORKING_TRIGGER.sql`

## GARANTÍA: Sistema de bloqueo de Trial

El sistema de bloqueo de trial se mantiene intacto porque:

1. ✅ La tabla `trial_used_emails` NO se modifica
2. ✅ Los triggers de `register_trial_usage` y `mark_trial_cancelled` NO se tocan
3. ✅ La función `check_trial_already_used` sigue funcionando
4. ✅ Solo se restaura el trigger `handle_new_user` a su versión original

**El bloqueo de trial seguirá funcionando exactamente igual que antes.**

## Siguiente paso

Por favor ejecuta el PASO 1 y comparte el resultado para confirmar qué tablas existen.
