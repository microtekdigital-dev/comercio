# 🔧 Fix: Problema de Hidratación en SubscriptionGuard

## 🎯 PROBLEMA IDENTIFICADO

El componente `SubscriptionGuard` tiene un problema de hidratación que puede causar pantalla en blanco:

### Código Problemático:
```typescript
// Mostrar contenido solo después de montar en el cliente
if (!mounted) {
  return <>{children}</>;
}
```

**¿Por qué es problemático?**
1. El servidor renderiza el contenido completo (children)
2. El cliente inicialmente renderiza el contenido completo (porque mounted = false)
3. Luego el cliente re-renderiza y puede mostrar el mensaje de error
4. Esto causa un **mismatch de hidratación** que puede romper el renderizado

## ✅ SOLUCIÓN

Reemplaza el archivo `components/dashboard/subscription-guard.tsx` con este código corregido:

```typescript
"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

interface SubscriptionGuardProps {
  subscriptionStatus: string | null;
  userRole: string | null;
  children: React.ReactNode;
}

export function SubscriptionGuard({ subscriptionStatus, userRole, children }: SubscriptionGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  // Permitir acceso a la página de billing siempre
  const isBillingPage = pathname === "/dashboard/billing";

  // Si está en la página de billing, siempre permitir acceso
  if (isBillingPage) {
    return <>{children}</>;
  }

  const isEmployee = userRole === "employee";

  // CRÍTICO: Mostrar un loading state mientras se monta el componente
  // Esto evita problemas de hidratación
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">
            Cargando...
          </div>
        </div>
      </div>
    );
  }

  // Si la suscripción está cancelada, mostrar mensaje y bloquear acceso
  if (subscriptionStatus === "cancelled") {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Suscripción Cancelada</AlertTitle>
            <AlertDescription>
              {isEmployee 
                ? "La suscripción de tu empresa ha sido cancelada. Por favor contacta al administrador para reactivar el servicio."
                : "Tu suscripción ha sido cancelada. Para continuar usando la plataforma, por favor selecciona un plan de pago."
              }
            </AlertDescription>
          </Alert>
          {!isEmployee && (
            <Button 
              onClick={() => router.push("/dashboard/billing")} 
              className="w-full"
            >
              Ver Planes Disponibles
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Si no hay suscripción activa, redirigir a billing
  if (!subscriptionStatus || subscriptionStatus === "expired") {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <Alert className="mb-4">
            <AlertTitle>Sin Suscripción Activa</AlertTitle>
            <AlertDescription>
              {isEmployee
                ? "Tu empresa no tiene una suscripción activa. Por favor contacta al administrador para activar un plan."
                : "No tienes una suscripción activa. Por favor selecciona un plan para continuar."
              }
            </AlertDescription>
          </Alert>
          {!isEmployee && (
            <Button 
              onClick={() => router.push("/dashboard/billing")} 
              className="w-full"
            >
              Ver Planes Disponibles
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Si la suscripción está activa, mostrar el contenido
  return <>{children}</>;
}
```

## 🔑 CAMBIO CLAVE

**ANTES:**
```typescript
if (!mounted) {
  return <>{children}</>;  // ❌ Causa mismatch de hidratación
}
```

**DESPUÉS:**
```typescript
if (!mounted) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Cargando...
        </div>
      </div>
    </div>
  );  // ✅ Muestra loading state consistente
}
```

## 📝 EXPLICACIÓN

1. **Antes del mount**: Muestra un loading state simple
2. **Después del mount**: Evalúa el estado de suscripción
3. **Resultado**: No hay mismatch entre servidor y cliente

## 🧪 PRUEBA

1. Aplica el cambio al archivo `components/dashboard/subscription-guard.tsx`
2. Guarda el archivo
3. El servidor de desarrollo recargará automáticamente
4. Recarga el navegador (Ctrl + R)
5. El dashboard debería cargar correctamente

## 📊 RESULTADO ESPERADO

- ✅ El dashboard carga sin pantalla en blanco
- ✅ No hay errores de hidratación en la consola
- ✅ El usuario ve el contenido correctamente

## 🔍 VERIFICACIÓN

Después de aplicar el fix, verifica en la consola del navegador (F12):
- ❌ NO debe haber errores de "Hydration failed"
- ❌ NO debe haber errores de "Text content does not match"
- ✅ El dashboard debe cargar normalmente

---

**Prioridad:** 🔴 ALTA  
**Tipo:** Bug Fix - Hidratación  
**Impacto:** Resuelve pantalla en blanco
