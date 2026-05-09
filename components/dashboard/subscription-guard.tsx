"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { XCircle, AlertCircle } from "lucide-react";

interface SubscriptionGuardProps {
  subscriptionStatus: string | null;
  userRole: string | null;
  children: React.ReactNode;
}

export function SubscriptionGuard({ subscriptionStatus, userRole, children }: SubscriptionGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <>{children}</>;

  const isBillingPage = pathname === "/dashboard/billing";
  if (isBillingPage) return <>{children}</>;

  const isEmployee = userRole === "employee";

  const RetroAlert = ({ icon, title, message, showButton }: {
    icon: React.ReactNode; title: string; message: string; showButton: boolean;
  }) => (
    <div className="min-h-screen bg-[#d4d0c8] flex items-center justify-center p-8 font-sans">
      <div className="w-full max-w-md border-2 border-[#808080] shadow-[4px_4px_0px_#000] bg-[#d4d0c8]">
        <div className="bg-[#000080] px-3 py-1.5 flex items-center gap-2">
          <span className="text-white text-sm font-bold">⚠ Sistema de Gestión</span>
        </div>
        <div className="p-6 space-y-4 text-black">
          <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] p-4 flex items-start gap-3">
            <div className="shrink-0 mt-0.5">{icon}</div>
            <div>
              <p className="text-sm font-bold mb-1">{title}</p>
              <p className="text-xs text-gray-600">{message}</p>
            </div>
          </div>
          {showButton && (
            <button
              onClick={() => router.push("/dashboard/billing")}
              className="w-full border border-[#808080] bg-[#d4d0c8] py-2 text-sm font-bold shadow-[2px_2px_0px_#808080] active:shadow-none hover:bg-[#c0c0c0]"
            >
              💳 Ver Planes Disponibles
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (subscriptionStatus === "cancelled") {
    return (
      <RetroAlert
        icon={<XCircle className="h-5 w-5 text-red-600" />}
        title="Suscripción Cancelada"
        message={isEmployee
          ? "La suscripción de tu empresa fue cancelada. Contactá al administrador para reactivar el servicio."
          : "Tu suscripción fue cancelada. Seleccioná un plan de pago para continuar usando la plataforma."}
        showButton={!isEmployee}
      />
    );
  }

  if (!subscriptionStatus || subscriptionStatus === "expired") {
    return (
      <RetroAlert
        icon={<AlertCircle className="h-5 w-5 text-amber-600" />}
        title="Sin Suscripción Activa"
        message={isEmployee
          ? "Tu empresa no tiene una suscripción activa. Contactá al administrador para activar un plan."
          : "No tenés una suscripción activa. Seleccioná un plan para continuar."}
        showButton={!isEmployee}
      />
    );
  }

  return <>{children}</>;
}
