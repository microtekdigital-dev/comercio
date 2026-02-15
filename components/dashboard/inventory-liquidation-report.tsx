"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { InventoryReportFilters } from "./inventory-report-filters"
import { InventoryReportTable } from "./inventory-report-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  generateInventoryReport,
  exportInventoryReport 
} from "@/lib/actions/inventory-report"
import {
  getAdvancedInventoryLiquidation,
  getInventoryTurnoverAnalysis,
} from "@/lib/actions/inventory-liquidation-advanced"
import type { InventoryReportRow, ExportFormat } from "@/lib/types/inventory-report"
import type { Category, Product } from "@/lib/types/erp"
import type { InventoryLiquidationReport as AdvancedReport } from "@/lib/types/reports"
import { TrendingUp, TrendingDown, Package, DollarSign } from "lucide-react"

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
  const [advancedReport, setAdvancedReport] = useState<AdvancedReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

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
      // Generar reporte básico
      const data = await generateInventoryReport({
        companyId,
        startDate,
        endDate,
        categoryId: categoryFilter || undefined,
        productId: productFilter || undefined,
      })

      setReportData(data)

      // Generar reporte avanzado
      try {
        const advanced = await getAdvancedInventoryLiquidation(companyId, {
          startDate,
          endDate,
          categoryIds: categoryFilter ? [categoryFilter] : undefined,
          productIds: productFilter ? [productFilter] : undefined,
        })
        setAdvancedReport(advanced)
        setShowAdvanced(true)
      } catch (advError) {
        console.error("Error generating advanced report:", advError)
        // No mostrar error al usuario, solo no mostrar datos avanzados
        setShowAdvanced(false)
      }

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

      {/* Resumen Avanzado */}
      {showAdvanced && advancedReport && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{advancedReport.summary.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                {advancedReport.summary.totalMovements} movimientos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compras</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${advancedReport.summary.totalPurchaseValue.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Valor total de compras</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${advancedReport.summary.totalSalesValue.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Valor total de ventas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganancia</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${advancedReport.summary.totalProfit.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Margen: {advancedReport.summary.profitMargin.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {reportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
            <CardDescription>
              {reportData.length} producto{reportData.length !== 1 ? "s" : ""} encontrado{reportData.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="detalle" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="detalle">Detalle</TabsTrigger>
                <TabsTrigger value="categorias">Por Categoría</TabsTrigger>
                <TabsTrigger value="top-movers">Top Movers</TabsTrigger>
                <TabsTrigger value="slow-movers">Slow Movers</TabsTrigger>
              </TabsList>

              <TabsContent value="detalle" className="space-y-4">
                <InventoryReportTable
                  data={reportData}
                  isLoading={isLoading}
                  currency={currency}
                />
              </TabsContent>

              <TabsContent value="categorias" className="space-y-4">
                {showAdvanced && advancedReport && advancedReport.byCategory.length > 0 ? (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2 text-left text-sm font-medium">Categoría</th>
                          <th className="p-2 text-right text-sm font-medium">Productos</th>
                          <th className="p-2 text-right text-sm font-medium">Movimientos</th>
                          <th className="p-2 text-right text-sm font-medium">Compras</th>
                          <th className="p-2 text-right text-sm font-medium">Ventas</th>
                          <th className="p-2 text-right text-sm font-medium">Ganancia</th>
                          <th className="p-2 text-right text-sm font-medium">Margen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {advancedReport.byCategory.map((cat) => (
                          <tr key={cat.categoryId} className="border-b">
                            <td className="p-2 text-sm">{cat.categoryName}</td>
                            <td className="p-2 text-right text-sm">{cat.totalProducts}</td>
                            <td className="p-2 text-right text-sm">{cat.totalMovements}</td>
                            <td className="p-2 text-right text-sm">
                              ${cat.totalPurchaseValue.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 text-right text-sm">
                              ${cat.totalSalesValue.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 text-right text-sm">
                              ${cat.totalProfit.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 text-right text-sm">
                              <Badge variant={cat.profitMargin > 30 ? "default" : "secondary"}>
                                {cat.profitMargin.toFixed(1)}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No hay datos de categorías disponibles
                  </p>
                )}
              </TabsContent>

              <TabsContent value="top-movers" className="space-y-4">
                {showAdvanced && advancedReport && advancedReport.topMovers.length > 0 ? (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2 text-left text-sm font-medium">Producto</th>
                          <th className="p-2 text-left text-sm font-medium">Variante</th>
                          <th className="p-2 text-left text-sm font-medium">Categoría</th>
                          <th className="p-2 text-right text-sm font-medium">Unidades Vendidas</th>
                          <th className="p-2 text-right text-sm font-medium">Rotación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {advancedReport.topMovers.map((product, idx) => (
                          <tr key={`${product.productId}-${product.variantId || 'null'}-${idx}`} className="border-b">
                            <td className="p-2 text-sm">{product.productName}</td>
                            <td className="p-2 text-sm">{product.variantName || "-"}</td>
                            <td className="p-2 text-sm">{product.categoryName}</td>
                            <td className="p-2 text-right text-sm">{product.units}</td>
                            <td className="p-2 text-right text-sm">
                              <Badge variant="default">
                                {(product.turnoverRate || 0).toFixed(2)}x
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No hay datos de productos con mayor movimiento
                  </p>
                )}
              </TabsContent>

              <TabsContent value="slow-movers" className="space-y-4">
                {showAdvanced && advancedReport && advancedReport.slowMovers.length > 0 ? (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2 text-left text-sm font-medium">Producto</th>
                          <th className="p-2 text-left text-sm font-medium">Variante</th>
                          <th className="p-2 text-left text-sm font-medium">Categoría</th>
                          <th className="p-2 text-right text-sm font-medium">Unidades Vendidas</th>
                          <th className="p-2 text-right text-sm font-medium">Rotación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {advancedReport.slowMovers.map((product, idx) => (
                          <tr key={`${product.productId}-${product.variantId || 'null'}-${idx}`} className="border-b">
                            <td className="p-2 text-sm">{product.productName}</td>
                            <td className="p-2 text-sm">{product.variantName || "-"}</td>
                            <td className="p-2 text-sm">{product.categoryName}</td>
                            <td className="p-2 text-right text-sm">{product.units}</td>
                            <td className="p-2 text-right text-sm">
                              <Badge variant="secondary">
                                {(product.turnoverRate || 0).toFixed(2)}x
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No hay datos de productos con menor movimiento
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
