"use client";

import { useState, useEffect } from "react";
import {
  getSalesForecast,
  getPredictiveAnalytics,
  executeCustomReport,
} from "@/lib/actions/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  FileDown,
  Calendar,
  Filter,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { toast } from "sonner";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function CompleteReports() {
  const [loading, setLoading] = useState(true);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [predictiveData, setPredictiveData] = useState<any>(null);
  const [customReportData, setCustomReportData] = useState<any[]>([]);
  const [forecastDays, setForecastDays] = useState("30");
  const [customDataSource, setCustomDataSource] = useState<"sales" | "products" | "customers">("sales");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [forecast, predictive] = await Promise.all([
        getSalesForecast(parseInt(forecastDays)).catch(() => ({ data: [] })),
        getPredictiveAnalytics().catch(() => ({ data: null })),
      ]);

      setForecastData(forecast.data || []);
      setPredictiveData(predictive.data);
    } catch (error) {
      console.error("Error loading complete reports:", error);
      toast.error("Error al cargar reportes completos");
    } finally {
      setLoading(false);
    }
  };

  const handleForecastDaysChange = async (days: string) => {
    setForecastDays(days);
    try {
      const forecast = await getSalesForecast(parseInt(days));
      setForecastData(forecast.data || []);
    } catch (error) {
      toast.error("Error al actualizar pronóstico");
    }
  };

  const handleGenerateCustomReport = async () => {
    try {
      const result = await executeCustomReport({
        name: `Reporte Personalizado - ${customDataSource}`,
        dataSource: customDataSource,
        metrics: ["total", "count"],
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        setCustomReportData(result.data || []);
        toast.success("Reporte generado exitosamente");
      }
    } catch (error) {
      toast.error("Error al generar reporte personalizado");
    }
  };

  const handleExport = (format: "pdf" | "excel" | "csv") => {
    toast.info(`Exportación a ${format.toUpperCase()} en desarrollo`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold">Reportes Completos</h3>
          <Badge variant="default">Empresarial</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
            <FileDown className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
            <FileDown className="mr-2 h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="forecast" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 h-auto">
          <TabsTrigger value="forecast" className="text-xs sm:text-sm">
            Pronóstico
          </TabsTrigger>
          <TabsTrigger value="predictive" className="text-xs sm:text-sm">
            Predictivo
          </TabsTrigger>
          <TabsTrigger value="custom" className="text-xs sm:text-sm">
            Personalizado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pronóstico de Ventas</CardTitle>
                  <CardDescription>
                    Proyección basada en datos históricos con intervalos de confianza
                  </CardDescription>
                </div>
                <Select value={forecastDays} onValueChange={handleForecastDaysChange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 días</SelectItem>
                    <SelectItem value="15">15 días</SelectItem>
                    <SelectItem value="30">30 días</SelectItem>
                    <SelectItem value="60">60 días</SelectItem>
                    <SelectItem value="90">90 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {forecastData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(label) => formatDate(String(label))}
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="confidenceUpper"
                      stackId="1"
                      stroke="none"
                      fill="#3b82f6"
                      fillOpacity={0.1}
                      name="Límite Superior"
                    />
                    <Area
                      type="monotone"
                      dataKey="forecastedValue"
                      stackId="2"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      name="Pronóstico"
                    />
                    <Area
                      type="monotone"
                      dataKey="confidenceLower"
                      stackId="3"
                      stroke="none"
                      fill="#3b82f6"
                      fillOpacity={0.1}
                      name="Límite Inferior"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  <p>No hay suficientes datos históricos para generar un pronóstico</p>
                </div>
              )}
            </CardContent>
          </Card>

          {forecastData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Pronóstico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Ventas Proyectadas</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatCurrency(
                        forecastData.reduce((sum, d) => sum + d.forecastedValue, 0)
                      )}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Promedio Diario</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatCurrency(
                        forecastData.reduce((sum, d) => sum + d.forecastedValue, 0) /
                          forecastData.length
                      )}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Días Proyectados</p>
                    <p className="text-2xl font-bold mt-1">{forecastData.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="predictive" className="space-y-4">
          {predictiveData ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Productos en Tendencia</CardTitle>
                  <CardDescription>
                    Productos con mayor crecimiento en ventas recientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {predictiveData.trendingProducts.length > 0 ? (
                    <div className="space-y-3">
                      {predictiveData.trendingProducts.map((product: any) => (
                        <div
                          key={product.productId}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{product.productName}</h4>
                            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                              <span>Ventas recientes: {product.recentSales}</span>
                              <span>Ingresos: {formatCurrency(product.recentRevenue)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <span className="text-lg font-bold text-green-600">
                              +{product.trend.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No se detectaron productos en tendencia
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Clientes en Riesgo</CardTitle>
                  <CardDescription>
                    Clientes regulares que no han comprado recientemente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {predictiveData.atRiskCustomers.length > 0 ? (
                    <div className="space-y-3">
                      {predictiveData.atRiskCustomers.map((customer: any) => (
                        <div
                          key={customer.customerId}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">Cliente #{customer.customerId}</h4>
                            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                              <span>Compras: {customer.purchaseCount}</span>
                              <span>Total gastado: {formatCurrency(customer.totalSpent)}</span>
                            </div>
                          </div>
                          <Badge variant="destructive">
                            {customer.daysSinceLastPurchase} días sin comprar
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No se detectaron clientes en riesgo
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Patrones Estacionales</CardTitle>
                  <CardDescription>
                    Análisis de ventas por día de la semana
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={predictiveData.seasonalPatterns}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Ingresos" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  No hay suficientes datos para generar analítica predictiva
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Constructor de Reportes Personalizados</CardTitle>
              <CardDescription>
                Crea reportes personalizados con filtros avanzados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fuente de Datos</label>
                  <Select
                    value={customDataSource}
                    onValueChange={(value: any) => setCustomDataSource(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Ventas</SelectItem>
                      <SelectItem value="products">Productos</SelectItem>
                      <SelectItem value="customers">Clientes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Rango de Fechas</label>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    Seleccionar rango
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Filtros Avanzados</label>
                <Button variant="outline" className="w-full justify-start">
                  <Filter className="mr-2 h-4 w-4" />
                  Agregar filtros
                </Button>
              </div>

              <Button onClick={handleGenerateCustomReport} className="w-full">
                Generar Reporte
              </Button>

              {customReportData.length > 0 && (
                <div className="mt-6 border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Resultados ({customReportData.length} registros)</h4>
                  <div className="max-h-[400px] overflow-auto">
                    <pre className="text-xs">
                      {JSON.stringify(customReportData.slice(0, 10), null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
