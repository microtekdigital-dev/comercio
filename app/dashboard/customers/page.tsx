"use client";

import { useState, useEffect } from "react";
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
import { Plus, Users, Search, Filter, X, Mail, Phone, Download, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { exportCustomersToExcel, exportCustomersToCSV } from "@/lib/utils/export";
import { toast } from "sonner";
import type { Customer } from "@/lib/types/erp";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [search, statusFilter]);

  const loadCustomers = async () => {
    setLoading(true);
    const data = await getCustomers({
      search: search || undefined,
      status: statusFilter || undefined,
    });
    setCustomers(data);
    setLoading(false);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
  };

  const hasActiveFilters = search || statusFilter;

  const handleExportExcel = () => {
    try {
      exportCustomersToExcel(customers);
      toast.success("Clientes exportados a Excel exitosamente");
    } catch (error) {
      toast.error("Error al exportar a Excel");
    }
  };

  const handleExportCSV = () => {
    try {
      exportCustomersToCSV(customers);
      toast.success("Clientes exportados a CSV exitosamente");
    } catch (error) {
      toast.error("Error al exportar a CSV");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      inactive: "secondary",
      blocked: "destructive",
    };

    const labels: Record<string, string> = {
      active: "Activo",
      inactive: "Inactivo",
      blocked: "Bloqueado",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Gestiona tu base de clientes
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
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/dashboard/customers/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Users className="h-5 w-5" />
              Lista de Clientes ({customers.length})
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
              placeholder="Buscar por nombre, email, teléfono o documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                    <SelectItem value="blocked">Bloqueados</SelectItem>
                  </SelectContent>
                </Select>
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

          {/* Customers List */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando...
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-base md:text-lg font-semibold">No hay clientes</h3>
              <p className="text-muted-foreground mt-2 text-sm md:text-base">
                {hasActiveFilters
                  ? "No se encontraron clientes con los filtros aplicados"
                  : "Comienza agregando tu primer cliente"}
              </p>
              {!hasActiveFilters && (
                <Link href="/dashboard/customers/new" className="inline-block w-full sm:w-auto">
                  <Button className="mt-4 w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Cliente
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {customers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/dashboard/customers/${customer.id}`}
                  className="block"
                >
                  <Card className="hover:bg-muted/50 transition-colors h-full">
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-start justify-between mb-2 md:mb-3">
                        <h3 className="font-semibold line-clamp-1 text-sm md:text-base">
                          {customer.name}
                        </h3>
                        {getStatusBadge(customer.status)}
                      </div>

                      <div className="space-y-2 text-xs md:text-sm text-muted-foreground">
                        {customer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span className="line-clamp-1">{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.document_number && (
                          <div className="text-xs">
                            {customer.document_type}: {customer.document_number}
                          </div>
                        )}
                        {customer.city && customer.state && (
                          <div className="text-xs">
                            {customer.city}, {customer.state}
                          </div>
                        )}
                      </div>
                    </CardContent>
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
