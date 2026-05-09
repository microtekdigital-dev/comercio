import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAuditLogs } from "@/lib/actions/audit-log"
import { AuditLogTable } from "@/components/dashboard/audit-log-table"

export default async function AuditLogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (!profile || profile.role !== "admin") redirect("/dashboard")

  const initialLogs = await getAuditLogs({ page: 1, pageSize: 50 })

  return (
    <div className="space-y-3 text-black select-none">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1">
          <span className="text-white text-sm font-bold">📋 Log de Auditoría</span>
        </div>
        <div className="bg-[#d4d0c8] p-3">
          <p className="text-xs text-gray-600 mb-3">Registro de todas las operaciones realizadas en el sistema</p>
          <AuditLogTable initialLogs={initialLogs} />
        </div>
      </div>
    </div>
  )
}
