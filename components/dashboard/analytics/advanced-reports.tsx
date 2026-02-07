"use client";

import { useState, useEffect } from "react";
import {
  getProfitMarginsByProduct,
  getProfitMarginsByCategory,
  getSalesTrends,
  getCustomerSegmentation,
  getInventoryTurnover,
  getSupplierPerformance,
  getPurchaseOrderAnalytics,
} from "@/lib/actions/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Truck,
  ShoppingCart,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface AdvancedReportsProps {
  hasSupplierAccess?: boolean;
  hasPurchaseOrderAccess?: boolean;
}

export function AdvancedReports({
  hasSupplierAccess = false,
  hasPurchaseOrderAccess = false,
}: AdvancedReportsProps) {
  const [loading, setLoading] = useState(true);
  const [profitByProduct, setProfitByProduct] = useState<any[]>([]);
  const [profitByCategory, setProfitByCategory] = useState<any[]>([]);
  const [salesTrends, setSalesTrends] = useState<any[]>([]);
  const [customerSegments, setCustomerSegments] = useState<any[]>([]);
  const [inventoryTurnover, setInventoryTurnover] = useState<any[]>([]);
  const [supplierPerformance, setSupplierPerformance] = useState<any[]>([]);
  const [purchaseOrderStats, setPurchaseOrderStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        productMargins,
        categoryMargins,
        trends,
        segments,
        turnover,
      ] = await Promise.all([
        getProfitMarginsByProduct().catch(() => []),
        getProfitMarginsByCategory().catch(() => []),
        getSalesTrends("month").catch(() => []),
        getCustomerSegmentation().catch(() => []),
        getInventoryTurnover().catch(() => []),
      ]);

      setProfitByProduct(productMargins || []);
      setProfitByCategory(categoryMargins || []);
      setSalesTrends(trends || []);
      setCustomerSegments(segments || []);
      setInventoryTurnover(turnover || []);

      // Load supplier and PO data if access is granted
      if (hasSupplierAccess) {
        const supplierData = await getSupplierPerformance().catch(() => ({ data: [] }));
        setSupplierPerformance(supplierData.data || []);
      }

      if (hasPurchaseOrderAccess) {
        const poData = await getPurchaseOrderAnalytics().catch(() => ({ data: null }));
        setPurchaseOrderStats(poData.data);
      }
    } catch (error) {
      console.error("Error loading advanced reports:", error);
      toast.error("Error al cargar reportes avanzados");
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
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold">Reportes Avanzados</h3>
        <Badge variant="secondary">Pro</Badge>
      </div>

      <Tabs defaultValue="profit-margins" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 h-auto">
          <TabsTrigger value="profit-margins" className="text-xs sm:text-sm">
            Márgenes
          </TabsTrigger>
          <TabsTrigger value="trends" className="text-xs sm:text-sm">
            Tendencias
          </TabsTrigger>
          <TabsTrigger value="customers" className="text-xs sm:text-sm">
            Clientes
          </TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs sm:text-sm">
            Rotación
          </TabsTrigger>
          {hasSupplierAccess && (
            <TabsTrigger value="suppliers" className="text-xs sm:text-sm">
              Proveedores
            </TabsTrigger>
          )}
          {hasPurchaseOrderAccess && (
            <TabsTrigger value="purchase-orders" className="text-xs sm:text-sm">
              Órdenes
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profit-margins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Márgenes de Ganancia por Producto</CardTitle>
              <CardDescription>
                Top 10 productos con mejor margen de ganancia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={profitByProduct.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `${value.toFixed(2)}%`} />
                  <Legend />
                  <Bar dataKey="profitMargin" fill="#10b981" name="Margen (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Márgenes de Ganancia por Categoría</CardTitle>
              <CardDescription>
                Análisis de rentabilidad por categoría de producto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profitByCategory.map((category, index) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{category.name}</h4>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span>Ingresos: {formatCurrency(category.revenue)}</span>
                        <span>Ganancia: {formatCurrency(category.profit)}</span>
                      </div>
                    </div>
                    <Badge variant={category.profitMargin > 30 ? "default" : "secondary"}>
                      {category.profitMargin.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias de Ventas (Mes a Mes)</CardTitle>
              <CardDescription>
                Comparación de ventas con períodos anteriores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="currentValue"
                    stroke="#3b82f6"
                    name="Ventas Actuales"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="previousValue"
                    stroke="#94a3b8"
                    name="Período Anterior"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-6 space-y-3">
                {salesTrends.slice(-6).map((trend) => (
                  <div
                    key={trend.period}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{trend.period}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(trend.currentValue)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {trend.growthDirection === "up" ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : trend.growthDirection === "down" ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : null}
                      <span
                        className={`font-semibold ${
                          trend.growthDirection === "up"
                            ? "text-green-600"
                            : trend.growthDirection === "down"
                            ? "text-red-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {trend.growthPercentage > 0 ? "+" : ""}
                        {trend.growthPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segmentación de Clientes (RFM)</CardTitle>
              <CardDescription>
                Análisis de clientes por Recencia, Frecuencia y Valor Monetario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={customerSegments}
                      dataKey="customerCount"
                      nameKey="segmentName"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry: any) => entry.segmentName}
                    >
                      {customerSegments.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-3">
                  {customerSegments.map((segment, index) => (
                    <div
                      key={segment.segmentName}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <div
                        className="w-4 h-4 rounded flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{segment.segmentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {segment.customerCount} clientes • {formatCurrency(segment.totalRevenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rotación de Inventario</CardTitle>
              <CardDescription>
                Productos ordenados por velocidad de rotación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inventoryTurnover.slice(0, 15).map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{item.productName}</h4>
                        <Badge
                          variant={
                            item.status === "fast"
                              ? "default"
                              : item.status === "slow"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {item.status === "fast"
                            ? "Rápida"
                            : item.status === "slow"
                            ? "Lenta"
                            : "Normal"}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span>{item.category}</span>
                        <span>Vendidos: {item.unitsSold}</span>
                        <span>Días para vender: {item.daysToSell}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{item.turnoverRate}</p>
                      <p className="text-xs text-muted-foreground">Rotación</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {hasSupplierAccess && (
          <TabsContent value="suppliers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento de Proveedores</CardTitle>
                <CardDescription>
                  Métricas de desempeño y cumplimiento de proveedores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supplierPerformance.map((supplier) => (
                    <div
                      key={supplier.supplierId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <h4 className="font-medium">{supplier.supplierName}</h4>
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                          <span>Órdenes: {supplier.totalOrders}</span>
                          <span>Entrega a tiempo: {supplier.onTimeDeliveryRate.toFixed(1)}%</span>
                          <span>Lead time: {supplier.averageLeadTimeDays} días</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            supplier.performanceScore >= 80
                              ? "default"
                              : supplier.performanceScore >= 60
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {supplier.performanceScore} pts
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatCurrency(supplier.totalSpend)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {hasPurchaseOrderAccess && purchaseOrderStats && (
          <TabsContent value="purchase-orders" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{purchaseOrderStats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gasto total: {formatCurrency(purchaseOrderStats.totalSpend)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Valor Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(purchaseOrderStats.averageOrderValue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Por orden de compra</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Tasa de Cumplimiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {purchaseOrderStats.fulfillmentRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pagos: {purchaseOrderStats.paymentRate.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Órdenes por Mes</CardTitle>
                <CardDescription>Evolución de órdenes de compra</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={purchaseOrderStats.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: any, name: string) => 
                      name === "spend" ? formatCurrency(value) : value
                    } />
                    <Legend />
                    <Bar dataKey="orders" fill="#3b82f6" name="Órdenes" />
                    <Bar dataKey="spend" fill="#10b981" name="Gasto" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
