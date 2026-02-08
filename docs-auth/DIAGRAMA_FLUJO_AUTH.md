# 🔄 Diagrama de Flujo - Sistema de Autenticación

## Flujo 1: Registro de Usuario Nuevo (Sin Invitación)

```
Usuario → /auth/sign-up (sin token)
    ↓
Completa formulario (email, password, nombre, empresa)
    ↓
Supabase Auth crea usuario
    ↓
Trigger: handle_new_user() se ejecuta
    ↓
¿Tiene invite_token? → NO
    ↓
Crea nueva empresa
    ↓
Crea perfil como ADMIN
    ↓
¿Email ya usó Trial? → NO → Crea suscripción Trial
                     → SI → No crea suscripción
    ↓
Usuario recibe email de verificación
    ↓
Usuario verifica email
    ↓
Redirige a /dashboard
    ↓
✅ Usuario activo como ADMIN de su empresa
```

---

## Flujo 2: Invitación de Empleado

```
Admin → Dashboard → Invitaciones
    ↓
Completa formulario (email, rol)
    ↓
Sistema crea registro en tabla invitations
    ↓
Sistema genera token único
    ↓
[MANUAL] Admin copia link: /invite/[TOKEN]
    ↓
[MANUAL] Admin envía link por WhatsApp/Email
    ↓
Empleado recibe link
    ↓
Empleado hace clic en link
    ↓
Sistema verifica token válido
    ↓
Redirige a: /auth/sign-up?token=[TOKEN]&email=[EMAIL]
    ↓
✅ Empleado ve formulario de registro
```


---

## Flujo 3: Registro de Empleado Invitado

```
Empleado → /auth/sign-up?token=[TOKEN]
    ↓
Completa formulario (email, password, nombre)
    ↓
Sistema pasa invite_token en metadatos del usuario
    ↓
Supabase Auth crea usuario
    ↓
Trigger: handle_new_user() se ejecuta
    ↓
¿Tiene invite_token? → SI
    ↓
Busca invitación con token
    ↓
¿Invitación válida? → SI
    ↓
Crea perfil con company_id de la invitación
    ↓
Asigna rol de la invitación (employee/admin)
    ↓
Marca invitación como "accepted"
    ↓
Usuario recibe email de verificación
    ↓
Usuario verifica email
    ↓
Redirige a /dashboard
    ↓
✅ Empleado activo en empresa existente
```

---

## Flujo 4: Cancelación de Trial

```
Usuario → Dashboard → Billing
    ↓
Ve suscripción actual (Trial activo)
    ↓
Hace clic en "Cancelar Suscripción"
    ↓
Confirma en dialog
    ↓
Sistema llama a /api/subscriptions/cancel
    ↓
Verifica que usuario es ADMIN
    ↓
Actualiza status a "cancelled"
    ↓
Trigger: mark_trial_cancelled() se ejecuta
    ↓
Registra email en trial_used_emails
    ↓
Marca trial_cancelled_at = NOW()
    ↓
Usuario pierde acceso inmediatamente
    ↓
SubscriptionGuard bloquea acceso al dashboard
    ↓
Muestra mensaje: "Selecciona un plan de pago"
    ↓
✅ Trial cancelado permanentemente
```
