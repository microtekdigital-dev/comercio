import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { canAccessCashRegister } from "@/lib/utils/plan-limits"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CashRegisterClient } from "@/components/dashboard/cash-register-client"

export default async function CashRegisterPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user's company
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single()

  if (!profile?.company_id) {
    redirect("/dashboard")
  }

  // Check if user has access to cash register
  const access = await canAccessCashRegister(profile.company_id)

  if (!access.allowed) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Apertura/Cierre Caja</h2>
          <p className="text-muted-foreground">
            Gestiona las aperturas y cierres de caja
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Funcionalidad no disponible</AlertTitle>
          <AlertDescription className="mt-2">
            {access.message}
            <div className="mt-4">
              <Button asChild>
                <Link href="/dashboard/billing">
                  Ver Planes
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <CashRegisterClient />
}
