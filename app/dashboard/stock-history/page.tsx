import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/actions/users"
import { canAccessStockHistory } from "@/lib/utils/plan-limits"
import { getStockMovements } from "@/lib/actions/stock-movements"
import { getProducts } from "@/lib/actions/products"
import { StockHistoryTable } from "@/components/dashboard/stock-history-table"

export default async function StockHistoryPage() {
  const user = await getCurrentUser()
  if (!user?.company_id) redirect("/pos")

  const permission = await canAccessStockHistory(user.company_id)
  if (!permission.allowed) redirect("/pos?error=insufficient_permissions")

  const [movements, products] = await Promise.all([
    getStockMovements(),
    getProducts(),
  ])

  const employeesMap = new Map()
  movements.forEach(m => {
    if (!employeesMap.has(m.created_by)) {
      employeesMap.set(m.created_by, { id: m.created_by, name: m.created_by_name })
    }
  })
  const employees = Array.from(employeesMap.values())

  return (
    <div className="space-y-3 text-black">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1">
          <span className="text-white text-sm font-bold">📈 Historial de Stock ({movements.length} movimientos)</span>
        </div>
        <div className="bg-[#d4d0c8] p-3">
          <StockHistoryTable movements={movements} employees={employees} />
        </div>
      </div>
    </div>
  )
}
