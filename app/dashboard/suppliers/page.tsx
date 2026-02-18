"use client";

import { useState, useEffect } from "react";
import { getSuppliers, getSupplierBalance } from "@/lib/actions/suppliers";
import { getUserPermissions } from "@/lib/utils/permissions";
import type { Supplier } from "@/lib/types/erp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Building2, Mail, Phone, MapPin, FileText, CreditCard, DollarSign, MoreVertical } from "lucide-react";
import Link from "next/link";
import { SupplierAccountModal } from "@/components/dashboard/supplier-account-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierBalances, setSupplierBalances] = useState<Record<string, number>>({});
  const [selectedSupplierForAccount, setSelectedSupplierForAccount] = useState<Supplier | null>(null);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  useEffect(() => {
    loadSuppliers();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const permissions = await getUserPermissions();
    setCanCreate(permissions.canCreateSuppliers);
  };

  useEffect(() => {
    filterSuppliers();
  }, [suppliers, search, statusFilter]);

  useEffect(() => {
    if (suppliers.length > 0) {
      loadSupplierBalances();
    }
  }, [suppliers]);

  const loadSupplierBalances = async () => {
    const balances: Record<string, number> = {};
    await Promise.all(
      suppliers.map(async (supplier) => {
        const balance = await getSupplierBalance(supplier.id);
        balances[supplier.id] = balance;
      })
    );
    setSupplierBalances(balances);
  };

  const handleOpenAccountModal = (supplier: Supplier) => {
    setSelectedSupplierForAccount(supplier);
    setAccountModalOpen(true);
  };

  const loadSuppliers = async () => {
    setLoading(true);
    const data = await getSuppliers();
    setSuppliers(data);
    setLoading(false);
  };

  const filterSuppliers = () => {
    let filtered = [...suppliers];

    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.email?.toLowerCase().includes(search.toLowerCase()) ||
          s.contact_name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    setFilteredSuppliers(filtered);
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <p>Cargando proveedores...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Proveedores</h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Gestiona tus proveedores y órdenes de compra
          </p>
        </div>
        {canCreate && (
          <Link href="/dashboard/suppliers/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proveedor
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Filtros</CardTitle>
          <CardDescription className="text-sm">Busca y filtra proveedores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o contacto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredSuppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-base md:text-lg font-semibold mb-2">No hay proveedores</h3>
            <p className="text-muted-foreground text-center mb-4 text-sm md:text-base">
              {search || statusFilter !== "all"
                ? "No se encontraron proveedores con los filtros aplicados"
                : "Comienza agregando tu primer proveedor"}
            </p>
            {!search && statusFilter === "all" && (
              <Link href="/dashboard/suppliers/new" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Proveedor
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Vista de tabla para escritorio */}
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        {supplier.tax_id && (
                          <p className="text-sm text-muted-foreground">
                            CUIT: {supplier.tax_id}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.contact_name || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{supplier.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{supplier.phone}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.city || supplier.state ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {[supplier.city, supplier.state]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className={`font-semibold ${supplierBalances[supplier.id] > 0 ? 'text-red-600' : ''}`}>
                          ${(supplierBalances[supplier.id] || 0).toFixed(2)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          supplier.status === "active" ? "default" : "secondary"
                        }
                      >
                        {supplier.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/suppliers/${supplier.id}`}>
                              Ver detalles
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenAccountModal(supplier)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Cuenta corriente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </Card>

          {/* Vista de tarjetas para móvil */}
          <div className="block md:hidden space-y-3">
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="p-4">
                <div className="space-y-3">
                  {/* Header con nombre y estado */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{supplier.name}</p>
                      {supplier.tax_id && (
                        <p className="text-xs text-muted-foreground">CUIT: {supplier.tax_id}</p>
                      )}
                      {supplier.contact_name && (
                        <p className="text-xs text-muted-foreground">Contacto: {supplier.contact_name}</p>
                      )}
                    </div>
                    <Badge variant={supplier.status === "active" ? "default" : "secondary"} className="flex-shrink-0">
                      {supplier.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>

                  {/* Información de contacto */}
                  <div className="space-y-2 text-sm">
                    {supplier.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{supplier.email}</span>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    {(supplier.city || supplier.state) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">
                          {[supplier.city, supplier.state].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Saldo */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Saldo</span>
                    </div>
                    <span className={`font-bold ${supplierBalances[supplier.id] > 0 ? 'text-red-600' : ''}`}>
                      ${(supplierBalances[supplier.id] || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Link href={`/dashboard/suppliers/${supplier.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Ver detalles
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenAccountModal(supplier)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Cuenta
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <div className="text-sm text-muted-foreground px-4 md:px-0">
        Mostrando {filteredSuppliers.length} de {suppliers.length} proveedores
      </div>

      {/* Modales */}
      {selectedSupplierForAccount && (
        <SupplierAccountModal
          supplierId={selectedSupplierForAccount.id}
          supplierName={selectedSupplierForAccount.name}
          open={accountModalOpen}
          onOpenChange={setAccountModalOpen}
        />
      )}
    </div>
  );
}
