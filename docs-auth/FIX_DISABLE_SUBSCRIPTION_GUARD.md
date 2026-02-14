# 🔧 Fix Temporal: Deshabilitar SubscriptionGuard

## 🎯 OBJETIVO

Deshabilitar temporalmente el `SubscriptionGuard` para diagnosticar si ese componente está causando la pantalla en blanco.

## 📝 INSTRUCCIONES

### Opción 1: Modificación Temporal (Recomendada para Diagnóstico)

Edita el archivo `app/dashboard/layout.tsx`:

**ANTES:**
```typescript
return (
  <SubscriptionGuard subscriptionStatus={subscriptionStatus} userRole={profile?.role || null}>
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
  </SubscriptionGuard>
)
```

**DESPUÉS:**
```typescript
// TEMPORAL: SubscriptionGuard deshabilitado para diagnóstico
return (
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
)
```

### Opción 2: Simplificar SubscriptionGuard

Si prefieres mantener el componente pero simplificarlo, edita `components/dashboard/subscription-guard.tsx`:

**Reemplaza TODO el contenido con:**
```typescript
"use client";

interface SubscriptionGuardProps {
  subscriptionStatus: string | null;
  userRole: string | null;
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  // TEMPORAL: Siempre permitir acceso para diagnóstico
  return <>{children}</>;
}
```

## 🧪 PRUEBA

1. Guarda los cambios
2. El servidor de desarrollo debería recargar automáticamente
3. Recarga el navegador (Ctrl + R)
4. Verifica si el dashboard ahora se muestra correctamente

## 📊 RESULTADOS ESPERADOS

### Si el dashboard AHORA funciona:
✅ **El problema está en SubscriptionGuard**
- Posible causa: Error de hidratación en el componente
- Posible causa: Problema con `useRouter` o `usePathname`
- Posible causa: Estado que cambia entre servidor y cliente

### Si el dashboard SIGUE en blanco:
❌ **El problema está en otro componente**
- Revisar `DashboardSidebarServer`
- Revisar `DashboardHeader`
- Revisar `SupportChatButton`
- Revisar la página principal (`app/dashboard/page.tsx`)

## 🔄 RESTAURAR CAMBIOS

Una vez identificado el problema, restaura los cambios:

```bash
# Si usaste git
git checkout app/dashboard/layout.tsx
git checkout components/dashboard/subscription-guard.tsx
```

O simplemente deshaz los cambios manualmente.

## 🎯 SIGUIENTE PASO

Después de esta prueba, sabremos si:
1. El problema es SubscriptionGuard → Necesitamos arreglarlo
2. El problema es otro componente → Necesitamos identificar cuál

---

**Nota:** Esta es una modificación temporal SOLO para diagnóstico. NO dejes estos cambios en producción.
