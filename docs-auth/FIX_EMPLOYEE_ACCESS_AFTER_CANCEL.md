# 🔒 Fix: Empleado con acceso después de cancelar suscripción

## 🐛 Problema

Cuando un admin cancela la suscripción:
- ✅ El admin queda bloqueado (correcto)
- ❌ El empleado sigue teniendo acceso (incorrecto)

**Causa:** El empleado tiene una sesión cacheada o el navegador no está obteniendo el estado actualizado de la suscripción.

---

## ✅ Solución Implementada

### 1. Forzar datos frescos en el layout

Se agregó `dynamic = 'force-dynamic'` en `app/dashboard/layout.tsx` para que siempre obtenga el estado más reciente de la suscripción sin usar cache.

### 2. Logging mejorado

Se agregaron logs para ver qué está pasando:
```
[DashboardLayout] User: email@example.com Role: employee Company: xxx Subscription: cancelled
```

---

## 🧪 Cómo Probar

### Paso 1: Verificar estado en base de datos

Ejecutar este SQL en Supabase:

```sql
-- Reemplazar con el email del empleado
SELECT 
  u.email as user_email,
  p.role as user_role,
  p.company_id,
  c.name as company_name,
  s.status as subscription_status,
  pl.name as plan_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.companies c ON c.id = p.company_id
LEFT JOIN public.subscriptions s ON s.company_id = c.id
LEFT JOIN public.plans pl ON pl.id = s.plan_id
WHERE u.email = 'EMAIL_DEL_EMPLEADO'
ORDER BY s.created_at DESC
LIMIT 1;
```

**Resultado esperado:**
- `subscription_status`: `cancelled`

### Paso 2: Cerrar sesión del empleado

El empleado debe:
1. Cerrar sesión (logout)
2. Cerrar el navegador completamente
3. Abrir navegador nuevamente
4. Hacer login

### Paso 3: Verificar bloqueo

Después de login, el empleado debería ver:

```
┌─────────────────────────────────────┐
│  ⚠️ Suscripción Cancelada           │
│                                     │
│  Tu suscripción ha sido cancelada.  │
│  Para continuar usando la           │
│  plataforma, por favor selecciona   │
│  un plan de pago.                   │
│                                     │
│  [Ver Planes Disponibles]           │
└─────────────────────────────────────┘
```

---

## 🔍 Diagnóstico

### Si el empleado sigue teniendo acceso:

#### 1. Verificar en consola del servidor

Buscar este log:
```
[DashboardLayout] User: empleado@email.com Role: employee Company: xxx Subscription: ???
```

**Si dice `Subscription: active`:**
- La suscripción NO está cancelada en la base de datos
- Ejecutar el script de verificación SQL

**Si dice `Subscription: cancelled`:**
- La suscripción SÍ está cancelada
- El problema es de cache del navegador
- Solución: Cerrar sesión y limpiar cache

#### 2. Verificar cache del navegador

El empleado debe:
1. Abrir DevTools (F12)
2. Application → Storage → Clear site data
3. Cerrar sesión
4. Hacer login nuevamente

#### 3. Verificar que el código se actualizó

```bash
# Reiniciar el servidor
npm run dev
```

---

## 🔧 Solución Manual (Si persiste)

### Opción 1: Forzar logout de todos los usuarios

Ejecutar en Supabase SQL Editor:

```sql
-- Esto invalida todas las sesiones de la empresa
-- Los usuarios tendrán que hacer login nuevamente

-- Obtener el company_id
SELECT id FROM companies WHERE name = 'NOMBRE_DE_LA_EMPRESA';

-- Luego, puedes cambiar la contraseña del empleado temporalmente
-- para forzar que haga login nuevamente
```

### Opción 2: Eliminar sesiones manualmente

En Supabase Dashboard:
1. Authentication → Users
2. Buscar al empleado
3. Click en el usuario
4. "Sign out user" o "Delete user sessions"

---

## 📋 Checklist de Verificación

### Para el Admin:
- [ ] Canceló la suscripción desde `/dashboard/billing`
- [ ] Ve el mensaje "Suscripción Cancelada"
- [ ] No puede acceder a otras páginas del dashboard

### Para el Empleado:
- [ ] Cerró sesión completamente
- [ ] Cerró el navegador
- [ ] Hizo login nuevamente
- [ ] Ve el mensaje "Suscripción Cancelada"
- [ ] No puede acceder a otras páginas del dashboard

### En Base de Datos:
- [ ] La suscripción tiene `status = 'cancelled'`
- [ ] Tanto admin como empleado tienen el mismo `company_id`
- [ ] No hay múltiples suscripciones activas

---

## 🎯 Comportamiento Esperado

### Cuando se cancela una suscripción:

```
Admin cancela suscripción
    ↓
Sistema actualiza status a 'cancelled'
    ↓
TODOS los usuarios de esa empresa quedan bloqueados
    ↓
Admin ve: "Suscripción Cancelada"
    ↓
Empleado ve: "Suscripción Cancelada"
    ↓
Ambos son redirigidos a /dashboard/billing
    ↓
Solo pueden ver la página de planes
```

---

## 🚨 Casos Especiales

### Caso 1: Empleado en otra pestaña

Si el empleado tiene el dashboard abierto en otra pestaña:
- La pestaña vieja puede seguir mostrando contenido
- Al refrescar (F5) debería ver el bloqueo
- Si no funciona: cerrar sesión y volver a entrar

### Caso 2: Múltiples empresas

Si el empleado pertenece a múltiples empresas:
- Solo se bloquea en la empresa que canceló
- Puede seguir accediendo a otras empresas

### Caso 3: Cache agresivo

Algunos navegadores cachean agresivamente:
- Solución: Modo incógnito
- O limpiar cache completamente

---

## 📝 Notas Técnicas

### Cambios realizados:

1. **`app/dashboard/layout.tsx`**:
   - Agregado `export const dynamic = 'force-dynamic'`
   - Agregado `export const revalidate = 0`
   - Agregado logging para debugging

2. **Comportamiento**:
   - El layout SIEMPRE obtiene el estado fresco de la suscripción
   - No usa cache de Next.js
   - Verifica el estado en cada request

### Por qué funciona:

- `dynamic = 'force-dynamic'` → No usa cache estático
- `revalidate = 0` → No usa cache de revalidación
- Query directa a Supabase → Datos en tiempo real

---

## ✅ Verificación Final

Después de implementar el fix:

1. **Admin cancela suscripción**
2. **Empleado refresca página** (F5)
3. **Empleado ve bloqueo** ✅

Si no funciona:
1. Verificar logs en consola del servidor
2. Ejecutar script SQL de verificación
3. Forzar logout del empleado

---

**Archivo relacionado:** `DEBUG_SUBSCRIPTION_EMPLOYEE.sql`
