"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, CreditCard, AlertCircle, Loader2 } from "lucide-react";
import type { SubscriptionSummary } from "@/lib/actions/plans";

interface CurrentSubscriptionProps {
  subscription: SubscriptionSummary | null;
}

export function CurrentSubscription({ subscription }: CurrentSubscriptionProps) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" }) : "N/A";

  if (!subscription) {
    return (
      <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] p-4 text-center space-y-2">
        <CreditCard className="h-8 w-8 mx-auto text-gray-400" />
        <p className="text-sm font-bold">Sin suscripción activa</p>
        <p className="text-xs text-gray-600">Seleccioná un plan para comenzar.</p>
      </div>
    );
  }

  const plan = subscription.plan;
  const isTrial = subscription.isTrial;
  const isActive = subscription.status === "activado";
  const isCancelled = subscription.status === "cancelled";
  const willCancel = subscription.cancel_at_period_end;

  const statusLabel = isActive ? (isTrial ? "Trial activo" : "Activo") : isCancelled ? "Cancelado" : subscription.status;
  const statusColor = isActive ? "text-green-700" : isCancelled ? "text-red-600" : "text-amber-700";

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subscription.id }),
      });
      const result = await response.json();
      if (!response.ok || result.error) { alert("Error: " + (result.error || "Error al cancelar")); }
      else { setConfirmOpen(false); router.refresh(); }
    } catch { alert("Error al cancelar la suscripción"); }
    finally { setIsCancelling(false); }
  };

  return (
    <>
      <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#000080]" />
            <span className="text-sm font-bold">Suscripción Actual</span>
          </div>
          <span className={`text-xs font-bold ${statusColor}`}>{statusLabel}</span>
        </div>

        {plan && (
          <>
            <div className="border border-[#808080] bg-[#f0f0f0] px-3 py-2">
              <div className="text-xs text-gray-600">Plan</div>
              <div className="text-sm font-bold">{plan.name}</div>
            </div>
            <div className="text-2xl font-bold font-mono text-center">
              {new Intl.NumberFormat("es-AR", { style: "currency", currency: plan.currency, minimumFractionDigits: 0 }).format(plan.price)}
              <span className="text-xs font-normal text-gray-500 ml-1">/{plan.interval === "month" ? "mes" : "año"}</span>
            </div>
          </>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-600 border border-[#808080] bg-[#f0f0f0] px-3 py-2">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>Período: {fmtDate(subscription.current_period_start)} — {fmtDate(subscription.current_period_end)}</span>
        </div>

        {willCancel && !isCancelled && (
          <div className="flex items-center gap-2 text-xs text-amber-700 border border-amber-400 bg-amber-50 px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Tu suscripción se cancelará al final del período actual.</span>
          </div>
        )}

        {isCancelled && (
          <div className="flex items-center gap-2 text-xs text-red-700 border border-red-400 bg-red-50 px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Suscripción cancelada. Seleccioná un plan para continuar.</span>
          </div>
        )}

        {isActive && !willCancel && !isCancelled && (
          <button onClick={() => setConfirmOpen(true)}
            className="w-full border border-[#808080] bg-[#d4d0c8] py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] text-red-700">
            Cancelar Suscripción
          </button>
        )}
      </div>

      {/* Confirm dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[#d4d0c8] border-2 border-[#808080] shadow-[4px_4px_0px_#000] w-full max-w-sm">
            <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
              <span className="text-white text-sm font-bold">⚠ Cancelar Suscripción</span>
              <button onClick={() => setConfirmOpen(false)} className="w-5 h-5 bg-[#d4d0c8] border border-[#808080] text-black text-xs flex items-center justify-center font-bold hover:bg-[#c0c0c0]">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm font-bold">¿Cancelar suscripción?</p>
              <p className="text-xs text-gray-600">La cancelación es inmediata. Perderás acceso al plan en el momento de confirmar.</p>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#808080]">
                <button onClick={() => setConfirmOpen(false)} className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">
                  Mantener
                </button>
                <button onClick={handleCancel} disabled={isCancelling}
                  className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] text-red-700 disabled:opacity-50 flex items-center gap-1">
                  {isCancelling ? <><Loader2 className="h-3 w-3 animate-spin" /> Cancelando...</> : "✕ Confirmar Cancelación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
