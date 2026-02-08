"use client";

import { useRouter, usePathname } from "next/navigation";
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

  // Permitir acceso a la página de billing siempre
  const isBillingPage = pathname === "/dashboard/billing";

  // Si está en la página de billing, siempre permitir acceso
  if (isBillingPage) {
    return <>{children}</>;
  }

  const isEmployee = userRole === "employee";

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
