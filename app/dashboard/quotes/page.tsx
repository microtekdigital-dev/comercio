import { getQuotes } from "@/lib/actions/quotes"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus } from "lucide-react"
import Link from "next/link"

export default async function QuotesPage() {
  const quotes = await getQuotes()

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "success" | "destructive"> = {
      draft: "secondary",
      sent: "default",
      accepted: "success",
      rejected: "destructive",
      expired: "secondary",
    }
    return <Badge variant={variants[status] || "default"}>{status}</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Presupuestos</h1>
          <p className="text-muted-foreground">Gestiona tus presupuestos y cotizaciones</p>
        </div>
        <Link href="/dashboard/quotes/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Presupuesto
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {quotes.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay presupuestos</h3>
            <p className="text-muted-foreground mb-4">Crea tu primer presupuesto</p>
            <Link href="/dashboard/quotes/new">
              <Button>Crear Presupuesto</Button>
            </Link>
          </Card>
        ) : (
          quotes.map((quote) => (
            <Link key={quote.id} href={`/dashboard/quotes/${quote.id}`}>
              <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{quote.quote_number}</h3>
                      {getStatusBadge(quote.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {quote.customer?.name || "Sin cliente"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Válido hasta: {new Date(quote.valid_until).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      ${quote.total.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(quote.quote_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
