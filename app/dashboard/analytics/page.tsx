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

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30");
  const [salesData, setSalesData] = useState<any[]>([]);
  const [profitabilityData, setProfitabilityData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        <p>Cargando reportes...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reportes Avanzados</h2>
          <p className="text-muted-foreground">
            Análisis detallado de tu negocio
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
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

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sales">
            <BarChart3 className="mr-2 h-4 w-4" />
            Ventas
          </TabsTrigger>
          <TabsTrigger value="profitability">
            <TrendingUp className="mr-2 h-4 w-4" />
            Rentabilidad
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="mr-2 h-4 w-4" />
            Inventario
          </TabsTrigger>
          <TabsTrigger value="cashflow">
            <DollarSign className="mr-2 h-4 w-4" />
            Flujo de Caja
          </TabsTrigger>
          <TabsTrigger value="categories">
            <PieChart className="mr-2 h-4 w-4" />
            Categorías
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

        <TabsContent value="profitability" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Análisis de Rentabilidad por Producto</CardTitle>
                  <CardDescription>
                    Productos ordenados por ganancia total
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportProfitability}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profitabilityData.slice(0, 10).map((product, index) => (
                  <div
                    key={product.product_id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">#{index + 1}</span>
                        <h4 className="font-medium">{product.product_name}</h4>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Vendidos: {product.quantity_sold}</span>
                        <span>Ingresos: {formatCurrency(product.revenue)}</span>
                        <span>Costo: {formatCurrency(product.cost)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(product.profit)}
                      </p>
                      <Badge variant={product.profit_margin > 30 ? "default" : "secondary"}>
                        {product.profit_margin.toFixed(1)}% margen
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Reporte de Inventario</CardTitle>
                  <CardDescription>
                    Estado actual del stock (ordenado por cantidad)
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportInventory}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {inventoryData.map((product) => (
                  <div
                    key={product.product_id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{product.product_name}</h4>
                        {product.status === "low" && (
                          <Badge variant="destructive">Stock Bajo</Badge>
                        )}
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {product.sku && <span>SKU: {product.sku}</span>}
                        <span>{product.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {product.stock_quantity} / {product.min_stock_level}
                      </p>
                      <p className="text-sm text-muted-foreground">
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

        <TabsContent value="categories" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ventas por Categoría</CardTitle>
                <CardDescription>Distribución de ingresos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={categoryData}
                      dataKey="revenue"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
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
                <CardTitle>Detalle por Categoría</CardTitle>
                <CardDescription>Ingresos y cantidad de ventas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryData.map((category, index) => (
                    <div
                      key={category.category}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium">{category.category}</p>
                          <p className="text-sm text-muted-foreground">
                            {category.sales} ventas • {category.quantity} unidades
                          </p>
                        </div>
                      </div>
                      <p className="font-bold">{formatCurrency(category.revenue)}</p>
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
