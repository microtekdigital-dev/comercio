import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSupportDashboard } from "@/components/dashboard/admin-support-dashboard";

export default async function AdminSupportPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect("/dashboard");
  }

  // CRITICAL: Only allow specific super admin email
  // Replace with YOUR email address
  const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "tu-email@ejemplo.com";
  
  if (user.email !== SUPER_ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  // Get all tickets (super admin can see all)
  const { data: tickets } = await supabase
    .from("support_tickets")
    .select(`
      *,
      company:companies(name),
      user:profiles!support_tickets_user_id_fkey(email, full_name)
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="flex-1 h-screen overflow-hidden">
      <Suspense fallback={<div>Cargando...</div>}>
        <AdminSupportDashboard initialTickets={tickets || []} />
      </Suspense>
    </div>
  );
}
