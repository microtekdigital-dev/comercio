import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { canAccessCashRegister } from "@/lib/utils/plan-limits"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { CashRegisterClient } from "@/components/dashboard/cash-register-client"

export default async function CashRegisterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single()
  if (!profile?.company_id) redirect("/pos")

  const access = await canAccessCashRegister(profile.company_id)

  if (!access.allowed) {
    return (
      <div className="space-y-3 text-black">
        <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
          <div className="bg-[#000080] px-3 py-1">
            <span className="text-white text-sm font-bold">💰 Apertura / Cierre de Caja</span>
          </div>
          <div className="bg-[#d4d0c8] p-6 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-10 w-10 text-red-600" />
            <p className="text-sm font-bold">Funcionalidad no disponible</p>
            <p className="text-xs text-gray-600">{access.message}</p>
            <Link href="/dashboard/billing" className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">
              Ver Planes
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 text-black">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">💰 Apertura / Cierre de Caja</span>
          <Link href="/dashboard/cash-register/opening/new" className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] text-black">
            + Abrir Caja
          </Link>
        </div>
        <div className="bg-[#d4d0c8] p-2">
          <CashRegisterClient />
        </div>
      </div>
    </div>
  )
}
