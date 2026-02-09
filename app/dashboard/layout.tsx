import React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/actions/users"
import { getCompanySubscription } from "@/lib/actions/plans"
import { DashboardSidebarServer } from "@/components/dashboard/sidebar-server"
import { DashboardHeader } from "@/components/dashboard/header"
import { SubscriptionGuard } from "@/components/dashboard/subscription-guard"
import { SupportChatButton } from "@/components/dashboard/support-chat-button"
import { getUnreadMessageCount } from "@/lib/actions/support"
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

  // Check subscription for both admins and employees
  if (profile?.company_id) {
    const subscription = await getCompanySubscription(profile.company_id)
    
    console.log("[DashboardLayout] Company ID:", profile.company_id)
    console.log("[DashboardLayout] Subscription found:", subscription ? "YES" : "NO")
    console.log("[DashboardLayout] Subscription status:", subscription?.status)
    console.log("[DashboardLayout] Subscription period end:", subscription?.current_period_end)
    
    // Check if subscription exists and is not expired
    if (subscription) {
      const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null
      const now = new Date()
      
      console.log("[DashboardLayout] Period end date:", periodEnd)
      console.log("[DashboardLayout] Current date:", now)
      console.log("[DashboardLayout] Is expired:", periodEnd ? periodEnd < now : "NO DATE")
      
      // If subscription is active but period has ended, mark as expired
      if (subscription.status === "active" && periodEnd && periodEnd < now) {
        subscriptionStatus = "expired"
        console.log("[DashboardLayout] Subscription marked as EXPIRED")
      } else {
        subscriptionStatus = subscription.status
        console.log("[DashboardLayout] Subscription status set to:", subscriptionStatus)
      }
    } else {
      subscriptionStatus = null
      console.log("[DashboardLayout] No subscription found, status set to NULL")
    }
  }

  // Get unread message count for support chat
  const unreadCount = await getUnreadMessageCount()

  return (
    <SubscriptionGuard subscriptionStatus={subscriptionStatus} userRole={profile?.role || null}>
      <div className="min-h-screen flex flex-col md:flex-row">
        <DashboardSidebarServer />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 bg-muted/30 overflow-x-hidden">
            {children}
          </main>
        </div>
        <Toaster position="top-right" richColors />
        <SupportChatButton unreadCount={unreadCount} />
      </div>
    </SubscriptionGuard>
  )
}
