# ✅ Checklist de Implementación - Sistema de Autenticación

## 📅 Fecha: 8 de Febrero de 2026

---

## 🎯 Objetivo

Completar la implementación del sistema de autenticación e invitaciones ejecutando 2 scripts SQL pendientes.

---

## 📝 Checklist de Ejecución

### Fase 1: Preparación

- [ ] Abrir Supabase Dashboard
- [ ] Navegar a SQL Editor
- [ ] Tener abiertos los archivos:
  - `FIX_HANDLE_NEW_USER_WITH_INVITATION.sql`
  - `FIX_EMPLOYEE_NO_PROFILE.sql`

---

### Fase 2: Script 1 - Actualizar Trigger

- [ ] **Abrir** `FIX_HANDLE_NEW_USER_WITH_INVITATION.sql`
- [ ] **Copiar** todo el contenido del archivo
- [ ] **Pegar** en Supabase SQL Editor
- [ ] **Ejecutar** (botón Run)
- [ ] **Verificar** mensaje de éxito:
  ```
  Función handle_new_user ACTUALIZADA
  - Usuario invitado → Se une como employee/admin según invitación ✓
  - Usuario nuevo → Crea empresa + trial ✓
  ```

**Estado**: ⬜ Pendiente | ✅ Completado | ❌ Error

**Notas**:
```
[Espacio para notas sobre la ejecución]
```

---

### Fase 3: Script 2 - Arreglar Empleado

- [ ] **Abrir** `FIX_EMPLOYEE_NO_PROFILE.sql`
- [ ] **Verificar** que el email sea: `asesorvaniyt@gmail.com`
- [ ] **Copiar** todo el contenido del archivo
- [ ] **Pegar** en Supabase SQL Editor
- [ ] **Ejecutar** (botón Run)
- [ ] **Verificar** mensaje de éxito:
  ```
  Empleado reparado exitosamente!
  Email: asesorvaniyt@gmail.com
  Rol: employee
  ```
- [ ] **Verificar** tabla de resultados muestra:
  - profile_id: [UUID presente]
  - company_id: [UUID presente]
  - role: employee
  - invitation_status: accepted

**Estado**: ⬜ Pendiente | ✅ Completado | ❌ Error

**Notas**:
```
[Espacio para notas sobre la ejecución]
```

---

### Fase 4: Pruebas de Verificación

#### Prueba 1: Empleado Actual

- [ ] **Abrir** navegador en modo incógnito
- [ ] **Ir** a la página de login
- [ ] **Ingresar** con: `asesorvaniyt@gmail.com`
- [ ] **Verificar** que:
  - [ ] Puede hacer login exitosamente
  - [ ] Ve el dashboard de la empresa
  - [ ] Aparece como "employee" (no admin)
  - [ ] Comparte la suscripción de la empresa

**Resultado**: ⬜ Pendiente | ✅ Exitoso | ❌ Falló

**Problemas encontrados**:
```
[Describir cualquier problema]
```

---

#### Prueba 2: Nueva Invitación

- [ ] **Login** con tu cuenta admin
- [ ] **Ir** a la sección de invitaciones
- [ ] **Enviar** invitación a un email de prueba
- [ ] **Ejecutar** query para obtener el link:
  ```sql
  SELECT 
    CONCAT('https://tu-dominio.com/invite/', token) as invitation_link,
    email,
    role
  FROM invitations 
  WHERE status = 'pending' 
  ORDER BY created_at DESC 
  LIMIT 1;
  ```
- [ ] **Copiar** el link de invitación
- [ ] **Abrir** navegador en modo incógnito
- [ ] **Pegar** el link de invitación
- [ ] **Completar** el registro
- [ ] **Verificar** que:
  - [ ] Se une a tu empresa (no crea una nueva)
  - [ ] Tiene el rol correcto (employee)
  - [ ] Puede acceder al dashboard
  - [ ] Comparte tu suscripción

**Resultado**: ⬜ Pendiente | ✅ Exitoso | ❌ Falló

**Link de invitación usado**:
```
[Pegar el link aquí]
```

**Problemas encontrados**:
```
[Describir cualquier problema]
```

---

#### Prueba 3: Usuario Nuevo (Sin Invitación)

- [ ] **Abrir** navegador en modo incógnito
- [ ] **Ir** a `/auth/sign-up` (sin token)
- [ ] **Registrarse** con un email nuevo
- [ ] **Verificar** que:
  - [ ] Se crea una nueva empresa
  - [ ] El usuario es admin
  - [ ] Se crea una suscripción Trial (si el email no la usó antes)
  - [ ] Puede acceder al dashboard

**Resultado**: ⬜ Pendiente | ✅ Exitoso | ❌ Falló

**Email usado**:
```
[Email de prueba]
```

**Problemas encontrados**:
```
[Describir cualquier problema]
```

---

### Fase 5: Verificación de Base de Datos

- [ ] **Ejecutar** query de verificación:
  ```sql
  -- Ver todos los usuarios y su estado
  SELECT 
    u.email,
    p.role,
    c.name as company_name,
    s.status as subscription_status,
    pl.name as plan_name
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.companies c ON c.id = p.company_id
  LEFT JOIN public.subscriptions s ON s.company_id = c.id AND s.status = 'active'
  LEFT JOIN public.plans pl ON pl.id = s.plan_id
  ORDER BY u.created_at DESC
  LIMIT 10;
  ```

- [ ] **Verificar** que todos los usuarios tienen:
  - [ ] profile_id (no null)
  - [ ] company_id (no null)
  - [ ] role (admin o employee)

**Resultado**: ⬜ Pendiente | ✅ Exitoso | ❌ Falló

**Usuarios sin perfil encontrados**:
```
[Listar emails si hay alguno]
```

---

## 🚨 Resolución de Problemas

### Error: "Database error saving new user"

**Causa**: El trigger tiene un error de sintaxis o no se ejecutó correctamente.

**Solución**:
1. Verificar que ejecutaste `FIX_HANDLE_NEW_USER_WITH_INVITATION.sql`
2. Revisar los logs de Supabase para ver el error específico
3. Ejecutar query de diagnóstico:
   ```sql
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname = 'handle_new_user';
   ```

---

### Error: Usuario se crea como admin en vez de employee

**Causa**: El `invite_token` no se está pasando correctamente.

**Solución**:
1. Verificar que el link de invitación incluye el token: `/invite/[TOKEN]`
2. Verificar que `app/auth/sign-up/page.tsx` pasa el token en los metadatos
3. Ejecutar query para ver los metadatos del usuario:
   ```sql
   SELECT email, raw_user_meta_data 
   FROM auth.users 
   WHERE email = 'EMAIL_PROBLEMA';
   ```

---

### Error: Usuario sin perfil después de registrarse

**Causa**: El trigger falló al crear el perfil.

**Solución**:
1. Ejecutar `FIX_EMPLOYEE_NO_PROFILE.sql` con el email del usuario
2. Modificar la línea 3 del script con el email correcto
3. Ejecutar el script

---

## 📊 Resumen Final

### Estadísticas

- **Scripts ejecutados**: __ / 2
- **Pruebas exitosas**: __ / 3
- **Usuarios reparados**: __
- **Invitaciones probadas**: __

### Estado General

- [ ] ✅ Sistema completamente funcional
- [ ] ⚠️ Funcional con problemas menores
- [ ] ❌ Requiere más trabajo

### Próximos Pasos

- [ ] Implementar envío automático de emails
- [ ] Agregar notificaciones de invitaciones
- [ ] Dashboard de administración de empleados
- [ ] Permisos granulares por rol

---

## 📝 Notas Adicionales

```
[Espacio para notas generales, observaciones, o cambios futuros]
```

---

## ✅ Firma de Completitud

**Fecha de completitud**: _______________

**Ejecutado por**: _______________

**Resultado**: ⬜ Exitoso | ⬜ Parcial | ⬜ Fallido

**Comentarios finales**:
```
[Comentarios sobre la implementación]
```

---

**Documentos relacionados**:
- `INSTRUCCIONES_FINALES_AUTH.md` - Guía completa
- `ACCION_REQUERIDA.md` - Resumen ejecutivo
- `TRIAL_CANCELLATION_SYSTEM.md` - Sistema de cancelación de Trial
- `FIX_INVITATION_URL.md` - Configuración de URLs
