import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserTickets, getSupportStats } from "@/lib/actions/support";
import { SupportTicketsList } from "@/components/dashboard/support-tickets-list";
import { SupportStatsCards } from "@/components/dashboard/support-stats-cards";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function SupportPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect("/auth/login");
  }

  const [tickets, stats] = await Promise.all([
    getUserTickets(),
    getSupportStats(),
  ]);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Soporte</h2>
          <p className="text-muted-foreground">
            Gestiona tus tickets de soporte y obtén ayuda
          </p>
        </div>
        <Link href="/dashboard/support/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Ticket
          </Button>
        </Link>
      </div>

      {stats && <SupportStatsCards stats={stats} />}

      <Suspense fallback={<div>Cargando tickets...</div>}>
        <SupportTicketsList tickets={tickets} />
      </Suspense>
    </div>
  );
}
