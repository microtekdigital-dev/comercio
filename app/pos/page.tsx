import { getActiveCashRegisterOpening } from "@/lib/actions/pos";
import { getCompanySettings } from "@/lib/actions/company-settings";
import { getCurrentUser } from "@/lib/actions/users";
import { getFinancialStats } from "@/lib/actions/financial-stats";
import { getCompanySubscription } from "@/lib/actions/plans";
import { canAccessRepairs } from "@/lib/utils/plan-limits";
import { POSPageClient } from "./pos-page-client";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function POSPage() {
  const [opening, settings, user, financial] = await Promise.all([
    getActiveCashRegisterOpening(),
    getCompanySettings(),
    getCurrentUser(),
    getFinancialStats(),
  ]);

  if (!opening) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6 p-8 bg-[#d4d0c8]">
        <div className="bg-white border-2 border-[#808080] shadow-[2px_2px_0px_#000] p-8 flex flex-col items-center gap-4 text-center max-w-md">
          <AlertTriangle className="h-10 w-10 text-amber-600" />
          <h2 className="text-lg font-bold">Caja no abierta</h2>
          <p className="text-sm text-gray-600">
            Para acceder al Punto de Venta necesitás tener una caja abierta.
          </p>
          <Link href="/dashboard/cash-register/opening/new"
            className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-sm font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">
            Abrir caja
          </Link>
          <Link href="/dashboard"
            className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-sm font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">
            Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currencySymbol = settings?.currency_symbol ?? "$";
  const sellerName = user?.full_name ?? user?.email ?? "Vendedor";
  const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL ?? "";
  const isAdmin = user?.email === superAdminEmail;
  const companyName = user?.companies?.name ?? "";

  // Get subscription info
  let planName = "";
  let daysLeft: number | null = null;
  let repairsAllowed = false;
  if (user?.company_id) {
    const [subscription, repairsAccess] = await Promise.all([
      getCompanySubscription(user.company_id),
      canAccessRepairs(user.company_id),
    ]);
    repairsAllowed = repairsAccess.allowed;
    if (subscription) {
      planName = (subscription as any).plan?.name ?? "";
      if (subscription.current_period_end) {
        const end = new Date(subscription.current_period_end);
        const now = new Date();
        daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }
    }
  }

  return (
    <POSPageClient
      currencySymbol={currencySymbol}
      openingId={opening.id}
      sellerName={sellerName}
      financial={financial}
      isAdmin={isAdmin}
      companyName={companyName}
      planName={planName}
      daysLeft={daysLeft}
      repairsAllowed={repairsAllowed}
    />
  );
}
