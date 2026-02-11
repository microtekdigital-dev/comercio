import { getStockMovements } from "@/lib/actions/stock-movements"
import { getProducts } from "@/lib/actions/products"
import { StockHistoryTable } from "@/components/dashboard/stock-history-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { History } from "lucide-react"

export default async function StockHistoryPage() {
  const [movements, products] = await Promise.all([
    getStockMovements(),
    getProducts(),
  ])

  // Get unique employees from movements
  const employeesMap = new Map()
  movements.forEach(movement => {
    if (!employeesMap.has(movement.created_by)) {
      employeesMap.set(movement.created_by, {
        id: movement.created_by,
        name: movement.created_by_name
      })
    }
  })
  const employees = Array.from(employeesMap.values())

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <History className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Historial de Stock</h2>
          <p className="text-muted-foreground">
            Registro completo de todos los movimientos de inventario
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos de Inventario</CardTitle>
          <CardDescription>
            Visualiza y filtra todos los movimientos de stock de tu empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StockHistoryTable movements={movements} employees={employees} />
        </CardContent>
      </Card>
    </div>
  )
}
