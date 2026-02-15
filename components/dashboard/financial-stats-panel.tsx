import { getFinancialStats } from "@/lib/actions/financial-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  Wallet, 
  Users, 
  ShoppingCart, 
  DollarSign 
} from "lucide-react";

export async function FinancialStatsPanel() {
  const stats = await getFinancialStats();

  if (!stats) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No se pudieron cargar las estadísticas financieras
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: stats.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const metrics = [
    {
      title: "Hoy vendiste",
      value: stats.dailySales,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Caja actual",
      value: stats.currentCashBalance,
      icon: Wallet,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Clientes te deben",
      value: stats.accountsReceivable,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Debés a proveedores",
      value: stats.accountsPayable,
      icon: ShoppingCart,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Ganancia estimada mes",
      value: stats.monthlyProfit,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metric.color}`}>
                {formatCurrency(metric.value)}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
