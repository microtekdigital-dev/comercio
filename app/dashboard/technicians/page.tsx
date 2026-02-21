import { Suspense } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TechniciansTable } from "@/components/dashboard/technicians-table";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function TechniciansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: session } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", user.id)
    .single();

  if (!session) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Técnicos</h1>
          <p className="text-muted-foreground">
            Gestiona los técnicos que realizan las reparaciones
          </p>
        </div>
        <Link href="/dashboard/technicians/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Técnico
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div>Cargando...</div>}>
        <TechniciansTable companyId={session.company_id} />
      </Suspense>
    </div>
  );
}
