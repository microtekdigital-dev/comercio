"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PriceChange } from "@/lib/types/erp"

interface ProductPriceHistoryProps {
  changes: PriceChange[]
  currencySymbol?: string
}

export function ProductPriceHistory({ 
  changes, 
  currencySymbol = "$" 
}: ProductPriceHistoryProps) {
  // Get price type label and color
  const getPriceTypeInfo = (type: string) => {
    return type === 'sale_price' 
      ? { label: "Precio de Venta", variant: "default" as const }
      : { label: "Precio de Costo", variant: "secondary" as const }
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return `${currencySymbol}${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
  }

  // Calculate difference
  const calculateDifference = (oldValue: number, newValue: number) => {
    const diff = newValue - oldValue
    const percentage = oldValue > 0 ? ((diff / oldValue) * 100).toFixed(1) : "0.0"
    return { diff, percentage }
  }

  if (changes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Precios</CardTitle>
          <CardDescription>
            No hay cambios de precio registrados para este producto
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Precios</CardTitle>
        <CardDescription>
          Registro de todos los cambios de precio de este producto ({changes.length} cambios)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Precio Anterior</TableHead>
                <TableHead className="text-right">Precio Nuevo</TableHead>
                <TableHead className="text-right">Diferencia</TableHead>
                <TableHead>Empleado</TableHead>
                <TableHead>Razón</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {changes.map((change) => {
                const typeInfo = getPriceTypeInfo(change.price_type)
                const { diff, percentage } = calculateDifference(change.old_value, change.new_value)
                
                return (
                  <TableRow key={change.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {format(new Date(change.created_at), "dd/MM/yyyy", { locale: es })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(change.created_at), "HH:mm:ss")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeInfo.variant}>
                        {typeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(change.old_value)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(change.new_value)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          {diff > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={cn(
                            "font-medium font-mono text-sm",
                            diff > 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {diff > 0 ? "+" : ""}{formatCurrency(diff)}
                          </span>
                        </div>
                        <span className={cn(
                          "text-xs",
                          diff > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          ({diff > 0 ? "+" : ""}{percentage}%)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{change.changed_by_name}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {change.changed_by_role}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      {change.reason ? (
                        <span className="text-sm text-muted-foreground">
                          {change.reason}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
