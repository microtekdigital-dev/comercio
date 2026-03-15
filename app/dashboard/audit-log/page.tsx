import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAuditLogs } from "@/lib/actions/audit-log"
import { AuditLogTable } from "@/components/dashboard/audit-log-table"

export default async function AuditLogPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") redirect("/dashboard")

  const initialLogs = await getAuditLogs({ page: 1, pageSize: 50 })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Log de Auditoría</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registro de todas las operaciones realizadas en el sistema
        </p>
      </div>
      <AuditLogTable initialLogs={initialLogs} />
    </div>
  )
}
