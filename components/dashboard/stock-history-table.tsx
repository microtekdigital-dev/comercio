"use client"

import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Filter, X, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StockMovement } from "@/lib/types/erp"

interface StockHistoryTableProps {
  movements: StockMovement[]
  employees?: Array<{ id: string; name: string }>
}

export function StockHistoryTable({ movements, employees = [] }: StockHistoryTableProps) {
  const [filteredMovements, setFilteredMovements] = useState(movements)
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>("all")
  const [employeeFilter, setEmployeeFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()

  // Apply filters
  const applyFilters = () => {
    let filtered = movements

    if (movementTypeFilter !== "all") {
      filtered = filtered.filter(m => m.movement_type === movementTypeFilter)
    }

    if (employeeFilter !== "all") {
      filtered = filtered.filter(m => m.created_by === employeeFilter)
    }

    if (dateFrom) {
      filtered = filtered.filter(m => new Date(m.created_at) >= dateFrom)
    }

    if (dateTo) {
      const endOfDay = new Date(dateTo)
      endOfDay.setHours(23, 59, 59, 999)
      filtered = filtered.filter(m => new Date(m.created_at) <= endOfDay)
    }

    setFilteredMovements(filtered)
  }

  // Clear filters
  const clearFilters = () => {
    setMovementTypeFilter("all")
    setEmployeeFilter("all")
    setDateFrom(undefined)
    setDateTo(undefined)
    setFilteredMovements(movements)
  }

  // Get movement type label and color
  const getMovementTypeInfo = (type: string) => {
    const types: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      purchase: { label: "Compra", variant: "default" },
      sale: { label: "Venta", variant: "secondary" },
      adjustment_in: { label: "Ajuste +", variant: "outline" },
      adjustment_out: { label: "Ajuste -", variant: "outline" },
      return_in: { label: "Devolución +", variant: "default" },
      return_out: { label: "Devolución -", variant: "destructive" },
    }
    return types[type] || { label: type, variant: "outline" as const }
  }

  // Check if movement is manual or automatic
  const isManualMovement = (type: string) => {
    return ['adjustment_in', 'adjustment_out', 'return_in', 'return_out'].includes(type)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Tipo de movimiento</label>
          <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="purchase">Compra</SelectItem>
              <SelectItem value="sale">Venta</SelectItem>
              <SelectItem value="adjustment_in">Ajuste +</SelectItem>
              <SelectItem value="adjustment_out">Ajuste -</SelectItem>
              <SelectItem value="return_in">Devolución +</SelectItem>
              <SelectItem value="return_out">Devolución -</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {employees.length > 0 && (
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Empleado</label>
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Desde</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "PPP", { locale: es }) : "Seleccionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Hasta</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "PPP", { locale: es }) : "Seleccionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-end gap-2">
          <Button onClick={applyFilters}>
            <Filter className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Limpiar
          </Button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredMovements.length} de {movements.length} movimientos
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Stock Anterior</TableHead>
              <TableHead className="text-right">Stock Nuevo</TableHead>
              <TableHead>Empleado</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No se encontraron movimientos
                </TableCell>
              </TableRow>
            ) : (
              filteredMovements.map((movement) => {
                const typeInfo = getMovementTypeInfo(movement.movement_type)
                const isManual = isManualMovement(movement.movement_type)
                
                return (
                  <TableRow key={movement.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {format(new Date(movement.created_at), "dd/MM/yyyy", { locale: es })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(movement.created_at), "HH:mm:ss")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={typeInfo.variant}>
                          {typeInfo.label}
                        </Badge>
                        {movement.purchase_order_id ? (
                          <span className="text-xs text-muted-foreground">
                            Orden de Compra
                          </span>
                        ) : movement.sale_id ? (
                          <span className="text-xs text-muted-foreground">
                            Venta
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {isManual ? "Manual" : "Automático"}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{movement.product?.name}</span>
                        {movement.product?.sku && (
                          <span className="text-xs text-muted-foreground">
                            SKU: {movement.product.sku}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {movement.quantity > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className={cn(
                          "font-medium",
                          movement.quantity > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {movement.stock_before}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {movement.stock_after}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{movement.created_by_name}</span>
                    </TableCell>
                    <TableCell>
                      {movement.sale_id && (
                        <Badge variant="secondary">Venta</Badge>
                      )}
                      {movement.purchase_order_id && (
                        <Badge variant="default">Orden de Compra</Badge>
                      )}
                      {!movement.sale_id && !movement.purchase_order_id && (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {movement.notes ? (
                        <span className="text-sm text-muted-foreground truncate block">
                          {movement.notes}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
