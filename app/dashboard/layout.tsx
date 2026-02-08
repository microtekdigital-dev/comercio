import React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/actions/users"
import { DashboardSidebarServer } from "@/components/dashboard/sidebar-server"
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <DashboardSidebarServer />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 bg-muted/30 overflow-x-hidden">
          {children}
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  )
}
