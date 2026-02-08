# Instrucciones Finales - Sistema de Autenticación e Invitaciones

## Estado Actual del Sistema

Tu sistema de autenticación está **casi completo**. Hay 2 scripts SQL que debes ejecutar para finalizar la implementación.

## ✅ Lo que YA está funcionando

1. **Cancelación de Trial**: Los usuarios que cancelan su trial no pueden volver a usarlo ✓
2. **Registro de usuarios nuevos**: Funciona correctamente ✓
3. **Protección contra reactivación**: El sistema previene la creación automática de trials después de cancelar ✓
4. **UI de cancelación**: Botón de cancelar suscripción implementado ✓
5. **Redirección a billing**: Los usuarios sin suscripción son redirigidos a la página de planes ✓

## ⚠️ Lo que FALTA (Requiere acción)

### Problema Actual
Cuando un empleado acepta una invitación y se registra:
- ❌ Se crea como **admin de una nueva empresa** (incorrecto)
- ❌ O no se crea su perfil (queda sin acceso)

### Solución
Ejecutar 2 scripts SQL en Supabase.

---

## 📋 PASO 1: Actualizar el Trigger de Invitaciones

Este script actualiza la función `handle_new_user()` para que detecte si el usuario tiene un token de invitación y lo una a la empresa correcta con el rol correcto.

### Instrucciones:

1. Abre **Supabase Dashboard**
2. Ve a **SQL Editor**
3. Crea una nueva query
4. Copia y pega el contenido del archivo: **`FIX_HANDLE_NEW_USER_WITH_INVITATION.sql`**
5. Haz clic en **Run**

### ¿Qué hace este script?

- Modifica el trigger `handle_new_user()` para verificar si hay un `invite_token` en los metadatos del usuario
- Si hay token válido → Une al usuario a la empresa existente con el rol de la invitación (employee/admin)
- Si NO hay token → Crea nueva empresa como admin (comportamiento normal)
- Marca la invitación como "accepted" automáticamente

### Resultado esperado:

```
==============================================
Función handle_new_user ACTUALIZADA
==============================================

Cambios realizados:
1. Verifica si el usuario tiene invite_token
2. Si tiene token válido → Une a empresa existente con rol correcto
3. Si NO tiene token → Crea nueva empresa como admin
4. Marca la invitación como aceptada

Comportamiento:
- Usuario invitado → Se une como employee/admin según invitación ✓
- Usuario nuevo → Crea empresa + trial ✓
```

---

## 📋 PASO 2: Arreglar el Empleado Actual Sin Perfil

Este script arregla al empleado `asesorvaniyt@gmail.com` que se registró pero no tiene perfil.

### Instrucciones:

1. En **Supabase SQL Editor**
2. Crea una nueva query
3. Copia y pega el contenido del archivo: **`FIX_EMPLOYEE_NO_PROFILE.sql`**
4. **IMPORTANTE**: Verifica que el email en el script sea `asesorvaniyt@gmail.com`
5. Haz clic en **Run**

### ¿Qué hace este script?

- Busca al usuario por email
- Encuentra su invitación pendiente
- Crea su perfil con el rol correcto (employee)
- Lo une a la empresa correcta
- Marca la invitación como "accepted"

### Resultado esperado:

```
==============================================
Empleado reparado exitosamente!
Email: asesorvaniyt@gmail.com
Rol: employee
Empresa: [ID de la empresa]
Ahora puede hacer login correctamente
==============================================
```

Luego verás una tabla mostrando:
- email: asesorvaniyt@gmail.com
- profile_id: [UUID]
- company_id: [UUID]
- role: employee
- company_name: [Nombre de tu empresa]
- subscription_status: active
- invitation_status: accepted

---

## 🧪 PASO 3: Verificar que Todo Funciona

### Prueba 1: Empleado Actual
1. El usuario `asesorvaniyt@gmail.com` debe poder hacer login
2. Debe ver el dashboard de la empresa
3. Debe aparecer como "employee" (no admin)
4. Debe compartir la suscripción de la empresa

### Prueba 2: Nueva Invitación
1. Desde tu cuenta admin, envía una nueva invitación a otro email
2. Copia el link de invitación desde la base de datos:
   ```sql
   SELECT token, email, role 
   FROM invitations 
   WHERE status = 'pending' 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
3. El link será: `https://tu-dominio.com/invite/[TOKEN]`
4. Abre el link en modo incógnito
5. Completa el registro
6. Verifica que el nuevo usuario:
   - Se une a tu empresa (no crea una nueva)
   - Tiene el rol correcto (employee)
   - Puede acceder al dashboard
   - Comparte tu suscripción

### Prueba 3: Usuario Nuevo (Sin Invitación)
1. Abre modo incógnito
2. Ve a `/auth/sign-up` (sin token)
3. Regístrate con un email nuevo
4. Verifica que:
   - Se crea una nueva empresa
   - El usuario es admin
   - Se crea una suscripción Trial (si el email no la usó antes)

---

## 🔍 Consultas Útiles para Debugging

### Ver estado de un usuario:
```sql
SELECT 
  u.email,
  u.email_confirmed_at,
  p.id as profile_id,
  p.company_id,
  p.role,
  c.name as company_name,
  s.status as subscription_status,
  pl.name as plan_name,
  i.status as invitation_status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.companies c ON c.id = p.company_id
LEFT JOIN public.subscriptions s ON s.company_id = c.id AND s.status = 'active'
LEFT JOIN public.plans pl ON pl.id = s.plan_id
LEFT JOIN public.invitations i ON i.email = u.email
WHERE u.email = 'EMAIL_AQUI'
ORDER BY i.created_at DESC
LIMIT 1;
```

### Ver todas las invitaciones:
```sql
SELECT 
  i.email,
  i.role,
  i.status,
  i.token,
  i.created_at,
  i.expires_at,
  c.name as company_name
FROM invitations i
JOIN companies c ON c.id = i.company_id
ORDER BY i.created_at DESC;
```

### Ver empleados de una empresa:
```sql
SELECT 
  p.email,
  p.full_name,
  p.role,
  c.name as company_name
FROM profiles p
JOIN companies c ON c.id = p.company_id
WHERE c.id = 'TU_COMPANY_ID'
ORDER BY p.created_at;
```

---

## 📧 Sistema de Emails (Pendiente)

### Estado Actual
- ✅ Supabase envía emails de verificación para nuevos usuarios
- ❌ NO se envían emails automáticos para invitaciones de empleados

### Workaround Actual
Debes copiar manualmente el link de invitación y enviarlo por WhatsApp/Email:

```sql
-- Obtener el último link de invitación
SELECT 
  CONCAT('https://tu-dominio.com/invite/', token) as invitation_link,
  email,
  role
FROM invitations 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 1;
```

### Solución Futura (Opcional)
Para implementar envío automático de emails:

1. **Opción A: Resend** (Recomendado)
   - Gratis hasta 3,000 emails/mes
   - Fácil integración
   - Buena reputación

2. **Opción B: SendGrid**
   - Gratis hasta 100 emails/día
   - Más complejo

3. **Opción C: Supabase Auth Invitations**
   - Usar el sistema nativo de Supabase
   - Requiere cambiar la arquitectura actual

**Archivo a modificar**: `lib/actions/invitations.ts` (línea 73)

---

## ✅ Checklist Final

Antes de considerar el sistema completo, verifica:

- [ ] Ejecutaste `FIX_HANDLE_NEW_USER_WITH_INVITATION.sql`
- [ ] Ejecutaste `FIX_EMPLOYEE_NO_PROFILE.sql`
- [ ] El empleado `asesorvaniyt@gmail.com` puede hacer login
- [ ] Probaste enviar una nueva invitación
- [ ] El nuevo empleado se une correctamente a la empresa
- [ ] Los usuarios nuevos (sin invitación) crean su propia empresa
- [ ] La cancelación de Trial funciona correctamente
- [ ] Los usuarios que cancelan Trial no pueden reactivarlo

---

## 🚨 Si Algo Sale Mal

### Error: "Database error saving new user"
- Verifica que ejecutaste `FIX_HANDLE_NEW_USER_WITH_INVITATION.sql`
- Verifica que el trigger no tiene errores de sintaxis

### Error: Usuario se crea como admin en vez de employee
- Verifica que el `invite_token` se está pasando correctamente en el signup
- Revisa el archivo `app/auth/sign-up/page.tsx` línea 48-52

### Error: Usuario sin perfil después de registrarse
- Ejecuta `FIX_EMPLOYEE_NO_PROFILE.sql` con el email del usuario
- Verifica que la invitación existe y está pendiente

### Para debugging completo:
```sql
-- Ver logs del trigger
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%handle_new_user%' 
ORDER BY calls DESC;
```

---

## 📞 Próximos Pasos Recomendados

1. **Implementar envío de emails** para invitaciones
2. **Agregar notificaciones** cuando un empleado acepta una invitación
3. **Dashboard de administración** para ver todos los empleados
4. **Permisos granulares** por rol (employee vs admin)
5. **Auditoría** de acciones de usuarios

---

## 📝 Documentación Relacionada

- `TRIAL_CANCELLATION_SYSTEM.md` - Sistema completo de cancelación de Trial
- `FIX_INVITATION_URL.md` - Configuración de URLs en Supabase
- `DELETE_USER_COMPLETE.sql` - Script para eliminar usuarios de prueba
- `DEBUG_EMPLOYEE_STATUS.sql` - Query para verificar estado de empleados

---

**Última actualización**: 8 de febrero de 2026
**Estado**: Sistema listo para producción después de ejecutar los 2 scripts SQL
