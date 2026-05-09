import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCompanySubscriptionAndPlans, getCompanyPayments } from "@/lib/actions/plans";
import { PlansList } from "@/components/dashboard/plans-list";
import { CurrentSubscription } from "@/components/dashboard/current-subscription";
import { PaymentHistory } from "@/components/dashboard/payment-history";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";

interface BillingPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const supabase = await createClient();
  const params = await searchParams;
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("company_id, role").eq("id", user.id).single();
  if (!profile || !profile.company_id) redirect("/pos");

  const [billingSummary, payments] = await Promise.all([
    getCompanySubscriptionAndPlans(),
    getCompanyPayments(profile.company_id),
  ]);

  const { plans, subscription, hasUsedTrial } = billingSummary;
  const isAdmin = ["owner", "admin"].includes(profile.role || "");
  const paymentStatus = params.status;

  const statusBanners: Record<string, { icon: React.ReactNode; text: string; color: string }> = {
    success: { icon: <CheckCircle2 className="h-4 w-4 text-green-700" />, text: "Pago exitoso — Tu suscripción está activa.", color: "bg-green-50 border-green-400 text-green-800" },
    failure: { icon: <XCircle className="h-4 w-4 text-red-700" />, text: "Pago fallido — Por favor intentá nuevamente.", color: "bg-red-50 border-red-400 text-red-800" },
    pending: { icon: <Clock className="h-4 w-4 text-amber-700" />, text: "Pago pendiente — Te notificaremos cuando se complete.", color: "bg-amber-50 border-amber-400 text-amber-800" },
  };

  const banner = paymentStatus ? statusBanners[paymentStatus] : null;

  return (
    <div className="space-y-4 text-black">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1">
          <span className="text-white text-sm font-bold">💳 Facturación y Planes</span>
        </div>
        <div className="bg-[#d4d0c8] p-4 space-y-6">

          {/* Status banner */}
          {banner && (
            <div className={`flex items-center gap-2 border-2 px-3 py-2 text-xs font-bold ${banner.color}`}>
              {banner.icon}
              {banner.text}
            </div>
          )}

          {/* Current subscription */}
          <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080]">
            <div className="bg-[#c0c0c0] px-3 py-1 border-b border-[#808080]">
              <span className="text-xs font-bold">Suscripción Actual</span>
            </div>
            <div className="p-3">
              <CurrentSubscription subscription={subscription} />
            </div>
          </div>

          {/* Plans */}
          {isAdmin ? (
            <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080]">
              <div className="bg-[#c0c0c0] px-3 py-1 border-b border-[#808080]">
                <span className="text-xs font-bold">Planes Disponibles</span>
              </div>
              <div className="p-3">
                <Suspense fallback={<div className="flex items-center gap-2 py-4 text-xs text-gray-500"><Loader2 className="h-3 w-3 animate-spin" /> Cargando planes...</div>}>
                  <PlansList plans={plans} hasUsedTrial={hasUsedTrial} />
                </Suspense>
              </div>
            </div>
          ) : (
            <div className="border border-[#808080] bg-[#f0f0f0] px-3 py-2 text-xs text-gray-600">
              Solo los administradores pueden cambiar el plan de suscripción.
            </div>
          )}

          {/* Payment history */}
          <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080]">
            <div className="bg-[#c0c0c0] px-3 py-1 border-b border-[#808080]">
              <span className="text-xs font-bold">Historial de Pagos</span>
            </div>
            <div className="p-3">
              <PaymentHistory payments={payments} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
