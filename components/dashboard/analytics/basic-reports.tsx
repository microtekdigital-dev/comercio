"use client";

import { useState, useEffect } from "react";
import {
  getSalesByPeriod,
  getProductProfitability,
  getInventoryReport,
  getCashFlow,
  getSalesByCategory,
} from "@/lib/actions/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Package,
  DollarSign,
  PieChart,
  FileSpreadsheet,
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { exportToExcel } from "@/lib/utils/export";
import { toast } from "sonner";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface BasicReportsProps {
  canExport?: boolean;
}

export function BasicReports({ canExport = false }: BasicReportsProps) {
  const [period, setPeriod] = useState("30");
  const [salesData, setSalesData] = useState<any[]>([]);
  const [profitabilityData, setProfitabilityData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Debug: Log canExport value
  useEffect(() => {
    console.log("BasicReports - canExport:", canExport);
  }, [canExport]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sales, profitability, inventory, cashFlow, categories] = await Promise.all([
        getSalesByPeriod(parseInt(period)).catch(() => []),
        getProductProfitability().catch(() => []),
        getInventoryReport().catch(() => []),
        getCashFlow(parseInt(period)).catch(() => []),
        getSalesByCategory().catch(() => []),
      ]);

      setSalesData(sales || []);
      setProfitabilityData(profitability || []);
      setInventoryData(inventory || []);
      setCashFlowData(cashFlow || []);
      setCategoryData(categories || []);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Error al cargar los reportes");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: any) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("es-AR", {
      month: "short",
      day: "numeric",
    });
  };

  const handleExportProfitability = () => {
    try {
      const data = profitabilityData.map(p => ({
        "Producto": p.product_name,
        "Cantidad Vendida": p.quantity_sold,
        "Ingresos": p.revenue,
        "Costo": p.cost,
        "Ganancia": p.profit,
        "Margen (%)": p.profit_margin.toFixed(2),
      }));
      exportToExcel(data, `rentabilidad-productos-${new Date().toISOString().split("T")[0]}`, "Rentabilidad");
      toast.success("Reporte exportado exitosamente");
    } catch (error) {
      toast.error("Error al exportar");
    }
  };

  const handleExportInventory = () => {
    try {
      const data = inventoryData.map(p => ({
        "SKU": p.sku || "",
        "Producto": p.product_name,
        "Categoría": p.category,
        "Stock": p.stock_quantity,
        "Stock Mínimo": p.min_stock_level,
        "Valor": p.stock_value,
        "Estado": p.status === "low" ? "Stock Bajo" : "OK",
      }));
      exportToExcel(data, `inventario-${new Date().toISOString().split("T")[0]}`, "Inventario");
      toast.success("Reporte exportado exitosamente");
    } catch (error) {
      toast.error("Error al exportar");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <p>Cargando reportes básicos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Reportes Básicos</h3>
          <p className="text-sm text-muted-foreground">
            Disponible en todos los planes
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días</SelectItem>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="90">Últimos 90 días</SelectItem>
            <SelectItem value="365">Último año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="sales" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 h-auto">
          <TabsTrigger value="sales" className="text-xs sm:text-sm">
            <BarChart3 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Ventas</span>
            <span className="sm:hidden">Ventas</span>
          </TabsTrigger>
          <TabsTrigger value="profitability" className="text-xs sm:text-sm">
            <TrendingUp className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Rentabilidad</span>
            <span className="sm:hidden">Rent.</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs sm:text-sm">
            <Package className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Inventario</span>
            <span className="sm:hidden">Inv.</span>
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="text-xs sm:text-sm">
            <DollarSign className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Flujo de Caja</span>
            <span className="sm:hidden">Flujo</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="text-xs sm:text-sm col-span-2 sm:col-span-1">
            <PieChart className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Categorías</span>
            <span className="sm:hidden">Categ.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Período</CardTitle>
              <CardDescription>
                Evolución de ventas e ingresos en los últimos {period} días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    labelFormatter={(label) => formatDate(label)}
                    formatter={(value: any, name?: string) => [
                      name === "revenue" ? formatCurrency(value) : value,
                      name === "revenue" ? "Ingresos" : "Ventas",
                    ]}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    name="Ingresos"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="sales"
                    stroke="#10b981"
                    name="Cantidad"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg md:text-xl">Análisis de Rentabilidad por Producto</CardTitle>
                  <CardDescription className="text-sm">
                    Productos ordenados por ganancia total
                  </CardDescription>
                </div>
                {canExport && (
                  <Button variant="outline" size="sm" onClick={handleExportProfitability} className="w-full sm:w-auto">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:space-y-4">
                {profitabilityData.slice(0, 10).map((product, index) => (
                  <div
                    key={product.product_id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-4 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">#{index + 1}</span>
                        <h4 className="font-medium text-sm md:text-base truncate">{product.product_name}</h4>
                      </div>
                      <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                        <span>Vendidos: {product.quantity_sold}</span>
                        <span>Ingresos: {formatCurrency(product.revenue)}</span>
                        <span className="hidden sm:inline">Costo: {formatCurrency(product.cost)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                      <p className="text-base md:text-lg font-bold text-green-600">
                        {formatCurrency(product.profit)}
                      </p>
                      <Badge variant={product.profit_margin > 30 ? "default" : "secondary"} className="text-xs">
                        {product.profit_margin.toFixed(1)}% margen
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg md:text-xl">Reporte de Inventario</CardTitle>
                  <CardDescription className="text-sm">
                    Estado actual del stock (ordenado por cantidad)
                  </CardDescription>
                </div>
                {canExport && (
                  <Button variant="outline" size="sm" onClick={handleExportInventory} className="w-full sm:w-auto">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 md:space-y-3">
                {inventoryData.map((product) => (
                  <div
                    key={product.product_id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium text-sm md:text-base truncate">{product.product_name}</h4>
                        {product.status === "low" && (
                          <Badge variant="destructive" className="text-xs">Stock Bajo</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                        {product.sku && <span>SKU: {product.sku}</span>}
                        <span>{product.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                      <p className="text-base md:text-lg font-bold">
                        {product.stock_quantity} / {product.min_stock_level}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Valor: {formatCurrency(product.stock_value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Flujo de Caja</CardTitle>
              <CardDescription>
                Pagos recibidos en los últimos {period} días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(label) => formatDate(label)}
                    formatter={(value: any) => [formatCurrency(value), "Monto"]}
                  />
                  <Legend />
                  <Bar dataKey="amount" fill="#10b981" name="Pagos Recibidos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 md:space-y-6">
          <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Ventas por Categoría</CardTitle>
                <CardDescription className="text-sm">Distribución de ingresos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RePieChart>
                    <Pie
                      data={categoryData}
                      dataKey="revenue"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry: any) => entry.category}
                    >
                      {categoryData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Detalle por Categoría</CardTitle>
                <CardDescription className="text-sm">Ingresos y cantidad de ventas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 md:space-y-3">
                  {categoryData.map((category, index) => (
                    <div
                      key={category.category}
                      className="flex items-center justify-between gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <div
                          className="w-3 h-3 md:w-4 md:h-4 rounded flex-shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm md:text-base truncate">{category.category}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {category.sales} ventas • {category.quantity} unidades
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-sm md:text-base whitespace-nowrap">{formatCurrency(category.revenue)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
