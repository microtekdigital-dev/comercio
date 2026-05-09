import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountsSettlementReport } from "@/components/dashboard/accounts-settlement-report";
import { canAccessAccountsSettlement } from "@/lib/utils/plan-limits";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Liquidación de Cuentas",
  description: "Estado consolidado de cuentas por cobrar y pagar",
};

export default async function AccountsSettlementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles").select("company_id, full_name").eq("id", user.id).single();
  if (!profile?.company_id) redirect("/dashboard");

  const access = await canAccessAccountsSettlement(profile.company_id);

  if (!access.allowed) {
    return (
      <div className="space-y-3 text-black select-none">
        <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
          <div className="bg-[#000080] px-3 py-1">
            <span className="text-white text-sm font-bold">💰 Liquidación de Cuentas</span>
          </div>
          <div className="bg-[#d4d0c8] p-4">
            <div className="border-2 border-[#cc0000] bg-[#fff0f0] p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-700 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-red-700 mb-1">Funcionalidad no disponible</div>
                <p className="text-xs text-gray-700">{access.message}</p>
                <Link href="/dashboard/billing" className="inline-block mt-2 border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0]">
                  Ver Planes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-black select-none">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1">
          <span className="text-white text-sm font-bold">💰 Liquidación de Cuentas</span>
        </div>
        <div className="bg-[#d4d0c8] p-3">
          <AccountsSettlementReport
            companyId={profile.company_id}
            companyName={profile.full_name || "Mi Empresa"}
            currency="ARS"
          />
        </div>
      </div>
    </div>
  );
}
