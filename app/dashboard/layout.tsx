import React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/actions/users"
import { ensureTrialSubscription } from "@/lib/actions/subscriptions"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Toaster } from "sonner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  if (user.company_id) {
    await ensureTrialSubscription(user.company_id)
  }

  return (
    <div className="min-h-screen flex">
      <DashboardSidebar user={user} />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 bg-muted/30">
          {children}
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  )
}
