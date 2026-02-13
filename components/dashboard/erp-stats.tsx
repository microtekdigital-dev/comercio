import { getDashboardStats, getTopProducts, getTopCustomers } from "@/lib/actions/analytics";
import { getLowStockProducts } from "@/lib/actions/products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShoppingCart, 
  DollarSign, 
  Users, 
  Package, 
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import Link from "next/link";

export async function ERPStats() {
  const stats = await getDashboardStats();
  const topProducts = await getTopProducts(5);
  const topCustomers = await getTopCustomers(5);
  const lowStockProducts = await getLowStockProducts();
  
  // Debug log
  console.log('[ERPStats] Low stock products count:', lowStockProducts.length);
  console.log('[ERPStats] Low stock products:', lowStockProducts);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  // Handle null stats case
  if (!stats) {
    return (
      <div className="grid gap-4 grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Bienvenido al Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              No hay datos disponibles en este momento. Esto puede deberse a:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Tu cuenta aún no tiene productos o ventas registradas</li>
              <li>Necesitas permisos adicionales para ver esta información</li>
              <li>Hay un problema temporal con la conexión</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              Comienza agregando productos y clientes para ver tus estadísticas aquí.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {stats.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={stats.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                {formatPercent(stats.revenueGrowth)}
              </span>
              <span className="ml-1">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {stats.salesGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={stats.salesGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                {formatPercent(stats.salesGrowth)}
              </span>
              <span className="ml-1">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Clientes activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Productos activos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats.pendingSales > 0 && (
        <div className="grid gap-4 grid-cols-1">
          <Card className="border-yellow-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas Pendientes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingSales}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requieren atención
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Low Stock Products - Unified Card */}
      {lowStockProducts.length > 0 && (
        <Card className="border-red-500/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <CardTitle>Productos con Stock Bajo</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lowStockProducts.length} {lowStockProducts.length === 1 ? 'producto requiere' : 'productos requieren'} atención
                  </p>
                </div>
              </div>
              <Link 
                href="/dashboard/products?lowStock=true" 
                className="text-sm text-primary hover:underline"
              >
                Ver todos
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.slice(0, 10).map((product) => (
                <div 
                  key={product.variant_id ? `${product.id}-${product.variant_id}` : product.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-red-900 dark:text-red-100">
                        {product.name}
                        {product.variant_name && (
                          <span className="ml-1 text-xs font-normal">
                            - {product.variant_name}
                          </span>
                        )}
                      </p>
                      {product.sku && (
                        <span className="text-xs text-red-600 dark:text-red-400">
                          ({product.sku})
                        </span>
                      )}
                    </div>
                    {product.category && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {(product.category as any).name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-700 dark:text-red-300">
                          {product.stock_quantity} unidades
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400">
                          Mínimo: {product.min_stock_level}
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/products/${product.id}`}
                        className="ml-2 text-xs text-primary hover:underline"
                      >
                        Editar
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              {lowStockProducts.length > 10 && (
                <p className="text-xs text-center text-muted-foreground pt-2">
                  Y {lowStockProducts.length - 10} productos más con stock bajo
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Products and Customers */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div key={product.product_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{product.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.total_quantity} unidades
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency(product.total_revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mejores Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((customer, index) => (
                  <div key={customer.customer_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{customer.customer_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.total_sales} compras
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency(customer.total_revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
