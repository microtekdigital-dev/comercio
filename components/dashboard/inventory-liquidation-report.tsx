"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { InventoryReportFilters } from "./inventory-report-filters"
import { InventoryReportTable } from "./inventory-report-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  generateInventoryReport,
  exportInventoryReport 
} from "@/lib/actions/inventory-report"
import type { InventoryReportRow, ExportFormat } from "@/lib/types/inventory-report"
import type { Category, Product } from "@/lib/types/erp"

interface InventoryLiquidationReportProps {
  companyId: string
  companyName: string
  companyLogo?: string
  categories: Category[]
  products: Product[]
  currency?: string
}

/**
 * Validate date range for inventory report
 * Returns error message if validation fails, null if valid
 */
function validateDateRange(
  startDate: Date | null,
  endDate: Date | null
): string | null {
  // Check if both dates are present
  if (!startDate || !endDate) {
    return "Debe seleccionar ambas fechas";
  }

  // Check if start_date <= end_date
  if (startDate > endDate) {
    return "La fecha de inicio debe ser anterior o igual a la fecha de fin";
  }

  // Warning for future dates (not an error, just a warning)
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  if (endDate > today) {
    return "El período incluye fechas futuras, los datos pueden ser incompletos";
  }

  return null; // Valid
}

export function InventoryLiquidationReport({
  companyId,
  companyName,
  companyLogo,
  categories,
  products,
  currency = "ARS",
}: InventoryLiquidationReportProps) {
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [productFilter, setProductFilter] = useState<string | null>(null)
  const [reportData, setReportData] = useState<InventoryReportRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Validate dates whenever they change
  useEffect(() => {
    if (startDate || endDate) {
      const error = validateDateRange(startDate, endDate)
      setValidationError(error)
    } else {
      setValidationError(null)
    }
  }, [startDate, endDate])

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Debe seleccionar ambas fechas")
      return
    }

    const error = validateDateRange(startDate, endDate)
    if (error && !error.includes("futuras")) {
      toast.error(error)
      return
    }

    setIsLoading(true)
    try {
      const data = await generateInventoryReport({
        companyId,
        startDate,
        endDate,
        categoryId: categoryFilter || undefined,
        productId: productFilter || undefined,
      })

      setReportData(data)

      if (data.length === 0) {
        toast.info("No se encontraron movimientos en el período seleccionado")
      } else {
        toast.success(`Reporte generado: ${data.length} productos`)
      }
    } catch (error) {
      console.error("Error generating report:", error)
      toast.error("Error al generar el reporte. Intente nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async (format: ExportFormat) => {
    if (reportData.length === 0) {
      toast.error("Debe generar un reporte antes de exportar")
      return
    }

    if (!startDate || !endDate) {
      toast.error("Fechas no válidas")
      return
    }

    setIsExporting(true)
    try {
      const metadata = {
        companyName,
        periodStart: startDate,
        periodEnd: endDate,
        generatedAt: new Date(),
        generatedBy: "Usuario", // TODO: Get from auth context
      }

      const buffer = await exportInventoryReport(
        reportData,
        metadata,
        format,
        companyLogo
      )

      // Create download link
      const blob = new Blob([new Uint8Array(buffer)], {
        type: format === "pdf" 
          ? "application/pdf" 
          : format === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "text/csv",
      })
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      
      const dateStr = new Date().toISOString().split("T")[0]
      const extension = format === "excel" ? "xlsx" : format
      link.download = `liquidacion-inventario-${dateStr}.${extension}`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Reporte exportado a ${format.toUpperCase()}`)
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error)
      toast.error(`Error al exportar a ${format.toUpperCase()}. Intente nuevamente.`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reporte de Liquidación de Inventario</CardTitle>
          <CardDescription>
            Genera un reporte contable con existencia inicial, compras, ventas y existencia final para un período específico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryReportFilters
            startDate={startDate}
            endDate={endDate}
            categoryFilter={categoryFilter}
            productFilter={productFilter}
            categories={categories}
            products={products}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onCategoryChange={setCategoryFilter}
            onProductChange={setProductFilter}
            onGenerateReport={handleGenerateReport}
            onExport={handleExport}
            isLoading={isLoading || isExporting}
            validationError={validationError}
          />
        </CardContent>
      </Card>

      {reportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
            <CardDescription>
              {reportData.length} producto{reportData.length !== 1 ? "s" : ""} encontrado{reportData.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InventoryReportTable
              data={reportData}
              isLoading={isLoading}
              currency={currency}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
