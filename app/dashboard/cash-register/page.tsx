import { getCashRegisterClosures, getCashRegisterOpenings } from "@/lib/actions/cash-register"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, User, DollarSign, TrendingUp, Clock } from "lucide-react"
import Link from "next/link"

export default async function CashRegisterPage() {
  const [closures, openings] = await Promise.all([
    getCashRegisterClosures(),
    getCashRegisterOpenings()
  ])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  // Get last 5 openings
  const recentOpenings = openings.slice(0, 5)

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Apertura/Cierre Caja</h2>
          <p className="text-muted-foreground">
            Gestiona las aperturas y cierres de caja
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/cash-register/opening/new">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Apertura
            </Button>
          </Link>
          <Link href="/dashboard/cash-register/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cierre
            </Button>
          </Link>
        </div>
      </div>

      {/* Aperturas Recientes */}
      {recentOpenings.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Aperturas Recientes
          </h3>
          <div className="grid gap-4">
            {recentOpenings.map((opening) => (
              <Card key={opening.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {formatDate(opening.opening_date)}
                        <Badge variant="secondary">{opening.shift}</Badge>
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        {opening.opened_by_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(opening.initial_cash_amount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Monto inicial
                      </div>
                    </div>
                  </div>
                </CardHeader>
                {opening.notes && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{opening.notes}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Cierres de Caja */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Cierres de Caja
        </h3>
        
        {closures.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay cierres de caja</h3>
              <p className="text-muted-foreground text-center mb-4">
                Comienza creando tu primer cierre de caja
              </p>
              <Link href="/dashboard/cash-register/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Cierre
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {closures.map((closure) => (
            <Card key={closure.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {formatDate(closure.closure_date)}
                      {closure.shift && (
                        <Badge variant="outline">{closure.shift}</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      {closure.closed_by_name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {formatCurrency(closure.total_sales_amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {closure.total_sales_count} {closure.total_sales_count === 1 ? "venta" : "ventas"}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Efectivo</p>
                    <p className="text-lg font-semibold">{formatCurrency(closure.cash_sales)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tarjeta</p>
                    <p className="text-lg font-semibold">{formatCurrency(closure.card_sales)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transferencia</p>
                    <p className="text-lg font-semibold">{formatCurrency(closure.transfer_sales)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Otros</p>
                    <p className="text-lg font-semibold">{formatCurrency(closure.other_sales)}</p>
                  </div>
                </div>

                {closure.cash_counted !== null && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Efectivo Esperado</p>
                        <p className="text-lg font-semibold">{formatCurrency(closure.cash_sales)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Efectivo Contado</p>
                        <p className="text-lg font-semibold">{formatCurrency(closure.cash_counted)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Diferencia</p>
                        <p className={`text-lg font-semibold ${
                          closure.cash_difference && closure.cash_difference < 0 
                            ? "text-red-500" 
                            : closure.cash_difference && closure.cash_difference > 0 
                            ? "text-green-500" 
                            : ""
                        }`}>
                          {closure.cash_difference !== null && formatCurrency(closure.cash_difference)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {closure.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Notas</p>
                    <p className="text-sm">{closure.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          </div>
        )}
      </div>
    </div>
  )
}
