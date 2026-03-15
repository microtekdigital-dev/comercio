"use client";

import { useState, useEffect } from "react";
import { getSalesByPeriod } from "@/lib/actions/analytics";
import { getCompanySettings } from "@/lib/actions/company-settings";
import { formatCompanyCurrency } from "@/lib/utils/currency";
import type { CompanySettings } from "@/lib/types/erp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

const PERIODS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "12m", days: 365 },
];

export function SalesChartWidget() {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<any[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCompanySettings().then(setSettings);
  }, []);

  useEffect(() => {
    setLoading(true);
    getSalesByPeriod(period)
      .then((d) => setData(d || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [period]);

  const formatCurrency = (value: number) =>
    settings ? formatCompanyCurrency(value, settings) : `$${value.toFixed(0)}`;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-AR", {
      month: "short",
      day: "numeric",
    });

  const totalRevenue = data.reduce((sum, d) => sum + (d.revenue || 0), 0);
  const totalSales = data.reduce((sum, d) => sum + (d.sales || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Ventas por Período</CardTitle>
          </div>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <Button
                key={p.days}
                variant={period === p.days ? "default" : "outline"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setPeriod(p.days)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex gap-6 mt-1">
          <div>
            <p className="text-xs text-muted-foreground">Ingresos</p>
            <p className="text-lg font-bold">{formatCurrency(totalRevenue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ventas</p>
            <p className="text-lg font-bold">{totalSales}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
            Cargando...
          </div>
        ) : data.length === 0 ? (
          <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
            Sin datos para este período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v) => formatCurrency(v)}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={70}
              />
              <Tooltip
                labelFormatter={(label) => formatDate(String(label))}
                formatter={(value: any, name?: string) => [
                  name === "revenue" ? formatCurrency(value) : value,
                  name === "revenue" ? "Ingresos" : "Ventas",
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorRevenue)"
                name="revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
