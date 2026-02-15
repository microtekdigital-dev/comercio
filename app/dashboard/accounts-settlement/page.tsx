import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountsSettlementReport } from "@/components/dashboard/accounts-settlement-report";

export const metadata = {
  title: "Liquidación de Cuentas",
  description: "Estado consolidado de cuentas por cobrar y pagar",
};

export default async function AccountsSettlementPage() {
  const supabase = await createClient();

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Get user profile and company
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <AccountsSettlementReport
        companyId={profile.company_id}
        companyName={profile.full_name || "Mi Empresa"}
        currency="ARS"
      />
    </div>
  );
}
