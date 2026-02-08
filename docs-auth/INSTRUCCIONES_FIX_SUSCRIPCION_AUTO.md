# Instrucciones para Arreglar Suscripciones Automáticas

## Problema
Las suscripciones se están recreando automáticamente cuando no deberían. Esto ocurre porque el trigger `handle_new_user` está creando suscripciones incluso para empresas que ya existen.

## Causa Raíz
El script `FIX_HANDLE_NEW_USER_WITH_INVITATION.sql` que se ejecutó anteriormente configuró el trigger para crear suscripciones en TODOS los casos, incluso para usuarios invitados que se unen a empresas existentes.

## Evidencia
- Suscripción ID: `6e665a3a-189c-4bd1-9467-7cc667c75675`
- Creada: 2026-02-08 14:13:50
- Empresa: Plusmar (deaf584c-8964-4ec4-a4f3-a0310aa6e308)
- Estado: active
- Esta suscripción se creó automáticamente cuando NO debería

## Solución

### PASO 1: Actualizar el Trigger (CRÍTICO)
Ejecuta el script `FIX_TRIGGER_NO_RECREATE_SUBSCRIPTION.sql` en el SQL Editor de Supabase.

**Este script:**
- ✅ Crea suscripciones SOLO para empresas NUEVAS
- ✅ NO crea suscripciones para usuarios invitados
- ✅ NO recrea suscripciones en empresas existentes
- ✅ Usa la sintaxis correcta `$$` para PostgreSQL

**Cómo ejecutar:**
1. Abre Supabase Dashboard
2. Ve a SQL Editor
3. Copia y pega el contenido de `FIX_TRIGGER_NO_RECREATE_SUBSCRIPTION.sql`
4. Haz clic en "Run"
5. Verifica que aparezcan los mensajes de confirmación

### PASO 2: Eliminar la Suscripción Automática
Ejecuta el script `DELETE_AUTO_SUBSCRIPTION.sql` en el SQL Editor de Supabase.

**Este script:**
- Verifica la suscripción antes de eliminar
- Elimina la suscripción automática
- Confirma que se eliminó correctamente

**Cómo ejecutar:**
1. En el mismo SQL Editor
2. Copia y pega el contenido de `DELETE_AUTO_SUBSCRIPTION.sql`
3. Haz clic en "Run"
4. Verifica que el total de suscripciones sea 0

### PASO 3: Verificar que Funciona
Ejecuta el script `DEBUG_MULTIPLE_SUBSCRIPTIONS.sql` para verificar:

```sql
-- Debe mostrar 0 suscripciones para Plusmar
SELECT * FROM subscriptions 
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308';
```

## Comportamiento Esperado Después del Fix

### Usuario Invitado (Empleado)
- Se une a la empresa existente
- NO se crea ninguna suscripción
- Usa la suscripción de la empresa (si existe)

### Usuario Nuevo (Admin)
- Se crea una nueva empresa
- Se crea suscripción Trial SOLO si:
  - Es una empresa NUEVA
  - El email NO ha usado trial antes
  - Existe el plan Trial en la base de datos

### Empresa Existente
- NO se toca la suscripción existente
- NO se recrea si fue cancelada
- El admin debe comprar un plan nuevo manualmente

## Estado del Código

### ✅ Correcto
- `lib/actions/plans.ts` - AUTO-TRIAL DESHABILITADO
- `app/dashboard/layout.tsx` - Sin SubscriptionGuard (como solicitaste)

### ⚠️ Requiere Actualización
- Trigger `handle_new_user` en Supabase (ejecutar PASO 1)

## Archivos Relacionados

### Scripts SQL
- `FIX_TRIGGER_NO_RECREATE_SUBSCRIPTION.sql` - Actualiza el trigger (EJECUTAR PRIMERO)
- `DELETE_AUTO_SUBSCRIPTION.sql` - Elimina la suscripción automática (EJECUTAR SEGUNDO)
- `DEBUG_MULTIPLE_SUBSCRIPTIONS.sql` - Verifica el estado
- `VERIFICAR_SUSCRIPCIONES.sql` - Diagnóstico completo

### Código TypeScript
- `lib/actions/plans.ts` - Lógica de suscripciones (ya corregido)
- `app/dashboard/layout.tsx` - Layout del dashboard (ya corregido)

## Notas Importantes

1. **Orden de Ejecución**: Ejecuta PRIMERO el trigger, DESPUÉS elimina la suscripción
2. **Sintaxis SQL**: El script usa `$$` (correcto) en lugar de `$` (incorrecto)
3. **Sin Bloqueo**: Como solicitaste, el sistema NO bloquea el acceso cuando no hay suscripción
4. **Trial Único**: El sistema previene que un email use trial múltiples veces

## Próximos Pasos

Después de ejecutar los scripts:
1. Verifica que no haya suscripciones para Plusmar
2. Prueba crear un nuevo usuario (debe crear empresa + trial)
3. Prueba invitar un empleado (NO debe crear suscripción)
4. Confirma que las suscripciones NO se recrean automáticamente

## Contacto

Si tienes problemas ejecutando los scripts o el comportamiento no es el esperado, avísame con:
- El mensaje de error exacto
- El resultado de `DEBUG_MULTIPLE_SUBSCRIPTIONS.sql`
- El comportamiento observado vs. esperado
