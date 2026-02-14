"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CalendarIcon, FileSpreadsheet, FileText, Download, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Category, Product } from "@/lib/types/erp"

interface InventoryReportFiltersProps {
  startDate: Date | null
  endDate: Date | null
  categoryFilter: string | null
  productFilter: string | null
  categories: Category[]
  products: Product[]
  onStartDateChange: (date: Date | null) => void
  onEndDateChange: (date: Date | null) => void
  onCategoryChange: (categoryId: string | null) => void
  onProductChange: (productId: string | null) => void
  onGenerateReport: () => void
  onExport: (format: "excel" | "csv" | "pdf") => void
  isLoading: boolean
  validationError: string | null
}

export function InventoryReportFilters({
  startDate,
  endDate,
  categoryFilter,
  productFilter,
  categories,
  products,
  onStartDateChange,
  onEndDateChange,
  onCategoryChange,
  onProductChange,
  onGenerateReport,
  onExport,
  isLoading,
  validationError,
}: InventoryReportFiltersProps) {
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  const clearFilters = () => {
    onStartDateChange(null)
    onEndDateChange(null)
    onCategoryChange(null)
    onProductChange(null)
  }

  const isGenerateDisabled = !startDate || !endDate || isLoading || !!validationError

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Start Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha Inicio</label>
          <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP", { locale: es }) : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate || undefined}
                onSelect={(date) => {
                  onStartDateChange(date || null)
                  setStartDateOpen(false)
                }}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha Fin</label>
          <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP", { locale: es }) : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate || undefined}
                onSelect={(date) => {
                  onEndDateChange(date || null)
                  setEndDateOpen(false)
                }}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Categoría (Opcional)</label>
          <Select
            value={categoryFilter || "all"}
            onValueChange={(value) => onCategoryChange(value === "all" ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Product Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Producto (Opcional)</label>
          <Select
            value={productFilter || "all"}
            onValueChange={(value) => onProductChange(value === "all" ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los productos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los productos</SelectItem>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950 p-3 rounded-md">
          {validationError}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={onGenerateReport}
          disabled={isGenerateDisabled}
          className="flex-1 sm:flex-none"
        >
          {isLoading ? "Generando..." : "Generar Reporte"}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={isLoading}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport("excel")}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar a Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("csv")}>
              <FileText className="mr-2 h-4 w-4" />
              Exportar a CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("pdf")}>
              <FileText className="mr-2 h-4 w-4" />
              Exportar a PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" onClick={clearFilters} disabled={isLoading}>
          <X className="mr-2 h-4 w-4" />
          Limpiar Filtros
        </Button>
      </div>
    </div>
  )
}
