import React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/actions/users"
import { getCompanySubscription } from "@/lib/actions/plans"
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

  // Get user's company and subscription status
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single()

  let subscriptionStatus: string | null = null

  // Only check subscription for admins
  if (profile?.company_id && profile.role === "admin") {
    const subscription = await getCompanySubscription(profile.company_id)
    subscriptionStatus = subscription?.status || null
  } else if (profile?.role === "employee") {
    // Employees always have access (RLS handles this)
    subscriptionStatus = "active"
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
