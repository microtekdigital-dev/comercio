"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import type { Plan, PlanWithActive } from "@/lib/actions/plans";

interface PlanCardProps {
  plan: Plan;
  isCurrentPlan?: boolean;
  onSelectPlan: (planId: string) => Promise<void>;
  isLoading?: boolean;
  isTrialBlocked?: boolean;
}

export function PlanCard({ plan, isCurrentPlan = false, onSelectPlan, isLoading = false, isTrialBlocked = false }: PlanCardProps) {
  const [loading, setLoading] = useState(false);

  const handleSelect = async () => {
    if (isCurrentPlan || isTrialBlocked || loading || isLoading) return;
    setLoading(true);
    try { await onSelectPlan(plan.id); } finally { setLoading(false); }
  };

  const fmt = (price: number, currency: string) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency, minimumFractionDigits: 0 }).format(price);

  const features = Array.isArray(plan.features) ? plan.features : [];
  const isAnnual = plan.interval === "year";
  const isTrial = plan.name?.toLowerCase().includes("trial") || Number(plan.price) === 0;
  const isPopular = plan.is_popular === true;

  return (
    <div className={`relative border-2 flex flex-col bg-[#d4d0c8] ${isCurrentPlan ? "border-[#000080] shadow-[3px_3px_0px_#000080]" : "border-[#808080] shadow-[2px_2px_0px_#808080]"}`}>
      {/* Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#000080] text-white text-[10px] font-bold px-2 py-0.5 border border-[#808080]">
          Plan Actual
        </div>
      )}
      {!isCurrentPlan && isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-700 text-white text-[10px] font-bold px-2 py-0.5 border border-[#808080] flex items-center gap-1">
          <Sparkles className="h-2.5 w-2.5" /> Más Elegido
        </div>
      )}
      {!isCurrentPlan && !isPopular && isAnnual && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-700 text-white text-[10px] font-bold px-2 py-0.5 border border-[#808080]">
          Ahorra 2 meses
        </div>
      )}
      {!isCurrentPlan && isTrial && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-[10px] font-bold px-2 py-0.5 border border-[#808080]">
          Gratis
        </div>
      )}

      {/* Title bar */}
      <div className={`px-3 py-1.5 ${isCurrentPlan ? "bg-[#000080]" : "bg-[#808080]"}`}>
        <span className="text-white text-sm font-bold">{plan.name}</span>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 space-y-3">
        <p className="text-xs text-gray-600 min-h-[32px]">{plan.description}</p>

        <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] px-3 py-2 text-center">
          <span className="text-3xl font-bold font-mono">{fmt(plan.price, plan.currency)}</span>
          <span className="text-xs text-gray-500">/{plan.interval === "month" ? "mes" : "año"}</span>
          {isAnnual && <div className="text-[10px] text-green-700 font-bold mt-0.5">Equivalente a 10 meses</div>}
        </div>

        <ul className="space-y-1.5">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <Check className="h-3.5 w-3.5 text-green-700 shrink-0 mt-0.5" />
              <span className="text-xs text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#808080]">
        <button
          onClick={handleSelect}
          disabled={isCurrentPlan || isTrialBlocked || loading || isLoading}
          className="w-full border border-[#808080] bg-[#d4d0c8] py-2 text-xs font-bold shadow-[2px_2px_0px_#808080] active:shadow-none hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center justify-center gap-1"
        >
          {loading || isLoading ? <><Loader2 className="h-3 w-3 animate-spin" /> Procesando...</>
            : isCurrentPlan ? "✔ Plan Actual"
            : isTrialBlocked ? "Trial no disponible"
            : isTrial ? "Comenzar Trial Gratis"
            : "Seleccionar Plan"}
        </button>
        {isTrialBlocked && <p className="text-[10px] text-red-600 text-center mt-1">El trial ya fue utilizado.</p>}
      </div>
    </div>
  );
}

interface PlansListProps {
  plans: PlanWithActive[];
  hasUsedTrial?: boolean;
}

export function PlansList({ plans, hasUsedTrial = false }: PlansListProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");

  const handleSelectPlan = async (planId: string) => {
    setError(null); setIsLoading(true);
    try {
      const response = await fetch("/api/mercadopago/create-preference", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al crear el pago");
      const url = data.initPoint || data.sandboxInitPoint;
      if (url) { window.location.href = url; }
      else throw new Error("No se pudo obtener la URL de pago");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el pago");
      setIsLoading(false);
    }
  };

  const trialPlans = plans.filter(p => p.name?.toLowerCase().includes("trial") || Number(p.price) === 0);
  const monthlyPlans = plans.filter(p => p.interval === "month" && !p.name?.toLowerCase().includes("trial") && Number(p.price) > 0);
  const yearlyPlans = plans.filter(p => p.interval === "year");

  return (
    <div className="space-y-6 text-black">
      {error && (
        <div className="border-2 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-700 font-bold">⚠ {error}</div>
      )}

      {/* Trial */}
      {trialPlans.length > 0 && (
        <div className="space-y-3">
          <div className="bg-[#000080] px-3 py-1">
            <span className="text-white text-xs font-bold">🎁 Comenzá Gratis — Probá todas las funciones sin compromiso</span>
          </div>
          <div className="max-w-sm mx-auto">
            {trialPlans.map(plan => (
              <PlanCard key={plan.id} plan={plan} isCurrentPlan={plan.isActivePlan}
                onSelectPlan={handleSelectPlan} isLoading={isLoading} isTrialBlocked={hasUsedTrial} />
            ))}
          </div>
        </div>
      )}

      {/* Paid plans */}
      {(monthlyPlans.length > 0 || yearlyPlans.length > 0) && (
        <div className="space-y-3">
          <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
            <span className="text-white text-xs font-bold">💳 Elegí tu Plan</span>
            <div className="flex border border-[#808080] overflow-hidden">
              <button onClick={() => setBillingInterval("month")}
                className={`px-3 py-0.5 text-[10px] font-bold transition-none ${billingInterval === "month" ? "bg-white text-black" : "bg-[#d4d0c8] text-black hover:bg-[#c0c0c0]"}`}>
                Mensual
              </button>
              <button onClick={() => setBillingInterval("year")}
                className={`px-3 py-0.5 text-[10px] font-bold border-l border-[#808080] transition-none ${billingInterval === "year" ? "bg-white text-black" : "bg-[#d4d0c8] text-black hover:bg-[#c0c0c0]"}`}>
                Anual <span className="text-green-700">-17%</span>
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4">
            {(billingInterval === "month" ? monthlyPlans : yearlyPlans).map(plan => (
              <PlanCard key={plan.id} plan={plan} isCurrentPlan={plan.isActivePlan}
                onSelectPlan={handleSelectPlan} isLoading={isLoading} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
