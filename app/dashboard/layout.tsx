import React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/actions/users"
import { DashboardSidebarServer } from "@/components/dashboard/sidebar-server"
import { DashboardHeader } from "@/components/dashboard/header"
import { SubscriptionGuard } from "@/components/dashboard/subscription-guard"
import { Toaster } from "sonner"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  let subscriptionStatus: string | null = null;

  if (user.company_id) {
    // NO llamar a ensureTrialSubscription aquí - solo verificar el estado
    const supabase = await createClient();
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("company_id", user.company_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    subscriptionStatus = subscription?.status || null;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <DashboardSidebarServer />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 bg-muted/30 overflow-x-hidden">
          <SubscriptionGuard subscriptionStatus={subscriptionStatus}>
            {children}
          </SubscriptionGuard>
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  )
}
