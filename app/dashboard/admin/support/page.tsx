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

  // Fetch tickets without joins (more reliable)
  let tickets = null;

  try {
    const { data: ticketsData, error: ticketsError } = await adminClient
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (ticketsError) {
      console.error("[AdminSupport] Error fetching tickets:", ticketsError);
      tickets = [];
    } else {
      console.log("[AdminSupport] Tickets fetched:", ticketsData?.length || 0);
      
      // Fetch related data separately
      if (ticketsData && ticketsData.length > 0) {
        const companyIds = [...new Set(ticketsData.map(t => t.company_id))];
        const userIds = [...new Set(ticketsData.map(t => t.user_id))];

        const { data: companies } = await adminClient
          .from("companies")
          .select("id, name")
          .in("id", companyIds);

        const { data: users } = await adminClient
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds);

        // Combine data
        tickets = ticketsData.map(ticket => ({
          ...ticket,
          company: companies?.find(c => c.id === ticket.company_id) || null,
          user: users?.find(u => u.id === ticket.user_id) || null,
        }));

        console.log("[AdminSupport] Related data fetched and combined");
      } else {
        tickets = ticketsData || [];
      }
    }
  } catch (error) {
    console.error("[AdminSupport] Exception fetching tickets:", error);
    tickets = [];
  }

  return (
    <div className="flex-1 h-screen overflow-hidden">
      <Suspense fallback={<div>Cargando...</div>}>
        <AdminSupportDashboard initialTickets={tickets || []} />
      </Suspense>
    </div>
  );
}
