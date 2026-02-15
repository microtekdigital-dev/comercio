import { getCurrentUser, getTeamMembers } from "@/lib/actions/users"
import { getInvitations } from "@/lib/actions/invitations"
import { needsInitialCashSetup } from "@/lib/actions/company-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Mail, Building2, Shield } from "lucide-react"
import { ERPStats } from "@/components/dashboard/erp-stats"
import { FinancialStatsPanel } from "@/components/dashboard/financial-stats-panel"
import { InitialCashSetupWrapper } from "@/components/dashboard/initial-cash-setup-wrapper"
import { PlanUsageServer } from "@/components/dashboard/plan-usage-server"
// import { TutorialBanner } from "@/components/dashboard/tutorial-banner"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const teamMembers = await getTeamMembers()
  const invitations = user?.role === "admin" ? await getInvitations() : []
  const needsSetup = await needsInitialCashSetup()
  
  const pendingInvitations = invitations.filter((inv) => inv.status === "pending")
  const adminCount = teamMembers.filter((m) => m.role === "admin").length
  const employeeCount = teamMembers.filter((m) => m.role === "employee").length

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-8">
      {/* Initial Cash Setup Modal */}
      <InitialCashSetupWrapper needsSetup={needsSetup} />
      
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          Bienvenido{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Resumen de tu negocio y organización
        </p>
      </div>

      {/* Tutorial Banner - Desactivado temporalmente */}
      {/* <TutorialBanner /> */}

      {/* Financial Statistics Panel */}
      <Suspense fallback={<FinancialStatsLoading />}>
        <FinancialStatsPanel />
      </Suspense>

      {/* ERP Statistics */}
      <Suspense fallback={<StatsLoading />}>
        <ERPStats />
      </Suspense>

      {/* Organization Stats */}
      <div>
        <h2 className="text-lg md:text-xl font-semibold mb-4">Organización</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Miembros del Equipo</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamMembers.length}</div>
              <p className="text-xs text-muted-foreground">
                {adminCount} admin{adminCount !== 1 ? "s" : ""}, {employeeCount} empleado{employeeCount !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          {user?.role === "admin" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Invitaciones Pendientes</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingInvitations.length}</div>
                <p className="text-xs text-muted-foreground">
                  Esperando respuesta
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empresa</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">
                {user?.companies?.name || "Mi Empresa"}
              </div>
              <p className="text-xs text-muted-foreground">
                {user?.companies?.slug || "empresa"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tu Rol</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{user?.role}</div>
              <p className="text-xs text-muted-foreground">
                {user?.role === "admin" ? "Acceso completo" : "Acceso limitado"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Plan Usage - Solo para admins */}
      {user?.role === "admin" && (
        <Suspense fallback={<PlanUsageLoading />}>
          <PlanUsageServer />
        </Suspense>
      )}
    </div>
  )
}

function StatsLoading() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-40 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FinancialStatsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardHeader className="space-y-0 pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PlanUsageLoading() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}
