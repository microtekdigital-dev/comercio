# Sistema de Cancelación de Trial y Prevención de Reuso

## Descripción General

Este sistema previene que usuarios que cancelaron su suscripción Trial gratuita puedan volver a crear una cuenta Trial con el mismo email.

## Componentes del Sistema

### 1. Base de Datos

#### Tabla `trial_used_emails`
Rastrea todos los emails que han utilizado el período Trial.

**Campos:**
- `id`: UUID único
- `email`: Email del usuario (único)
- `company_id`: Referencia a la empresa
- `user_id`: Referencia al usuario
- `trial_started_at`: Fecha de inicio del Trial
- `trial_cancelled_at`: Fecha de cancelación (null si aún activo)
- `reason`: Razón de finalización ('cancelled_by_user', 'expired', 'upgraded')
- `created_at`: Fecha de creación del registro
- `updated_at`: Fecha de última actualización

### 2. Funciones de Base de Datos

#### `register_trial_usage()`
- **Trigger**: Se ejecuta cuando se crea una nueva suscripción
- **Función**: Registra el email cuando un usuario inicia un Trial
- **Comportamiento**: Solo registra si es un plan Trial activo

#### `mark_trial_cancelled()`
- **Trigger**: Se ejecuta cuando se actualiza una suscripción
- **Función**: Marca el Trial como cancelado cuando cambia de 'active' a 'cancelled'
- **Comportamiento**: Actualiza `trial_cancelled_at` y `reason`

#### `check_trial_already_used(p_email TEXT)`
- **Tipo**: Función RPC
- **Función**: Verifica si un email ya usó Trial
- **Retorno**: Boolean (true si ya usó Trial)

#### `handle_new_user()` (Modificada)
- **Función**: Crea usuario, empresa y suscripción Trial
- **Nueva validación**: Verifica si el email ya usó Trial antes de crear la suscripción
- **Comportamiento**: Lanza excepción si el email ya usó Trial

### 3. API y Acciones

#### `cancelSubscription(subscriptionId: string)`
**Ubicación**: `lib/actions/subscriptions.ts`

**Funcionalidad:**
- Verifica que el usuario sea admin
- Verifica que la suscripción pertenezca a la empresa del usuario
- Cambia el estado de la suscripción a 'cancelled'
- Activa el trigger que marca el Trial como usado

**Retorno:**
```typescript
{ success: true } | { error: string }
```

#### `checkTrialAlreadyUsed(email: string)`
**Ubicación**: `lib/actions/subscriptions.ts`

**Funcionalidad:**
- Llama a la función RPC `check_trial_already_used`
- Verifica si un email ya utilizó el período Trial

**Retorno:**
```typescript
boolean
```

#### API Route: `/api/subscriptions/cancel`
**Ubicación**: `app/api/subscriptions/cancel/route.ts`

**Método**: POST

**Body:**
```json
{
  "subscriptionId": "uuid"
}
```

**Respuesta:**
```json
{
  "success": true
}
```
o
```json
{
  "error": "mensaje de error"
}
```

### 4. Componentes UI

#### `CurrentSubscription`
**Ubicación**: `components/dashboard/current-subscription.tsx`

**Nuevas funcionalidades:**
- Botón "Cancelar Suscripción" (solo visible si la suscripción está activa)
- Dialog de confirmación antes de cancelar
- Mensaje de advertencia si la suscripción está programada para cancelarse
- Indicador de estado de cancelación

## Flujo de Trabajo

### Flujo de Registro de Nuevo Usuario

```
1. Usuario se registra con email
   ↓
2. handle_new_user() se ejecuta
   ↓
3. Verifica si email ya usó Trial
   ↓
4a. SI ya usó Trial → Lanza excepción
4b. NO usó Trial → Continúa
   ↓
5. Crea empresa y perfil
   ↓
6. Crea suscripción Trial
   ↓
7. register_trial_usage() registra el email
```

### Flujo de Cancelación de Suscripción

```
1. Usuario admin hace clic en "Cancelar Suscripción"
   ↓
2. Muestra dialog de confirmación
   ↓
3. Usuario confirma
   ↓
4. Llama a /api/subscriptions/cancel
   ↓
5. cancelSubscription() verifica permisos
   ↓
6. Actualiza status a 'cancelled'
   ↓
7. mark_trial_cancelled() registra la cancelación
   ↓
8. Email queda marcado como "ya usó Trial"
```

### Flujo de Intento de Reuso de Trial

```
1. Usuario intenta registrarse con email que ya usó Trial
   ↓
2. handle_new_user() verifica el email
   ↓
3. check_trial_already_used() retorna true
   ↓
4. Se lanza excepción
   ↓
5. Usuario ve mensaje: "Este email ya utilizó el período de prueba gratuito"
```

## Instalación

### 1. Ejecutar Script SQL

```sql
-- Ejecutar en Supabase SQL Editor
-- scripts/090_trial_cancellation_system.sql
```

Este script:
- Crea la tabla `trial_used_emails`
- Crea los triggers necesarios
- Modifica la función `handle_new_user()`
- Configura las políticas RLS

### 2. Verificar Instalación

```sql
-- Verificar que la tabla existe
SELECT * FROM public.trial_used_emails LIMIT 1;

-- Verificar que las funciones existen
SELECT proname FROM pg_proc WHERE proname LIKE '%trial%';
```

## Casos de Uso

### Caso 1: Usuario Nuevo (Primera vez)
- ✅ Puede crear cuenta Trial
- ✅ Email se registra en `trial_used_emails`
- ✅ Tiene 14 días de Trial

### Caso 2: Usuario Cancela Trial
- ✅ Puede cancelar desde `/dashboard/billing`
- ✅ Pierde acceso inmediatamente
- ✅ Email queda marcado como "ya usó Trial"

### Caso 3: Usuario Intenta Reuso
- ❌ No puede crear nueva cuenta Trial
- ❌ Ve mensaje de error
- ✅ Debe seleccionar un plan de pago

### Caso 4: Usuario Actualiza a Plan de Pago
- ✅ Puede actualizar desde Trial a plan de pago
- ✅ Email se marca con reason='upgraded'
- ✅ Mantiene acceso continuo

## Seguridad

### Row Level Security (RLS)
- Solo admins pueden ver la tabla `trial_used_emails`
- Las funciones usan `SECURITY DEFINER` para ejecutarse con privilegios elevados
- Los triggers se ejecutan automáticamente sin intervención del usuario

### Validaciones
- Verificación de rol de admin antes de cancelar
- Verificación de propiedad de la suscripción
- Validación de estado de suscripción

## Mantenimiento

### Consultas Útiles

```sql
-- Ver todos los emails que usaron Trial
SELECT email, trial_started_at, trial_cancelled_at, reason
FROM public.trial_used_emails
ORDER BY created_at DESC;

-- Ver emails que cancelaron Trial
SELECT email, trial_cancelled_at
FROM public.trial_used_emails
WHERE trial_cancelled_at IS NOT NULL;

-- Contar usuarios por razón de finalización
SELECT reason, COUNT(*) as count
FROM public.trial_used_emails
WHERE trial_cancelled_at IS NOT NULL
GROUP BY reason;
```

### Limpieza de Datos (Opcional)

Si necesitas permitir que un email vuelva a usar Trial (caso excepcional):

```sql
-- CUIDADO: Solo usar en casos excepcionales
DELETE FROM public.trial_used_emails
WHERE email = 'usuario@ejemplo.com';
```

## Notas Importantes

1. **Cancelación Inmediata**: Cuando un usuario cancela, pierde acceso inmediatamente (no al final del período)

2. **Sin Vuelta Atrás**: Una vez que un email usa Trial, no puede volver a usarlo (a menos que se elimine manualmente del registro)

3. **Emails Únicos**: El sistema rastrea por email, no por usuario. Si un usuario cambia de email, podría crear una nueva cuenta Trial

4. **Planes de Pago**: Los usuarios que cancelan Trial pueden inmediatamente suscribirse a un plan de pago

## Mejoras Futuras

- [ ] Agregar período de gracia antes de perder acceso
- [ ] Permitir reactivación de Trial en casos especiales
- [ ] Dashboard de administración para ver usuarios que cancelaron
- [ ] Notificaciones por email cuando se cancela Trial
- [ ] Encuesta de salida al cancelar
