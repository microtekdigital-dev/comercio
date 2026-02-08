# Solución al Error "Database error saving new user"

## Problema

El trigger `prevent_multiple_trials` está bloqueando TODAS las inserciones de suscripciones, incluyendo las legítimas para nuevos usuarios y empleados invitados.

## Causa Raíz

El trigger fue diseñado para prevenir que una empresa tenga múltiples suscripciones, pero está bloqueando incluso la PRIMERA suscripción de empresas NUEVAS.

## Solución

**ELIMINAR el trigger `prevent_multiple_trials`** porque:

1. ❌ **No es necesario**: Ya tenemos protección mediante:
   - Tabla `trial_used_emails` que rastrea emails que usaron trial
   - Función `handle_new_user()` que verifica el email antes de crear trial
   - Código en `ensureTrialSubscription()` que verifica suscripciones existentes

2. ❌ **Causa problemas**: Bloquea usuarios legítimos

3. ✅ **La protección real está en**:
   - `handle_new_user()`: Verifica si el email ya usó trial ANTES de crear la suscripción
   - `ensureTrialSubscription()`: Verifica si ya existe una suscripción para la empresa
   - `trial_used_emails`: Tabla que registra permanentemente los emails que usaron trial

## Cómo Funciona la Protección Sin el Trigger

### Para Nuevos Usuarios (Primera vez)
```
1. Usuario se registra con email nuevo
   ↓
2. handle_new_user() verifica en trial_used_emails
   ↓
3. Email NO está registrado → Permite continuar
   ↓
4. Crea empresa nueva
   ↓
5. Crea perfil
   ↓
6. Crea suscripción Trial
   ↓
7. register_trial_usage() registra el email
```

### Para Usuarios que Cancelaron Trial
```
1. Usuario intenta registrarse con email que ya usó trial
   ↓
2. handle_new_user() verifica en trial_used_emails
   ↓
3. Email YA está registrado → BLOQUEA
   ↓
4. Lanza excepción: "Este email ya utilizó el período de prueba gratuito"
```

### Para Usuarios Existentes (Refresco de página)
```
1. Usuario refresca la página
   ↓
2. ensureTrialSubscription() verifica suscripciones existentes
   ↓
3. Ya existe una suscripción (activa o cancelada) → NO crea otra
   ↓
4. Si está cancelada → Retorna null (usuario ve mensaje de upgrade)
```

## Script a Ejecutar

Ejecuta el archivo: `DISABLE_PREVENT_MULTIPLE_TRIALS.sql`

Este script:
- ✅ Elimina el trigger problemático
- ✅ Elimina la función problemática
- ✅ Verifica que se eliminaron correctamente
- ✅ Muestra mensaje de confirmación

## Verificación Post-Ejecución

Después de ejecutar el script, verifica:

```sql
-- Debe retornar 0 filas (trigger eliminado)
SELECT trigger_name
FROM information_schema.triggers
WHERE trigger_name = 'trigger_prevent_multiple_trials';

-- Estos triggers DEBEN seguir existiendo
SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'subscriptions'
ORDER BY trigger_name;
```

Deberías ver solo estos triggers:
- `trigger_mark_trial_cancelled` ✅
- `trigger_register_trial_usage` ✅
- `update_subscriptions_updated_at` ✅

## Pruebas a Realizar

1. **Crear nuevo usuario desde signup**
   - ✅ Debe funcionar sin errores
   - ✅ Debe crear empresa, perfil y suscripción trial

2. **Enviar invitación a empleado**
   - ✅ Debe funcionar sin errores
   - ✅ Empleado debe poder aceptar invitación

3. **Cancelar trial y refrescar**
   - ✅ Trial debe permanecer cancelado
   - ✅ NO debe reactivarse automáticamente
   - ✅ Usuario debe ver mensaje de upgrade

4. **Intentar registrarse con email que ya usó trial**
   - ✅ Debe mostrar error: "Este email ya utilizó el período de prueba gratuito"

## Capas de Protección (Sin el Trigger)

### Capa 1: Base de Datos - handle_new_user()
- Verifica email en `trial_used_emails` ANTES de crear suscripción
- Bloquea si el email ya usó trial
- **Protege contra**: Reuso de trial con mismo email

### Capa 2: Base de Datos - Triggers de Registro
- `register_trial_usage()`: Registra email cuando se crea trial
- `mark_trial_cancelled()`: Marca email cuando se cancela trial
- **Protege contra**: Pérdida de historial de uso

### Capa 3: Aplicación - ensureTrialSubscription()
- Verifica si ya existe suscripción para la empresa
- NO crea nueva si ya existe una (activa o cancelada)
- **Protege contra**: Múltiples suscripciones para misma empresa

### Capa 4: UI - Botón Trial Deshabilitado
- Deshabilita botón trial si `hasUsedTrial` es true
- Muestra mensaje "El trial ya fue utilizado"
- **Protege contra**: Confusión del usuario

## Conclusión

El trigger `prevent_multiple_trials` era redundante y problemático. Las otras capas de protección son suficientes y más robustas porque:

1. ✅ Permiten crear usuarios nuevos legítimos
2. ✅ Bloquean reuso de trial por email
3. ✅ Previenen múltiples suscripciones por empresa
4. ✅ Mantienen historial permanente en `trial_used_emails`
