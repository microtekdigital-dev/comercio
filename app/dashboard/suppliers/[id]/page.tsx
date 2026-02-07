"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getSupplier, updateSupplier, deleteSupplier, getSupplierStats } from "@/lib/actions/suppliers";
import { getUserPermissions } from "@/lib/utils/permissions";
import type { Supplier, SupplierFormData } from "@/lib/types/erp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Trash2, TrendingUp, ShoppingCart, DollarSign, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "Argentina",
    postal_code: "",
    tax_id: "",
    website: "",
    notes: "",
    status: "active",
    payment_terms: "",
  });

  useEffect(() => {
    loadSupplier();
    loadStats();
    checkPermissions();
  }, [id]);

  const checkPermissions = async () => {
    const permissions = await getUserPermissions();
    setCanEdit(permissions.canEditSuppliers);
    setCanDelete(permissions.canDeleteSuppliers);
  };

  const loadSupplier = async () => {
    const data = await getSupplier(id);
    if (data) {
      setSupplier(data);
      setFormData({
        name: data.name,
        contact_name: data.contact_name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        country: data.country,
        postal_code: data.postal_code || "",
        tax_id: data.tax_id || "",
        website: data.website || "",
        notes: data.notes || "",
        status: data.status,
        payment_terms: data.payment_terms || "",
      });
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const data = await getSupplierStats(id);
    setStats(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const result = await updateSupplier(id, formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Proveedor actualizado exitosamente");
      loadSupplier();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    const result = await deleteSupplier(id);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Proveedor eliminado exitosamente");
      router.push("/dashboard/suppliers");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <p>Cargando proveedor...</p>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex-1 p-8">
        <p>Proveedor no encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/suppliers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{supplier.name}</h2>
            <p className="text-muted-foreground">
              {canEdit ? "Edita la información del proveedor" : "Información del proveedor"}
            </p>
          </div>
        </div>
        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente el
                  proveedor y toda su información asociada.
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

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Órdenes
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingOrders} pendientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Comprado
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalPurchased)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Pagado
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalPaid)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Saldo Pendiente
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatCurrency(stats.balance)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Datos básicos del proveedor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nombre de la Empresa <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    disabled={!canEdit}
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_name">Nombre del Contacto</Label>
                  <Input
                    id="contact_name"
                    name="contact_name"
                    disabled={!canEdit}
                    value={formData.contact_name}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    disabled={!canEdit}
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    name="phone"
                    disabled={!canEdit}
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax_id">CUIT/RUT</Label>
                  <Input
                    id="tax_id"
                    name="tax_id"
                    disabled={!canEdit}
                    value={formData.tax_id}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Sitio Web</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    disabled={!canEdit}
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_terms">Términos de Pago</Label>
                  <Input
                    id="payment_terms"
                    name="payment_terms"
                    disabled={!canEdit}
                    value={formData.payment_terms}
                    onChange={handleChange}
                    placeholder="ej: 30 días, Contado"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    disabled={!canEdit}
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive") =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dirección</CardTitle>
              <CardDescription>Ubicación del proveedor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  name="address"
                  disabled={!canEdit}
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    name="city"
                    disabled={!canEdit}
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Provincia/Estado</Label>
                  <Input
                    id="state"
                    name="state"
                    disabled={!canEdit}
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    name="country"
                    disabled={!canEdit}
                    value={formData.country}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal_code">Código Postal</Label>
                  <Input
                    id="postal_code"
                    name="postal_code"
                    disabled={!canEdit}
                    value={formData.postal_code}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
              <CardDescription>Información adicional</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="notes"
                name="notes"
                disabled={!canEdit}
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                placeholder="Notas adicionales sobre el proveedor..."
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/dashboard/suppliers">
              <Button type="button" variant="outline">
                {canEdit ? "Cancelar" : "Volver"}
              </Button>
            </Link>
            {canEdit && (
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
