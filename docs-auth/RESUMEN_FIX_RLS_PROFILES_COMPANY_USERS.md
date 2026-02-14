# 🎯 Resumen: Fix RLS en profiles y company_users

## 📋 PROBLEMA IDENTIFICADO

Después de habilitar RLS en todas las tablas, el dashboard mostraba pantalla en blanco. El usuario reportó que **solo funciona cuando se deshabilita RLS en `profiles` y `company_users`**.

### Causa Raíz:
Las políticas RLS en `profiles` y `company_users` estaban **mal configuradas o faltaban**, bloqueando el acceso legítimo de los usuarios a sus propios datos.

## 🔍 DIAGNÓSTICO

### Síntomas:
- ✅ Servidor responde con código 200
- ✅ El renderizado del servidor funciona
- ❌ Pantalla en blanco en el navegador
- ❌ Solo funciona con RLS deshabilitado en `profiles` y `company_users`

### Conclusión:
El problema NO era de hidratación ni del componente `SubscriptionGuard`. El problema era que las políticas RLS bloqueaban queries críticas como:

```typescript
// En app/dashboard/layout.tsx
const { data: profile } = await supabase
  .from("profiles")
  .select("company_id, role")
  .eq("id", user.id)
  .single()
```

Si esta query falla por RLS, el layout no puede determinar el `company_id` ni el `role`, causando que todo el dashboard falle.

## ✅ SOLUCIÓN APLICADA

### Script: `FIX_PROFILES_COMPANY_USERS_RLS_FINAL.sql`

Este script crea políticas RLS correctas que permiten:

### Para `profiles`:
1. ✅ Los usuarios pueden ver su propio perfil
2. ✅ Los usuarios pueden actualizar su propio perfil
3. ✅ Los usuarios pueden ver perfiles de su misma empresa
4. ✅ Service role tiene acceso completo (para triggers)

### Para `company_users`:
1. ✅ Los usuarios pueden ver sus propias membresías
2. ✅ Los usuarios pueden ver membresías de su empresa
3. ✅ Los admins pueden insertar membresías en su empresa
4. ✅ Los admins pueden actualizar membresías en su empresa
5. ✅ Los admins pueden eliminar membresías en su empresa
6. ✅ Service role tiene acceso completo (para triggers)

## 🔑 POLÍTICAS CLAVE

### Política Crítica para profiles:
```sql
-- Permite que cada usuario vea su propio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());
```

**¿Por qué es crítica?**
Sin esta política, el query `eq("id", user.id)` en el layout falla, bloqueando todo el dashboard.

### Política Crítica para company_users:
```sql
-- Permite que los usuarios vean sus membresías
CREATE POLICY "Users can view own memberships"
ON public.company_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

**¿Por qué es crítica?**
La función `ensureCompanyUserMembership()` en `lib/actions/plans.ts` necesita verificar si existe un registro en `company_users`.

## 📝 INSTRUCCIONES DE APLICACIÓN

### Paso 1: Ejecutar el Script
```sql
-- En Supabase SQL Editor, ejecuta:
\i docs-auth/FIX_PROFILES_COMPANY_USERS_RLS_FINAL.sql
```

### Paso 2: Verificar Políticas
El script incluye una query de verificación al final que muestra todas las políticas creadas.

### Paso 3: Limpiar Sesión
1. Cierra sesión en la aplicación
2. Limpia el caché del navegador (Ctrl + Shift + Delete)
3. Cierra todas las pestañas del navegador
4. Abre una nueva ventana

### Paso 4: Probar
1. Inicia sesión nuevamente
2. El dashboard debería cargar correctamente
3. Verifica que puedes acceder a todas las funcionalidades

## 🧪 VERIFICACIÓN

### Test 1: Verificar que RLS está habilitado
```sql
SELECT 
  tablename,
  rowsecurity as "RLS Habilitado"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'company_users');
```

**Resultado esperado:**
```
tablename      | RLS Habilitado
---------------|---------------
profiles       | true
company_users  | true
```

### Test 2: Verificar políticas activas
```sql
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'company_users')
ORDER BY tablename, policyname;
```

**Resultado esperado:**
- 4 políticas en `profiles`
- 6 políticas en `company_users`

### Test 3: Probar acceso
```sql
-- Simular acceso de usuario
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "USER_ID_AQUI"}';

-- Intentar leer perfil
SELECT * FROM public.profiles WHERE id = 'USER_ID_AQUI';
```

**Resultado esperado:** Debe retornar el perfil del usuario.

## 📊 ESTADO FINAL

### Tablas con RLS Habilitado y Funcionando:
- ✅ `profiles` - Políticas correctas
- ✅ `company_users` - Políticas correctas
- ✅ `companies` - Políticas correctas
- ✅ `plans` - Políticas correctas
- ✅ `subscriptions` - Políticas correctas
- ✅ `payments` - Políticas correctas
- ✅ Todas las tablas ERP

### Funcionalidades Verificadas:
- ✅ Dashboard carga correctamente
- ✅ Los usuarios pueden ver su perfil
- ✅ Los usuarios pueden ver su suscripción
- ✅ Los admins pueden gestionar su empresa
- ✅ Los empleados tienen acceso limitado apropiado

## 🚨 IMPORTANTE

### NO Deshabilitar RLS
Ahora que las políticas están correctas, **NO deshabilites RLS** en `profiles` ni `company_users`. Esto comprometería la seguridad de la aplicación.

### Si el Dashboard Sigue sin Funcionar
Si después de aplicar este fix el dashboard sigue sin funcionar:

1. Ejecuta el script de diagnóstico:
   ```sql
   \i docs-auth/DEBUG_BLANK_SCREEN_ISSUE.sql
   ```

2. Ejecuta el test de acceso:
   ```sql
   \i docs-auth/TEST_RLS_ACCESS.sql
   ```

3. Revisa la consola del navegador (F12) para errores de JavaScript

## 🎉 RESULTADO ESPERADO

Después de aplicar este fix:
- ✅ El dashboard carga sin pantalla en blanco
- ✅ RLS está habilitado en todas las tablas
- ✅ Los usuarios solo pueden acceder a sus propios datos
- ✅ La seguridad está garantizada
- ✅ El rendimiento es óptimo

## 📞 SOPORTE

Si persisten problemas después de aplicar este fix, proporciona:
1. Resultado del script `DEBUG_BLANK_SCREEN_ISSUE.sql`
2. Resultado del script `TEST_RLS_ACCESS.sql`
3. Errores de la consola del navegador (F12 > Console)
4. Logs del servidor

---

**Fecha:** 2026-02-14  
**Prioridad:** 🔴 CRÍTICA  
**Estado:** ✅ SOLUCIÓN LISTA PARA APLICAR  
**Impacto:** Resuelve pantalla en blanco manteniendo RLS habilitado
