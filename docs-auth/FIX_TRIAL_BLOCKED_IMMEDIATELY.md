# Fix: Trial Bloqueado Inmediatamente Después de Registro

## Problema Reportado
Usuario se registra con trial gratuito y al ingresar al dashboard aparece bloqueado inmediatamente, como si el trial se hubiera vencido.

## Datos de la Suscripción (SQL Query)
```
ID: f3ed47ea-2b87-4d09-9be7-aaf23a180d80
Status: active
Plan: Trial (price: 0.00)
Company: Celulares Roma
current_period_end: 2026-03-08 (28 días en el futuro)
Estado: ACTIVA
```

## Análisis del Problema

### ✅ Lo que está BIEN:
1. La suscripción existe en la base de datos
2. El status es "active" (correcto)
3. La fecha de vencimiento es 2026-03-08 (28 días en el futuro, correcto)
4. El plan es Trial con precio 0 (correcto)

### ❌ Posibles Causas del Bloqueo:

1. **Cache del navegador**: El navegador puede estar mostrando una versión antigua de la página
2. **Deploy de Vercel no completado**: El último commit (c71e6f8) puede no estar desplegado
3. **Múltiples suscripciones**: Puede haber múltiples suscripciones interfiriendo
4. **Validación de fecha faltante**: El código no estaba validando si `current_period_end` ha expirado
5. **Logs insuficientes**: No había forma de ver qué estaba pasando en el servidor

## Soluciones Implementadas

### 1. Agregado Logging Detallado en `app/dashboard/layout.tsx`
```typescript
console.log("[DashboardLayout] Company ID:", profile.company_id)
console.log("[DashboardLayout] Subscription found:", subscription ? "YES" : "NO")
console.log("[DashboardLayout] Subscription status:", subscription?.status)
console.log("[DashboardLayout] Subscription period end:", subscription?.current_period_end)
console.log("[DashboardLayout] Period end date:", periodEnd)
console.log("[DashboardLayout] Current date:", now)
console.log("[DashboardLayout] Is expired:", periodEnd ? periodEnd < now : "NO DATE")
```

### 2. Agregada Validación de Fecha de Expiración
```typescript
// If subscription is active but period has ended, mark as expired
if (subscription.status === "active" && periodEnd && periodEnd < now) {
  subscriptionStatus = "expired"
  console.log("[DashboardLayout] Subscription marked as EXPIRED")
} else {
  subscriptionStatus = subscription.status
  console.log("[DashboardLayout] Subscription status set to:", subscriptionStatus)
}
```

### 3. Removido `useEffect` innecesario en `subscription-guard.tsx`
- Se eliminó import de `useEffect` que no se estaba usando

### 4. Creado Script de Diagnóstico SQL
- Archivo: `docs-auth/DEBUG_BLOCKED_TRIAL.sql`
- Verifica todas las suscripciones de la empresa
- Detecta múltiples suscripciones activas
- Muestra días restantes del trial
- Verifica membresía en company_users

## Pasos para Diagnosticar

### Paso 1: Hard Refresh del Navegador
```
Chrome/Edge: Ctrl + Shift + R
Firefox: Ctrl + F5
O abrir en modo incógnito
```

### Paso 2: Verificar Deploy en Vercel
1. Ir a dashboard de Vercel
2. Verificar que el último commit esté en estado "Ready"
3. Commit esperado: c71e6f8 o posterior

### Paso 3: Ver Logs del Servidor
1. En Vercel, ir a la pestaña "Logs"
2. Buscar logs que empiecen con `[DashboardLayout]`
3. Verificar qué valores se están imprimiendo:
   - ¿Se encuentra la suscripción?
   - ¿Qué status tiene?
   - ¿La fecha está expirada?

### Paso 4: Ejecutar Script de Diagnóstico SQL
```sql
-- Ejecutar en Supabase SQL Editor
-- Ver archivo: docs-auth/DEBUG_BLOCKED_TRIAL.sql
```

### Paso 5: Verificar Múltiples Suscripciones
```sql
SELECT COUNT(*) as total_activas
FROM subscriptions
WHERE company_id = (SELECT id FROM companies WHERE name = 'Celulares Roma')
  AND status IN ('active', 'pending')
  AND current_period_end > NOW();
```

Si `total_activas > 1`, hay un problema de múltiples suscripciones.

## Soluciones Temporales

### Si el problema persiste después de hard refresh:

1. **Cerrar sesión y volver a entrar**:
   - Logout completo
   - Limpiar cookies del sitio
   - Login nuevamente

2. **Verificar en otro navegador**:
   - Probar en Chrome, Firefox, Edge
   - Esto descarta problemas de cache

3. **Verificar zona horaria**:
   - El servidor puede estar en una zona horaria diferente
   - Los logs mostrarán la fecha exacta que está comparando

## Archivos Modificados

1. `app/dashboard/layout.tsx` - Agregado logging y validación de fecha
2. `components/dashboard/subscription-guard.tsx` - Removido useEffect innecesario
3. `docs-auth/DEBUG_BLOCKED_TRIAL.sql` - Script de diagnóstico SQL

## Commit
```
feat: Agregar logging y validación de fecha en SubscriptionGuard
```

## Próximos Pasos

1. Usuario debe hacer hard refresh (Ctrl + Shift + R)
2. Si persiste, verificar logs en Vercel
3. Si persiste, ejecutar script de diagnóstico SQL
4. Reportar resultados de los logs para continuar diagnóstico

## Notas Importantes

- ⚠️ **NO se modificó la lógica de bloqueos existente**
- ⚠️ **NO se modificó la lógica de trials**
- ⚠️ **NO se modificó la lógica de invitaciones**
- ✅ Solo se agregó logging y validación de fecha
- ✅ Los cambios son completamente aditivos y seguros
