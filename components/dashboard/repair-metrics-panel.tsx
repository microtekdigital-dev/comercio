import { getRepairMetrics } from "@/lib/actions/repair-metrics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wrench, TrendingUp, Clock } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export async function RepairMetricsPanel({ companyId }: { companyId: string }) {
  const metrics = await getRepairMetrics(companyId)

  if (!metrics) {
    return null // No mostrar nada si no tiene acceso
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: metrics.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: es
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-semibold">Reparaciones</h2>
        <Link 
          href="/dashboard/repairs" 
          className="text-sm text-primary hover:underline"
        >
          Ver todas
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Importe Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos por Reparaciones
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-50">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.completedCount} reparaciones completadas
            </p>
          </CardContent>
        </Card>

        {/* Reparaciones Recientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Últimas Reparaciones
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-50">
              <Wrench className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {metrics.recentRepairs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay reparaciones completadas
              </p>
            ) : (
              <div className="space-y-3">
                {metrics.recentRepairs.map((repair) => (
                  <Link
                    key={repair.id}
                    href={`/dashboard/repairs/${repair.id}`}
                    className="block hover:bg-accent rounded-lg p-2 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          #{repair.order_number} - {repair.customer_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {repair.device_brand} {repair.device_model}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {formatDate(repair.delivered_date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          {formatCurrency(repair.total_amount)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
