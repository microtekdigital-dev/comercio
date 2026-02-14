"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Package } from "lucide-react"
import type { InventoryReportRow } from "@/lib/types/inventory-report"

interface InventoryReportTableProps {
  data: InventoryReportRow[]
  isLoading: boolean
  currency?: string
}

export function InventoryReportTable({ 
  data, 
  isLoading,
  currency = "ARS"
}: InventoryReportTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(value)
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay datos</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          No se encontraron movimientos en el período seleccionado. Intente con un rango de fechas diferente.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[150px]">Producto</TableHead>
            <TableHead className="min-w-[120px]">Variante</TableHead>
            <TableHead className="min-w-[120px]">Categoría</TableHead>
            <TableHead className="text-right min-w-[100px]">
              Exist. Inicial<br />
              <span className="text-xs font-normal">(Unidades)</span>
            </TableHead>
            <TableHead className="text-right min-w-[120px]">
              Exist. Inicial<br />
              <span className="text-xs font-normal">(Valor)</span>
            </TableHead>
            <TableHead className="text-right min-w-[100px]">
              Compras<br />
              <span className="text-xs font-normal">(Unidades)</span>
            </TableHead>
            <TableHead className="text-right min-w-[120px]">
              Compras<br />
              <span className="text-xs font-normal">(Valor)</span>
            </TableHead>
            <TableHead className="text-right min-w-[100px]">
              Ventas<br />
              <span className="text-xs font-normal">(Unidades)</span>
            </TableHead>
            <TableHead className="text-right min-w-[120px]">
              Ventas<br />
              <span className="text-xs font-normal">(Valor)</span>
            </TableHead>
            <TableHead className="text-right min-w-[100px]">
              Exist. Final<br />
              <span className="text-xs font-normal">(Unidades)</span>
            </TableHead>
            <TableHead className="text-right min-w-[120px]">
              Exist. Final<br />
              <span className="text-xs font-normal">(Valor)</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={`${row.productId}-${row.variantId || 'null'}-${index}`}>
              <TableCell className="font-medium">{row.productName}</TableCell>
              <TableCell className="text-muted-foreground">
                {row.variantName || "-"}
              </TableCell>
              <TableCell>{row.categoryName}</TableCell>
              <TableCell className="text-right tabular-nums">
                {row.initialStockUnits}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(row.initialStockValue)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.purchasesUnits}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(row.purchasesValue)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.salesUnits}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(row.salesValue)}
              </TableCell>
              <TableCell className="text-right tabular-nums font-semibold">
                {row.finalStockUnits}
              </TableCell>
              <TableCell className="text-right tabular-nums font-semibold">
                {formatCurrency(row.finalStockValue)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
