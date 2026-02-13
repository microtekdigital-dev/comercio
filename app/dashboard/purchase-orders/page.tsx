"use client";

import { useState, useEffect } from "react";
import { getPurchaseOrders } from "@/lib/actions/purchase-orders";
import { getSuppliers } from "@/lib/actions/suppliers";
import type { PurchaseOrder, Supplier } from "@/lib/types/erp";
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
import { Plus, Search, ShoppingCart } from "lucide-react";
import Link from "next/link";

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, search, statusFilter, supplierFilter]);

  const loadData = async () => {
    setLoading(true);
    const [ordersData, suppliersData] = await Promise.all([
      getPurchaseOrders(),
      getSuppliers(),
    ]);
    setOrders(ordersData);
    setSuppliers(suppliersData);
    setLoading(false);
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (search) {
      filtered = filtered.filter(
        (o) =>
          o.order_number.toLowerCase().includes(search.toLowerCase()) ||
          o.supplier?.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }

    if (supplierFilter !== "all") {
      filtered = filtered.filter((o) => o.supplier_id === supplierFilter);
    }

    setFilteredOrders(filtered);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      confirmed: "default",
      received: "default",
      cancelled: "destructive",
    };

    const labels: Record<string, string> = {
      pending: "Pendiente",
      confirmed: "Confirmada",
      received: "Recibida",
      cancelled: "Cancelada",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      partial: "default",
      paid: "default",
    };

    const labels: Record<string, string> = {
      pending: "Pendiente",
      partial: "Parcial",
      paid: "Pagado",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <p>Cargando órdenes de compra...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Órdenes de Compra</h2>
          <p className="text-muted-foreground">
            Gestiona tus compras a proveedores
          </p>
        </div>
        <Link href="/dashboard/purchase-orders/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Orden
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca y filtra órdenes de compra</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número o proveedor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                <SelectItem value="received">Recibida</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay órdenes de compra</h3>
            <p className="text-muted-foreground text-center mb-4">
              {search || statusFilter !== "all" || supplierFilter !== "all"
                ? "No se encontraron órdenes con los filtros aplicados"
                : "Comienza creando tu primera orden de compra"}
            </p>
            {!search && statusFilter === "all" && supplierFilter === "all" && (
              <Link href="/dashboard/purchase-orders/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Orden
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Vista de tabla para escritorio */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.order_number}
                    </TableCell>
                    <TableCell>{order.supplier?.name}</TableCell>
                    <TableCell>{formatDate(order.order_date)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{getPaymentStatusBadge(order.payment_status)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/purchase-orders/${order.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver detalles
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Vista de tarjetas para móvil */}
          <div className="block md:hidden space-y-3">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="space-y-3">
                  {/* Header con número y badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground truncate">{order.supplier?.name}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end flex-shrink-0">
                      {getStatusBadge(order.status)}
                      {getPaymentStatusBadge(order.payment_status)}
                    </div>
                  </div>

                  {/* Información principal */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha</p>
                      <p className="font-medium">{formatDate(order.order_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-bold">{formatCurrency(order.total)}</p>
                    </div>
                  </div>

                  {/* Botón de acción */}
                  <Link href={`/dashboard/purchase-orders/${order.id}`} className="block">
                    <Button variant="outline" size="sm" className="w-full">
                      Ver detalles
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <div className="text-sm text-muted-foreground">
        Mostrando {filteredOrders.length} de {orders.length} órdenes
      </div>
    </div>
  );
}
