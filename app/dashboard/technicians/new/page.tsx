import { TechnicianForm } from "@/components/dashboard/technician-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NewTechnicianPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Técnico</h1>
        <p className="text-muted-foreground">
          Registra un nuevo técnico para asignar reparaciones
        </p>
      </div>

      <TechnicianForm companyId={profile.company_id} />
    </div>
  );
}
