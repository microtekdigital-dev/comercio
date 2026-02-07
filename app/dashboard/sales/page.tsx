"use client";

import { useState, useEffect } from "react";
import { getSales } from "@/lib/actions/sales";
import { getCustomers } from "@/lib/actions/customers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, ShoppingCart, Search, Filter, X, Download, FileSpreadsheet, FileText } from "lucide-react";
import Link from "next/link";
import { exportSalesToExcel, exportSalesToCSV, exportSalesReportToPDF } from "@/lib/utils/export";
import { toast } from "sonner";
import type { Sale, Customer } from "@/lib/types/erp";

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCustomers();
    loadSales();
  }, []);

  useEffect(() => {
    loadSales();
  }, [search, statusFilter, paymentStatusFilter, customerFilter, dateFrom, dateTo]);

  const loadSales = async () => {
    setLoading(true);
    const data = await getSales({
      search: search || undefined,
      status: statusFilter || undefined,
      paymentStatus: paymentStatusFilter || undefined,
      customerId: customerFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
    setSales(data);
    setLoading(false);
  };

  const loadCustomers = async () => {
    const data = await getCustomers();
    setCustomers(data);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPaymentStatusFilter("");
    setCustomerFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = search || statusFilter || paymentStatusFilter || customerFilter || dateFrom || dateTo;

  const handleExportExcel = () => {
    try {
      exportSalesToExcel(sales);
      toast.success("Ventas exportadas a Excel exitosamente");
    } catch (error) {
      toast.error("Error al exportar a Excel");
    }
  };

  const handleExportCSV = () => {
    try {
      exportSalesToCSV(sales);
      toast.success("Ventas exportadas a CSV exitosamente");
    } catch (error) {
      toast.error("Error al exportar a CSV");
    }
  };

  const handleExportPDF = () => {
    try {
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
      const averageTicket = sales.length > 0 ? totalRevenue / sales.length : 0;
      
      exportSalesReportToPDF(
        sales,
        {
          totalRevenue,
          totalSales: sales.length,
          averageTicket,
        },
        "Mi Empresa" // TODO: Get from company settings
      );
      toast.success("Reporte PDF generado exitosamente");
    } catch (error) {
      toast.error("Error al generar PDF");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      completed: "default",
      cancelled: "destructive",
    };
    
    const labels: Record<string, string> = {
      draft: "Borrador",
      completed: "Completada",
      cancelled: "Cancelada",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      partial: "outline",
      paid: "default",
      refunded: "destructive",
    };
    
    const labels: Record<string, string> = {
      pending: "Pendiente",
      partial: "Parcial",
      paid: "Pagado",
      refunded: "Reembolsado",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR");
  };

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Ventas</h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Gestiona tus ventas y órdenes
          </p>
        </div>
        <div className="flex gap-2 flex-col sm:flex-row">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar a Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar a CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Generar Reporte PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/dashboard/sales/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Venta
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <ShoppingCart className="h-5 w-5" />
              Lista de Ventas ({sales.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full sm:w-auto"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por número de venta o notas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todos</SelectItem>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estado de Pago</Label>
                <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todos</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="partial">Parcial</SelectItem>
                    <SelectItem value="paid">Pagado</SelectItem>
                    <SelectItem value="refunded">Reembolsado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={customerFilter} onValueChange={setCustomerFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todos</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fecha Desde</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha Hasta</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              <div className="flex items-end sm:col-span-2">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Limpiar Filtros
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Sales List */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando...
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-base md:text-lg font-semibold">No hay ventas</h3>
              <p className="text-muted-foreground mt-2 text-sm md:text-base">
                {hasActiveFilters
                  ? "No se encontraron ventas con los filtros aplicados"
                  : "Comienza creando tu primera venta"}
              </p>
              {!hasActiveFilters && (
                <Link href="/dashboard/sales/new" className="inline-block w-full sm:w-auto">
                  <Button className="mt-4 w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Venta
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {sales.map((sale) => (
                <Link
                  key={sale.id}
                  href={`/dashboard/sales/${sale.id}`}
                  className="block"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-sm md:text-base">{sale.sale_number}</h3>
                        {getStatusBadge(sale.status)}
                        {getPaymentStatusBadge(sale.payment_status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                        {sale.customer && (
                          <span>{sale.customer.name}</span>
                        )}
                        <span>{formatDate(sale.sale_date)}</span>
                        <span>{sale.items?.length || 0} items</span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-base md:text-lg font-bold">{formatCurrency(sale.total)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
