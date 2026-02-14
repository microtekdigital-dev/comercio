# 🔍 Diagnóstico: Pantalla en Blanco en Dashboard

## 📋 SITUACIÓN ACTUAL

- ✅ El servidor responde correctamente (código 200)
- ✅ El dashboard renderiza en el servidor (799ms)
- ❌ El usuario ve pantalla en blanco en el navegador
- ✅ RLS está configurado correctamente (según logs)

## 🎯 CAUSA PROBABLE

Cuando el servidor responde con 200 pero el usuario ve pantalla en blanco, el problema está en el **lado del cliente** (JavaScript), NO en RLS ni en el servidor.

Posibles causas:
1. **Error de JavaScript** en el navegador que rompe el renderizado
2. **Error de hidratación** de React/Next.js
3. **Componente que lanza excepción** durante el render del cliente
4. **Problema de caché** del navegador

## 🔧 PASOS DE DIAGNÓSTICO

### PASO 1: Revisar Consola del Navegador (CRÍTICO)

**Esto es lo MÁS IMPORTANTE para diagnosticar el problema:**

1. Abre el dashboard que muestra pantalla en blanco
2. Presiona **F12** para abrir las herramientas de desarrollador
3. Ve a la pestaña **Console**
4. Busca mensajes en **ROJO** (errores)
5. **Copia y pega TODOS los errores que veas**

**Ejemplo de lo que debes buscar:**
```
❌ Error: Hydration failed because the initial UI does not match...
❌ Uncaught TypeError: Cannot read property 'map' of undefined
❌ Error: Objects are not valid as a React child
```

### PASO 2: Revisar Pestaña Network

1. En las herramientas de desarrollador (F12)
2. Ve a la pestaña **Network**
3. Recarga la página (Ctrl + R)
4. Busca requests que fallen (en rojo)
5. Verifica si hay algún request a `/api/` que falle

### PASO 3: Limpiar Caché Completamente

1. Presiona **Ctrl + Shift + Delete**
2. Selecciona:
   - ✅ Cookies y datos de sitios
   - ✅ Imágenes y archivos en caché
3. Selecciona "Desde siempre"
4. Haz clic en "Borrar datos"
5. Cierra TODAS las pestañas del navegador
6. Abre una nueva ventana de incógnito
7. Intenta acceder al dashboard

### PASO 4: Verificar Estado de RLS (Opcional)

Si los pasos anteriores no revelan nada, ejecuta estos scripts:

```sql
-- En Supabase SQL Editor:
-- 1. Ejecuta este script primero:
\i docs-auth/DEBUG_BLANK_SCREEN_ISSUE.sql

-- 2. Luego ejecuta este para probar acceso:
\i docs-auth/TEST_RLS_ACCESS.sql
```

## 🚨 INFORMACIÓN CRÍTICA NECESARIA

**Para poder ayudarte, NECESITO que me proporciones:**

1. **Errores de la consola del navegador** (F12 > Console)
   - Sin esto, es imposible diagnosticar el problema
   
2. **Captura de pantalla** de la consola con los errores

3. **Logs del servidor** cuando cargas la página
   - Los que ya compartiste muestran que el servidor funciona
   - Pero necesito ver si hay algún error adicional

## 🔍 ANÁLISIS DE LOGS ACTUALES

Según los logs que compartiste:
```
GET /dashboard 200 in 1051ms (compile: 20ms, proxy.ts: 232ms, render: 799ms)
[ERPStats] Low stock products count: 0
[ERPStats] Low stock products: []
```

**Esto indica:**
- ✅ El servidor está funcionando correctamente
- ✅ El componente ERPStats se está ejecutando
- ✅ Las queries a la base de datos funcionan
- ❌ Algo falla DESPUÉS en el cliente

## 💡 POSIBLES SOLUCIONES RÁPIDAS

### Solución 1: Deshabilitar SubscriptionGuard Temporalmente

Edita `app/dashboard/layout.tsx` y comenta el SubscriptionGuard:

```typescript
// Comentar temporalmente para diagnosticar
return (
  // <SubscriptionGuard subscriptionStatus={subscriptionStatus} userRole={profile?.role || null}>
    <div className="min-h-screen flex flex-col md:flex-row">
      <DashboardSidebarServer />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 bg-muted/30 overflow-x-hidden">
          {children}
        </main>
      </div>
      <Toaster position="top-right" richColors />
      <SupportChatButton unreadCount={unreadCount} />
    </div>
  // </SubscriptionGuard>
)
```

Si esto soluciona el problema, entonces el error está en `SubscriptionGuard`.

### Solución 2: Verificar Componente ERPStats

El componente `ERPStats` se está ejecutando según los logs. Verifica si hay algún error en su renderizado del cliente.

### Solución 3: Modo de Desarrollo Limpio

```bash
# Detener el servidor
# Borrar caché de Next.js
rmdir /s /q .next

# Reinstalar dependencias
npm install

# Iniciar de nuevo
npm run dev
```

## 📞 SIGUIENTE PASO

**POR FAVOR, proporciona los errores de la consola del navegador (F12 > Console).**

Sin esta información, solo puedo hacer suposiciones. Los errores de JavaScript te dirán exactamente qué componente está fallando y por qué.

## 🎯 CHECKLIST DE DIAGNÓSTICO

- [ ] Abrí la consola del navegador (F12)
- [ ] Revisé la pestaña Console
- [ ] Copié todos los errores en rojo
- [ ] Revisé la pestaña Network
- [ ] Limpié el caché del navegador
- [ ] Probé en ventana de incógnito
- [ ] Compartí los errores encontrados

---

**Fecha:** 2026-02-14  
**Estado:** Esperando información de la consola del navegador  
**Prioridad:** 🔴 ALTA - Necesitamos los errores de JavaScript para continuar
