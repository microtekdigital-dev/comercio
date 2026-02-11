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
import { CalendarIcon, Filter, X, Download, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { exportPriceChangesToCSV } from "@/lib/actions/price-changes"
import { toast } from "sonner"
import type { PriceChange } from "@/lib/types/erp"

interface PriceHistoryTableProps {
  changes: PriceChange[]
  employees?: Array<{ id: string; name: string }>
  products?: Array<{ id: string; name: string }>
  currencySymbol?: string
}

export function PriceHistoryTable({ 
  changes, 
  employees = [], 
  products = [],
  currencySymbol = "$"
}: PriceHistoryTableProps) {
  const [filteredChanges, setFilteredChanges] = useState(changes)
  const [priceTypeFilter, setPriceTypeFilter] = useState<string>("all")
  const [employeeFilter, setEmployeeFilter] = useState<string>("all")
  const [productFilter, setProductFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [isExporting, setIsExporting] = useState(false)

  // Apply filters
  const applyFilters = () => {
    let filtered = changes

    if (priceTypeFilter !== "all") {
      filtered = filtered.filter(c => c.price_type === priceTypeFilter)
    }

    if (employeeFilter !== "all") {
      filtered = filtered.filter(c => c.changed_by === employeeFilter)
    }

    if (productFilter !== "all") {
      filtered = filtered.filter(c => c.product_id === productFilter)
    }

    if (dateFrom) {
      filtered = filtered.filter(c => new Date(c.created_at) >= dateFrom)
    }

    if (dateTo) {
      const endOfDay = new Date(dateTo)
      endOfDay.setHours(23, 59, 59, 999)
      filtered = filtered.filter(c => new Date(c.created_at) <= endOfDay)
    }

    setFilteredChanges(filtered)
  }

  // Clear filters
  const clearFilters = () => {
    setPriceTypeFilter("all")
    setEmployeeFilter("all")
    setProductFilter("all")
    setDateFrom(undefined)
    setDateTo(undefined)
    setFilteredChanges(changes)
  }

  // Export to CSV
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const filters: any = {}
      
      if (priceTypeFilter !== "all") filters.priceType = priceTypeFilter
      if (employeeFilter !== "all") filters.employeeId = employeeFilter
      if (productFilter !== "all") filters.productId = productFilter
      if (dateFrom) filters.dateFrom = dateFrom.toISOString()
      if (dateTo) filters.dateTo = dateTo.toISOString()

      const csv = await exportPriceChangesToCSV(filters)
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `historial-precios-${format(new Date(), 'yyyy-MM-dd')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success("Historial exportado correctamente")
    } catch (error) {
      console.error("Error exporting:", error)
      toast.error("Error al exportar el historial")
    } finally {
      setIsExporting(false)
    }
  }

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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex-1 min-w-[180px]">
          <label className="text-sm font-medium mb-2 block">Tipo de precio</label>
          <Select value={priceTypeFilter} onValueChange={setPriceTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="sale_price">Precio de Venta</SelectItem>
              <SelectItem value="cost_price">Precio de Costo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {products.length > 0 && (
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Producto</label>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {products.map(prod => (
                  <SelectItem key={prod.id} value={prod.id}>
                    {prod.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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

        <div className="flex-1 min-w-[180px]">
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

        <div className="flex-1 min-w-[180px]">
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
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={isExporting || filteredChanges.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredChanges.length} de {changes.length} cambios de precio
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Precio Anterior</TableHead>
              <TableHead className="text-right">Precio Nuevo</TableHead>
              <TableHead className="text-right">Diferencia</TableHead>
              <TableHead>Empleado</TableHead>
              <TableHead>Razón</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredChanges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No se encontraron cambios de precio
                </TableCell>
              </TableRow>
            ) : (
              filteredChanges.map((change) => {
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
                      <div className="flex flex-col">
                        <span className="font-medium">{change.product?.name || "Producto eliminado"}</span>
                        {change.product?.sku && (
                          <span className="text-xs text-muted-foreground">
                            SKU: {change.product.sku}
                          </span>
                        )}
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
                            "font-medium font-mono",
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
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
