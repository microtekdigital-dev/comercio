# Notificaciones de Trials - DESHABILITADAS

## Problema Encontrado

Al intentar crear suscripciones, se produce el siguiente error:

```
ERROR: 3F000: schema "net" does not exist
QUERY: SELECT net.http_post(...)
CONTEXT: PL/pgSQL function notify_new_trial() line 24 at PERFORM
```

## Causa

El trigger `notify_new_trial_trigger` intenta usar la función `net.http_post` de la extensión `http` de Supabase, pero:

1. La extensión `http` no está habilitada en tu instancia de Supabase
2. La extensión `http` solo está disponible en el plan Pro de Supabase
3. En el plan Free, no se puede usar `net.http_post`

## Solución Inmediata

**Deshabilitar el trigger problemático:**

```sql
-- Ejecutar en Supabase SQL Editor
-- Archivo: docs-auth/DISABLE_NOTIFY_TRIAL_TRIGGER.sql

-- Eliminar el trigger
DROP TRIGGER IF EXISTS notify_new_trial_trigger ON subscriptions;
DROP TRIGGER IF EXISTS on_trial_created ON subscriptions;

-- Eliminar la función
DROP FUNCTION IF EXISTS notify_new_trial();

-- Verificar que se eliminó
SELECT trigger_name
FROM information_schema.triggers
WHERE trigger_name IN ('notify_new_trial_trigger', 'on_trial_created');
-- Debe devolver 0 filas
```

## Estado de Notificaciones

### ✅ Notificaciones de Pagos (FUNCIONANDO)
- Cuando un usuario paga a través de MercadoPago
- Se envía notificación al email `ADMIN_NOTIFICATION_EMAIL`
- Implementado en: `app/api/mercadopago/webhook/route.ts`
- **NO requiere extensión http de Supabase**
- **Estado**: ✅ Funcionando correctamente

### ❌ Notificaciones de Trials (DESHABILITADO)
- Cuando un usuario se registra con trial gratuito
- **Estado**: ❌ Deshabilitado por error de extensión
- **Causa**: Extensión http no disponible en plan Free
- **Impacto**: No recibirás notificaciones de nuevos registros

## Alternativas para Notificaciones de Trials

### Opción 1: Actualizar a Supabase Pro (Recomendado si necesitas notificaciones)
- Costo: ~$25/mes
- Habilita la extensión http
- Permite usar el trigger tal como está diseñado

### Opción 2: Usar Supabase Webhooks (Gratis)
- Configurar webhook en Supabase Dashboard
- Webhook llama a tu API cuando se crea una suscripción
- No requiere extensión http
- Requiere configuración manual en Supabase

### Opción 3: Implementar en el Código (Gratis)
- Modificar el trigger `handle_new_user` en Supabase
- Agregar lógica para llamar a tu API directamente
- Más complejo pero no requiere extensión http

### Opción 4: Revisar Manualmente (Gratis)
- Revisar periódicamente la tabla `subscriptions` en Supabase
- Ver nuevos registros con `status = 'active'` y `price = 0`
- No requiere cambios técnicos

### Opción 5: No Hacer Nada (Gratis)
- Las notificaciones de pagos siguen funcionando
- Solo pierdes notificaciones de trials gratuitos
- Puedes ver los trials en el dashboard de Supabase

## Recomendación

Para tu caso, recomiendo **Opción 5 (No hacer nada)** porque:

1. Las notificaciones de **pagos** (lo más importante) siguen funcionando
2. Los trials gratuitos no generan ingresos, son solo pruebas
3. Puedes ver los nuevos registros en Supabase cuando quieras
4. Evitas costos adicionales del plan Pro
5. El sistema funciona perfectamente sin estas notificaciones

## Archivos Modificados

1. `scripts/092_notify_new_trials.sql` - Marcado como DESHABILITADO
2. `docs-auth/DISABLE_NOTIFY_TRIAL_TRIGGER.sql` - Script para eliminar trigger
3. `docs-auth/NOTIFICACIONES_TRIAL_DESHABILITADAS.md` - Este documento

## Próximos Pasos

1. **Ejecutar script de deshabilitación**: `DISABLE_NOTIFY_TRIAL_TRIGGER.sql`
2. **Verificar que se eliminó el trigger**
3. **Continuar con el fix de las cuentas**: vanithegameplay y vanitoadette
4. **Las notificaciones de pagos siguen funcionando normalmente**

## Impacto en el Sistema

- ✅ **NO afecta** la creación de trials
- ✅ **NO afecta** la lógica de bloqueos
- ✅ **NO afecta** las notificaciones de pagos
- ✅ **NO afecta** el funcionamiento del sistema
- ❌ Solo pierdes notificaciones de nuevos registros gratuitos
