import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { AdminSupportDashboard } from "@/components/dashboard/admin-support-dashboard";

export default async function AdminSupportPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect("/dashboard");
  }

  // CRITICAL: Only allow specific super admin email
  const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "tu-email@ejemplo.com";
  
  if (user.email !== SUPER_ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  // Use admin client to bypass RLS and get all tickets
  const adminClient = createAdminClient();
  
  if (!adminClient) {
    console.error("Admin client not available - check SUPABASE_SERVICE_ROLE_KEY");
    return (
      <div className="flex-1 h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Error de Configuración</h2>
          <p className="text-muted-foreground mt-2">
            No se pudo crear el cliente admin. Verifica que SUPABASE_SERVICE_ROLE_KEY esté configurado.
          </p>
        </div>
      </div>
    );
  }

  const { data: tickets, error: ticketsError } = await adminClient
    .from("support_tickets")
    .select(`
      *,
      company:companies(name),
      user:profiles!support_tickets_user_id_fkey(email, full_name)
    `)
    .order("created_at", { ascending: false });

  if (ticketsError) {
    console.error("Error fetching tickets:", ticketsError);
  }

  console.log("[AdminSupport] Tickets fetched:", tickets?.length || 0);

  return (
    <div className="flex-1 h-screen overflow-hidden">
      <Suspense fallback={<div>Cargando...</div>}>
        <AdminSupportDashboard initialTickets={tickets || []} />
      </Suspense>
    </div>
  );
}
