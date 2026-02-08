# ESTRATEGIA FINAL PARA RESOLVER CREACIÓN AUTOMÁTICA DE SUSCRIPCIONES

## PROBLEMA
Las suscripciones trial se crean automáticamente cada vez que se refresca `/dashboard/billing`, incluso después de cancelarlas.

## EVIDENCIA
- El audit log muestra que las suscripciones son creadas por `authenticator` con privilegios `postgres`
- Esto indica que NO es código TypeScript, sino algo en la base de datos
- El trigger `handle_new_user` actual NO crea suscripciones (verificado)
- El código TypeScript tiene auto-trial DESHABILITADO (verificado)

## HIPÓTESIS
Hay 3 posibles causantes:

### 1. Trigger oculto o función de base de datos
- Puede haber un trigger BEFORE/AFTER SELECT en subscriptions
- Puede haber una función que se ejecuta al consultar subscriptions
- Puede haber un trigger en otra tabla que crea subscriptions

### 2. Edge Function de Supabase
- Puede haber una Edge Function configurada en el dashboard de Supabase
- Esta función podría ejecutarse en ciertos eventos

### 3. Política RLS con side effects
- Aunque es raro, una política RLS mal configurada podría tener side effects

## PLAN DE ACCIÓN

### PASO 1: Ejecutar diagnóstico completo
```sql
-- Ejecuta este archivo:
docs-auth/FIND_ALL_SUBSCRIPTION_TRIGGERS.sql
```

Esto te mostrará:
- Todos los triggers en la tabla subscriptions
- Todas las funciones que mencionan subscriptions
- Todas las políticas RLS

### PASO 2: Deshabilitar temporalmente el trigger handle_new_user
```sql
-- Ejecuta este archivo:
docs-auth/DISABLE_HANDLE_NEW_USER_TEMPORARILY.sql
```

Luego:
1. Elimina las suscripciones activas
2. Refresca /dashboard/billing
3. Si NO se crean suscripciones → el problema está en handle_new_user
4. Si SE SIGUEN creando → el problema está en otro lugar

### PASO 3: Si el problema persiste, activar bloqueo de emergencia
```sql
-- Ejecuta este archivo:
docs-auth/EMERGENCY_DISABLE_AUTO_SUBSCRIPTIONS.sql
```

Este script:
- Actualiza handle_new_user para que NO cree suscripciones
- Crea un trigger que BLOQUEA cualquier INSERT a subscriptions que no venga de un pago aprobado
- Si algo intenta crear una suscripción, verás un ERROR en los logs

### PASO 4: Verificar Edge Functions en Supabase
1. Ve al dashboard de Supabase
2. Navega a: Edge Functions
3. Verifica si hay alguna función relacionada con subscriptions
4. Si existe, desactívala temporalmente

### PASO 5: Verificar Webhooks en Supabase
1. Ve al dashboard de Supabase
2. Navega a: Database → Webhooks
3. Verifica si hay webhooks configurados
4. Si existe alguno relacionado con subscriptions, desactívalo

## SOLUCIÓN TEMPORAL (MIENTRAS INVESTIGAMOS)

Si necesitas que el sistema funcione YA, puedes:

1. **Opción A: Bloquear creación automática**
   - Ejecuta `EMERGENCY_DISABLE_AUTO_SUBSCRIPTIONS.sql`
   - Las suscripciones solo se crearán con pagos aprobados
   - Los nuevos usuarios NO tendrán trial automático

2. **Opción B: Auto-cancelar duplicados**
   - Crear un trigger que auto-cancele suscripciones duplicadas
   - Permitir que se creen, pero cancelarlas inmediatamente si ya existe una cancelada

## SIGUIENTE PASO RECOMENDADO

**Ejecuta primero:** `docs-auth/FIND_ALL_SUBSCRIPTION_TRIGGERS.sql`

Esto nos dará información completa sobre qué está tocando la tabla subscriptions.

Luego comparte los resultados y decidimos el siguiente paso.
