'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Lock, BarChart2 } from 'lucide-react';
import {
  getPOSReportSalesByCashier,
  getPOSReportTopProducts,
  getPOSReportPaymentMethods,
  getPOSReportSalesByHour,
} from '@/lib/actions/pos-reports';
import type {
  POSSalesByCashier,
  POSTopProduct,
  POSPaymentMethodReport,
} from '@/lib/types/pos';

interface POSReportsProps {
  planName: string;
}

interface ReportData {
  salesByCashier: POSSalesByCashier[];
  topProducts: POSTopProduct[];
  paymentMethods: POSPaymentMethodReport[];
  salesByHour: Array<{ hour: number; sales_count: number; total_amount: number }>;
}

function getFirstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatHour(hour: number): string {
  const h = hour.toString().padStart(2, '0');
  return `${h}:00 - ${h}:59`;
}

const RESTRICTED_PLANS = ['basico', 'trial'];

export function POSReports({ planName }: POSReportsProps) {
  const [dateFrom, setDateFrom] = useState(getFirstDayOfMonth());
  const [dateTo, setDateTo] = useState(getToday());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);

  const isRestricted = RESTRICTED_PLANS.includes(planName?.toLowerCase());

  if (isRestricted) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <Lock className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="text-lg font-semibold">Reportes POS no disponibles</p>
            <p className="text-sm text-muted-foreground mt-1">
              Los reportes del POS están disponibles en los planes{' '}
              <span className="font-medium">Profesional</span> y{' '}
              <span className="font-medium">Empresarial</span>.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Tu plan actual: <span className="font-medium capitalize">{planName}</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  async function handleGenerateReport() {
    setLoading(true);
    try {
      const [salesByCashier, topProducts, paymentMethods, salesByHour] = await Promise.all([
        getPOSReportSalesByCashier({ dateFrom, dateTo }),
        getPOSReportTopProducts({ dateFrom, dateTo }),
        getPOSReportPaymentMethods({ dateFrom, dateTo }),
        getPOSReportSalesByHour({ dateFrom, dateTo }),
      ]);
      setData({ salesByCashier, topProducts, paymentMethods, salesByHour });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart2 className="h-4 w-4" />
            Reportes POS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Desde</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Hasta</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={handleGenerateReport} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                'Generar Reporte'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {data && (
        <>
          {/* Sales by Cashier */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ventas por Cajero</CardTitle>
            </CardHeader>
            <CardContent>
              {data.salesByCashier.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Sin datos para el período seleccionado.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cajero</TableHead>
                      <TableHead className="text-right">Ventas</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.salesByCashier.map((row) => (
                      <TableRow key={row.cashier_id}>
                        <TableCell>{row.cashier_name}</TableCell>
                        <TableCell className="text-right">{row.total_sales}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.total_amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Productos Más Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              {data.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Sin datos para el período seleccionado.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topProducts.map((row) => (
                      <TableRow key={row.product_id}>
                        <TableCell>{row.product_name}</TableCell>
                        <TableCell className="text-right">{row.total_quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.total_revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Métodos de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              {data.paymentMethods.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Sin datos para el período seleccionado.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Método</TableHead>
                      <TableHead className="text-right">Transacciones</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.paymentMethods.map((row) => (
                      <TableRow key={row.payment_method}>
                        <TableCell>{row.payment_method}</TableCell>
                        <TableCell className="text-right">{row.transaction_count}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.total_amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Sales by Hour */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ventas por Hora</CardTitle>
            </CardHeader>
            <CardContent>
              {data.salesByHour.filter((r) => r.sales_count > 0).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Sin datos para el período seleccionado.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead className="text-right">Ventas</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.salesByHour
                      .filter((row) => row.sales_count > 0)
                      .map((row) => (
                        <TableRow key={row.hour}>
                          <TableCell>{formatHour(row.hour)}</TableCell>
                          <TableCell className="text-right">{row.sales_count}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.total_amount)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
