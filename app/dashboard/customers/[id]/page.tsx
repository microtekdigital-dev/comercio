"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getCustomer, updateCustomer, deleteCustomer } from "@/lib/actions/customers";
import { getCustomerRepairHistory } from "@/lib/actions/repair-orders";
import { getUserPermissions } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Save, Trash2, Wrench, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Customer, RepairOrder } from "@/lib/types/erp";

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  received: { label: 'Recibido', variant: 'secondary' },
  diagnosing: { label: 'En Diagnóstico', variant: 'default' },
  waiting_parts: { label: 'Esperando Repuestos', variant: 'secondary' },
  repairing: { label: 'En Reparación', variant: 'default' },
  repaired: { label: 'Reparado', variant: 'default' },
  delivered: { label: 'Entregado', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [canDelete, setCanDelete] = useState(false);
  const [repairs, setRepairs] = useState<RepairOrder[]>([]);
  const [repairStats, setRepairStats] = useState({
    totalRepairs: 0,
    totalAmount: 0,
    activeRepairs: 0
  });
  const [loadingRepairs, setLoadingRepairs] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    document_type: "DNI",
    document_number: "",
    address: "",
    city: "",
    state: "",
    country: "Argentina",
    postal_code: "",
    notes: "",
    status: "active" as "active" | "inactive" | "blocked",
  });

  useEffect(() => {
    loadCustomer();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const permissions = await getUserPermissions();
    setCanDelete(permissions.canDeleteCustomers);
  };

  const loadCustomer = async () => {
    const data = await getCustomer(params.id as string);
    if (data) {
      setCustomer(data);
      setFormData({
        name: data.name,
        email: data.email || "",
        phone: data.phone || "",
        document_type: data.document_type || "DNI",
        document_number: data.document_number || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        country: data.country,
        postal_code: data.postal_code || "",
        notes: data.notes || "",
        status: data.status,
      });
    } else {
      toast.error("Cliente no encontrado");
      router.push("/dashboard/customers");
    }
  };

  const loadRepairHistory = async () => {
    if (!params.id) return;
    
    setLoadingRepairs(true);
    try {
      const history = await getCustomerRepairHistory(params.id as string);
      setRepairs(history.repairs);
      setRepairStats(history.stats);
    } catch (error) {
      console.error('Error loading repair history:', error);
      toast.error('Error al cargar historial de reparaciones');
    } finally {
      setLoadingRepairs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateCustomer(params.id as string, formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Cliente actualizado exitosamente");
        router.push("/dashboard/customers");
        router.refresh();
      }
    } catch (error) {
      toast.error("Error al actualizar el cliente");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);

    try {
      const result = await deleteCustomer(params.id as string);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Cliente eliminado exitosamente");
        router.push("/dashboard/customers");
        router.refresh();
      }
    } catch (error) {
      toast.error("Error al eliminar el cliente");
    } finally {
      setLoading(false);
    }
  };

  if (!customer) {
    return (
      <div className="flex-1 p-8">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/customers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Detalle del Cliente</h2>
            <p className="text-muted-foreground">
              {customer.name}
            </p>
          </div>
        </div>
        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={loading}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente el cliente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="repairs" onClick={() => {
            if (repairs.length === 0 && !loadingRepairs) {
              loadRepairHistory();
            }
          }}>
            <Wrench className="h-4 w-4 mr-2" />
            Reparaciones
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Información Básica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Nombre Completo <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Estado</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: "active" | "inactive" | "blocked") =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="inactive">Inactivo</SelectItem>
                          <SelectItem value="blocked">Bloqueado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="document_type">Tipo de Documento</Label>
                      <Select
                        value={formData.document_type}
                        onValueChange={(value) =>
                          setFormData({ ...formData, document_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DNI">DNI</SelectItem>
                          <SelectItem value="CUIT">CUIT</SelectItem>
                          <SelectItem value="CUIL">CUIL</SelectItem>
                          <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="document_number">Número de Documento</Label>
                      <Input
                        id="document_number"
                        value={formData.document_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            document_number: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Dirección</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">Ciudad</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">Provincia</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) =>
                          setFormData({ ...formData, state: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Código Postal</Label>
                      <Input
                        id="postal_code"
                        value={formData.postal_code}
                        onChange={(e) =>
                          setFormData({ ...formData, postal_code: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Notas Adicionales</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={4}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <Link href="/dashboard/customers">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Repairs Tab */}
        <TabsContent value="repairs" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total de Reparaciones</CardDescription>
                <CardTitle className="text-3xl">{repairStats.totalRepairs}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Monto Total</CardDescription>
                <CardTitle className="text-3xl">{formatCurrency(repairStats.totalAmount)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Reparaciones Activas</CardDescription>
                <CardTitle className="text-3xl">{repairStats.activeRepairs}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Repairs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Reparaciones</CardTitle>
              <CardDescription>
                Todas las reparaciones realizadas para este cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRepairs ? (
                <div className="text-center py-8">Cargando reparaciones...</div>
              ) : repairs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay reparaciones registradas para este cliente
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Orden N°</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repairs.map((repair) => {
                      const statusInfo = STATUS_LABELS[repair.status] || STATUS_LABELS.received;
                      return (
                        <TableRow key={repair.id}>
                          <TableCell className="font-medium">#{repair.order_number}</TableCell>
                          <TableCell>{formatDate(repair.received_date)}</TableCell>
                          <TableCell>
                            {repair.device_type} {repair.brand} {repair.model}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusInfo.variant}>
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/dashboard/repairs/${repair.id}`}>
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
