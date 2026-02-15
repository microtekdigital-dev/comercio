import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountsSettlementReport } from "@/components/dashboard/accounts-settlement-report";
import { canAccessAccountsSettlement } from "@/lib/utils/plan-limits";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

  // Check if user has access to accounts settlement
  const access = await canAccessAccountsSettlement(profile.company_id);

  if (!access.allowed) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Liquidación de Cuentas</h1>
          <p className="text-muted-foreground mt-2">
            Estado consolidado de cuentas por cobrar y pagar
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Funcionalidad no disponible</AlertTitle>
          <AlertDescription className="mt-2">
            {access.message}
            <div className="mt-4">
              <Button asChild>
                <Link href="/dashboard/billing">
                  Ver Planes
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
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
