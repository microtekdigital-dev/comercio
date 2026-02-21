import { notFound, redirect } from "next/navigation";
import { getTechnicianById } from "@/lib/actions/technicians";
import { TechnicianForm } from "@/components/dashboard/technician-form";
import { createClient } from "@/lib/supabase/server";

export default async function EditTechnicianPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap params Promise (Next.js 15+)
  const { id } = await params;

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

  const technician = await getTechnicianById(id);

  if (!technician) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Técnico</h1>
        <p className="text-muted-foreground">
          Actualiza la información del técnico
        </p>
      </div>

      <TechnicianForm technician={technician} companyId={profile.company_id} />
    </div>
  );
}
