"use client";

import { useState, useEffect } from "react";
import { getRepairOrders } from "@/lib/actions/repair-orders";
import { getTechnicians } from "@/lib/actions/technicians";
import { getCustomers } from "@/lib/actions/customers";
import { createClient } from "@/lib/supabase/client";
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
import { Plus, Wrench, Search, Filter, X, AlertCircle, BarChart3 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { RepairOrder, Technician, Customer, RepairStatus } from "@/lib/types/erp";

type RepairOrderWithPayment = RepairOrder & { total_cost: number; total_paid: number };

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<RepairOrderWithPayment[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string>("");
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [technicianFilter, setTechnicianFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCompanyId();
  }, []);

  useEffect(() => {
    if (companyId) {
      loadTechnicians();
      loadCustomers();
      loadRepairs();
    }
  }, [companyId, search, statusFilter, technicianFilter, dateFrom, dateTo]);

  const loadCompanyId = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profile?.company_id) {
      setCompanyId(profile.company_id);
    }
  };

  const loadRepairs = async () => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const data = await getRepairOrders({
        companyId,
        status: (statusFilter && statusFilter !== 'none' ? statusFilter : undefined) as RepairStatus | undefined,
        technicianId: (technicianFilter && technicianFilter !== 'none' ? technicianFilter : undefined),
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: search || undefined,
      });
      setRepairs(data.orders || []);
    } catch (error) {
      console.error("Error loading repairs:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTechnicians = async () => {
    if (!companyId) return;
    try {
      const data = await getTechnicians(companyId, false); // Get all technicians
      setTechnicians(data);
    } catch (error) {
      console.error("Error loading technicians:", error);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setTechnicianFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = search || statusFilter || technicianFilter || dateFrom || dateTo;

  const getStatusBadge = (status: RepairStatus) => {
    const statusConfig: Record<RepairStatus, { label: string; className: string }> = {
      received: { 
        label: "Recibido", 
        className: "bg-blue-500 hover:bg-blue-600 text-white" 
      },
      diagnosing: { 
        label: "Diagnosticando", 
        className: "bg-purple-500 hover:bg-purple-600 text-white" 
      },
      waiting_parts: { 
        label: "Esperando Repuestos", 
        className: "bg-amber-500 hover:bg-amber-600 text-white" 
      },
      repairing: { 
        label: "Reparando", 
        className: "bg-indigo-500 hover:bg-indigo-600 text-white" 
      },
      repaired: { 
        label: "Reparado", 
        className: "bg-green-500 hover:bg-green-600 text-white" 
      },
      delivered: { 
        label: "Entregado", 
        className: "bg-emerald-600 hover:bg-emerald-700 text-white" 
      },
      cancelled: { 
        label: "Cancelado", 
        className: "bg-red-500 hover:bg-red-600 text-white" 
      },
    };

    const config = statusConfig[status];

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (repair: RepairOrderWithPayment) => {
    // Don't show payment badge for cancelled or just received orders
    if (repair.status === 'cancelled' || repair.status === 'received') {
      return null;
    }

    // If there's no cost yet (no diagnosis/budget), don't show badge
    if (repair.total_cost === 0) {
      return null;
    }

    const isPaid = repair.total_paid >= repair.total_cost;
    const isPartiallyPaid = repair.total_paid > 0 && repair.total_paid < repair.total_cost;

    if (isPaid) {
      return (
        <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs">
          ✓ Cobrado
        </Badge>
      );
    } else if (isPartiallyPaid) {
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs">
          Pago Parcial
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs">
          No Cobrado
        </Badge>
      );
    }
  };

  const isOverdue = (repair: RepairOrderWithPayment) => {
    if (!repair.estimated_delivery_date) return false;
    if (repair.status === 'delivered' || repair.status === 'cancelled') return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const estimatedDate = new Date(repair.estimated_delivery_date);
    estimatedDate.setHours(0, 0, 0, 0);
    
    return estimatedDate < today;
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "Cliente desconocido";
  };

  const getTechnicianName = (technicianId: string | null | undefined) => {
    if (!technicianId) return "Sin asignar";
    const technician = technicians.find(t => t.id === technicianId);
    return technician?.name || "Desconocido";
  };

  // Count overdue repairs
  const overdueCount = repairs.filter(isOverdue).length;

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Reparaciones</h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Gestiona las órdenes de reparación de dispositivos
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link href="/dashboard/repairs/reports" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <BarChart3 className="mr-2 h-4 w-4" />
              Historial de Reparaciones
            </Button>
          </Link>
          <Link href="/dashboard/repairs/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Reparación
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Wrench className="h-5 w-5" />
              Lista de Reparaciones ({repairs.length})
              {overdueCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {overdueCount} vencidas
                </Badge>
              )}
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
              placeholder="Buscar por número, cliente, dispositivo..."
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
                    <SelectItem value="received">Recibido</SelectItem>
                    <SelectItem value="diagnosing">Diagnosticando</SelectItem>
                    <SelectItem value="waiting_parts">Esperando Repuestos</SelectItem>
                    <SelectItem value="repairing">Reparando</SelectItem>
                    <SelectItem value="repaired">Reparado</SelectItem>
                    <SelectItem value="delivered">Entregado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Técnico</Label>
                <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todos</SelectItem>
                    {technicians.map((technician) => (
                      <SelectItem key={technician.id} value={technician.id}>
                        {technician.name}
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

          {/* Repairs List */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando...
            </div>
          ) : repairs.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-base md:text-lg font-semibold">No hay reparaciones</h3>
              <p className="text-muted-foreground mt-2 text-sm md:text-base">
                {hasActiveFilters
                  ? "No se encontraron reparaciones con los filtros aplicados"
                  : "Comienza creando tu primera orden de reparación"}
              </p>
              {!hasActiveFilters && (
                <Link href="/dashboard/repairs/new" className="inline-block w-full sm:w-auto">
                  <Button className="mt-4 w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Reparación
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {repairs.map((repair) => (
                <Link
                  key={repair.id}
                  href={`/dashboard/repairs/${repair.id}`}
                  className="block"
                >
                  <Card className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm md:text-base">
                              #{repair.order_number}
                            </p>
                            {isOverdue(repair) && (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {getCustomerName(repair.customer_id)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 items-end flex-shrink-0">
                          {getStatusBadge(repair.status)}
                          {getPaymentStatusBadge(repair)}
                          {repair.budget_approved === true && (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-xs">
                              ✓ Presupuesto Aprobado
                            </Badge>
                          )}
                          {repair.budget_approved === false && (
                            <Badge variant="destructive" className="text-xs">
                              ✗ Presupuesto Rechazado
                            </Badge>
                          )}
                          {repair.budget_approved === null && repair.status !== 'received' && repair.status !== 'cancelled' && (
                            <Badge variant="outline" className="text-xs">
                              ⏳ Pendiente de Aprobación
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Device Info */}
                      <div className="text-sm">
                        <p className="font-medium truncate">
                          {repair.device_type} - {repair.brand} {repair.model}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {repair.reported_problem}
                        </p>
                      </div>

                      {/* Footer Info */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm text-muted-foreground">
                        <div className="flex flex-wrap gap-2">
                          <span>Ingreso: {formatDate(repair.received_date)}</span>
                          {repair.estimated_delivery_date && (
                            <>
                              <span>•</span>
                              <span className={isOverdue(repair) ? "text-destructive font-medium" : ""}>
                                Estimado: {formatDate(repair.estimated_delivery_date)}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Técnico: {getTechnicianName(repair.technician_id)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
