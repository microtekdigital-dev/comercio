import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/actions/users"
import { canAccessPriceHistory } from "@/lib/utils/plan-limits"
import { createClient } from "@/lib/supabase/server"
import { getPriceChanges } from "@/lib/actions/price-changes"
import { PriceHistoryTable } from "@/components/dashboard/price-history-table"

export default async function PriceHistoryPage() {
  const user = await getCurrentUser()
  if (!user?.company_id) redirect("/pos")

  const permission = await canAccessPriceHistory(user.company_id)
  if (!permission.allowed) redirect("/pos?error=insufficient_permissions")

  const supabase = await createClient()
  const changes = await getPriceChanges()

  const { data: employees } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("company_id", user.company_id)
    .order("full_name")

  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .eq("company_id", user.company_id)
    .eq("is_active", true)
    .order("name")

  const { data: company } = await supabase
    .from("companies")
    .select("currency")
    .eq("id", user.company_id)
    .single()

  const currencySymbol = company?.currency === "USD" ? "$" : company?.currency === "EUR" ? "€" : "$"

  return (
    <div className="space-y-3 text-black">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1">
          <span className="text-white text-sm font-bold">💲 Historial de Precios ({changes.length} cambios)</span>
        </div>
        <div className="bg-[#d4d0c8] p-3">
          <PriceHistoryTable
            changes={changes}
            employees={employees?.map(e => ({ id: e.id, name: e.full_name || e.email })) || []}
            products={products?.map(p => ({ id: p.id, name: p.name })) || []}
            currencySymbol={currencySymbol}
          />
        </div>
      </div>
    </div>
  )
}
