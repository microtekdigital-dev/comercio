# 🔧 Instrucciones: Fix Pantalla en Blanco con RLS

## 🎯 PROBLEMA

El dashboard muestra pantalla en blanco cuando RLS está habilitado en `profiles` y `company_users`.

## ✅ SOLUCIÓN

Las políticas RLS estaban mal configuradas. Necesitas ejecutar un script que crea las políticas correctas.

## 📝 PASOS A SEGUIR

### Paso 1: Ejecutar el Script de Fix

1. Ve a **Supabase Dashboard**
2. Abre el **SQL Editor**
3. Copia y pega el contenido del archivo: `docs-auth/FIX_PROFILES_COMPANY_USERS_RLS_FINAL.sql`
4. Haz clic en **Run** (Ejecutar)

**Resultado esperado:**
```
✅ Políticas eliminadas
✅ Nuevas políticas creadas
✅ RLS habilitado
✅ Lista de políticas mostrada
```

### Paso 2: Verificar que Funcionó

1. En el mismo SQL Editor
2. Copia y pega el contenido del archivo: `docs-auth/VERIFY_RLS_POLICIES_WORKING.sql`
3. Haz clic en **Run**

**Resultado esperado:**
Todos los tests deben mostrar ✅

### Paso 3: Limpiar Sesión

1. En tu aplicación, **cierra sesión**
2. Presiona **Ctrl + Shift + Delete**
3. Selecciona:
   - ✅ Cookies y datos de sitios
   - ✅ Imágenes y archivos en caché
4. Selecciona "Desde siempre"
5. Haz clic en "Borrar datos"
6. **Cierra todas las pestañas** del navegador
7. Abre una **nueva ventana**

### Paso 4: Probar

1. Ve a tu aplicación
2. Inicia sesión
3. El dashboard debería cargar correctamente

## 🎉 RESULTADO ESPERADO

- ✅ Dashboard carga sin pantalla en blanco
- ✅ RLS está habilitado en todas las tablas
- ✅ Los usuarios solo pueden ver sus propios datos
- ✅ La seguridad está garantizada

## ❌ SI SIGUE SIN FUNCIONAR

Si después de seguir estos pasos el dashboard sigue en blanco:

### Opción 1: Diagnóstico Completo

Ejecuta en SQL Editor:
```sql
\i docs-auth/DEBUG_BLANK_SCREEN_ISSUE.sql
```

Comparte los resultados.

### Opción 2: Test de Acceso

Ejecuta en SQL Editor:
```sql
\i docs-auth/TEST_RLS_ACCESS.sql
```

Comparte los resultados.

### Opción 3: Errores del Navegador

1. Abre el dashboard (aunque esté en blanco)
2. Presiona **F12**
3. Ve a la pestaña **Console**
4. Copia y pega TODOS los errores en rojo
5. Comparte los errores

## 📋 CHECKLIST

- [ ] Ejecuté `FIX_PROFILES_COMPANY_USERS_RLS_FINAL.sql`
- [ ] Ejecuté `VERIFY_RLS_POLICIES_WORKING.sql`
- [ ] Todos los tests muestran ✅
- [ ] Cerré sesión
- [ ] Limpié el caché del navegador
- [ ] Cerré todas las pestañas
- [ ] Abrí una nueva ventana
- [ ] Inicié sesión nuevamente
- [ ] El dashboard carga correctamente

## 🔍 EXPLICACIÓN TÉCNICA (Opcional)

### ¿Por qué fallaba?

El layout del dashboard ejecuta este query:
```typescript
const { data: profile } = await supabase
  .from("profiles")
  .select("company_id, role")
  .eq("id", user.id)
  .single()
```

Si RLS bloquea este query, el layout no puede obtener el `company_id` ni el `role`, causando que todo el dashboard falle.

### ¿Qué hace el fix?

Crea políticas RLS que permiten:
- Los usuarios pueden ver su propio perfil
- Los usuarios pueden ver perfiles de su empresa
- Los usuarios pueden ver sus membresías en company_users
- Service role tiene acceso completo (para triggers)

Esto permite que el dashboard funcione correctamente mientras mantiene la seguridad.

---

**Fecha:** 2026-02-14  
**Prioridad:** 🔴 CRÍTICA  
**Tiempo estimado:** 5 minutos  
**Dificultad:** Fácil (solo copiar y pegar scripts)
