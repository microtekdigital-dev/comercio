"use client";

import { useState, useEffect, useRef } from "react";
import { getSale, updateSale, addSalePayment, deleteSale } from "@/lib/actions/sales";
import { getCompanyInfo } from "@/lib/actions/company";
import { sendInvoiceEmail } from "@/lib/actions/email";
import { getUserPermissions } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calendar, User, FileText, Save, Printer, Mail, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import { InvoicePrint } from "@/components/dashboard/invoice-print";
import { PaymentManager } from "@/components/dashboard/payment-manager";
import type { Sale } from "@/lib/types/erp";

export default function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [saleId, setSaleId] = useState<string>("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [canDelete, setCanDelete] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Factura-${sale?.sale_number || ""}`,
  });

  useEffect(() => {
    params.then((resolvedParams) => {
      setSaleId(resolvedParams.id);
      loadSale(resolvedParams.id);
      loadCompanyInfo();
      checkPermissions();
    });
  }, []);

  const checkPermissions = async () => {
    const permissions = await getUserPermissions();
    setCanDelete(permissions.canDeleteSales);
    setCanEdit(permissions.canEditSales);
  };

  const loadSale = async (id: string) => {
    const data = await getSale(id);
    if (data) {
      setSale(data);
      setStatus(data.status);
      setEmailTo(data.customer?.email || "");
    }
  };

  const loadCompanyInfo = async () => {
    const data = await getCompanyInfo();
    if (data) {
      setCompanyInfo({
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        taxId: data.tax_id,
        logoUrl: data.logo_url,
        termsAndConditions: data.terms_and_conditions,
      });
    }
  };

  const handleUpdateStatus = async () => {
    if (!sale || !saleId) return;
    
    setLoading(true);
    try {
      const result = await updateSale(saleId, { status: status as any });
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Estado actualizado exitosamente");
        router.refresh();
        loadSale(saleId);
      }
    } catch (error) {
      toast.error("Error al actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailTo || !sale) {
      toast.error("Por favor ingresa un email válido");
      return;
    }

    setSendingEmail(true);
    try {
      const result = await sendInvoiceEmail({
        saleId: sale.id,
        recipientEmail: emailTo,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message || `Factura enviada a ${emailTo}`);
        setEmailDialogOpen(false);
      }
    } catch (error) {
      toast.error("Error al enviar el email");
    } finally {
      setSendingEmail(false);
    }
  };

  if (!sale) {
    return (
      <div className="flex-1 p-8">
        <p>Cargando...</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: sale.currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  const handleDelete = async () => {
    if (!saleId) return;
    
    setLoading(true);
    try {
      const result = await deleteSale(saleId);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Venta eliminada exitosamente");
        router.push("/dashboard/sales");
        router.refresh();
      }
    } catch (error) {
      toast.error("Error al eliminar la venta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Hidden invoice for printing */}
      <div className="hidden">
        {sale && <InvoicePrint ref={invoiceRef} sale={sale} companyInfo={companyInfo} />}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/sales">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Venta {sale.sale_number}
            </h2>
            <p className="text-muted-foreground">
              Detalles de la venta
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Enviar Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar Factura por Email</DialogTitle>
                <DialogDescription>
                  Ingresa el email del destinatario para enviar la factura
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="cliente@ejemplo.com"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEmailDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSendEmail} disabled={sendingEmail}>
                  {sendingEmail ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" disabled={loading}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar venta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente la venta
                    y se restaurará el stock de los productos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          {getStatusBadge(sale.status)}
          {getPaymentStatusBadge(sale.payment_status)}
        </div>
      </div>

      {/* Change Status Card */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Cambiar Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Estado de la Venta</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleUpdateStatus} 
                disabled={loading || status === sale.status}
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Guardando..." : "Actualizar Estado"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Venta</p>
                  <p className="font-medium">{formatDate(sale.sale_date)}</p>
                </div>
              </div>

              {sale.due_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Vencimiento</p>
                    <p className="font-medium">{formatDate(sale.due_date)}</p>
                  </div>
                </div>
              )}

              {sale.customer && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{sale.customer.name}</p>
                  </div>
                </div>
              )}

              {sale.payment_method && (
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Método de Pago</p>
                    <p className="font-medium capitalize">{sale.payment_method}</p>
                  </div>
                </div>
              )}
            </div>

            {sale.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Notas</p>
                <p className="text-sm">{sale.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Impuestos:</span>
              <span className="font-medium">{formatCurrency(sale.tax_amount)}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Descuento:</span>
                <span className="font-medium text-red-500">
                  -{formatCurrency(sale.discount_amount)}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items de Venta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sale.items && sale.items.length > 0 ? (
              <>
                <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                  <div className="col-span-4">Producto</div>
                  <div className="col-span-2 text-right">Cantidad</div>
                  <div className="col-span-2 text-right">Precio Unit.</div>
                  <div className="col-span-2 text-right">Desc.</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                {sale.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 md:p-0 border md:border-0 rounded-lg md:rounded-none"
                  >
                    <div className="md:col-span-4">
                      <p className="font-medium">{item.product_name}</p>
                      {item.variant_name && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          Talle: {item.variant_name}
                        </Badge>
                      )}
                      {item.product_sku && (
                        <p className="text-xs text-muted-foreground mt-1">
                          SKU: {item.product_sku}
                        </p>
                      )}
                    </div>
                    <div className="md:col-span-2 md:text-right">
                      <span className="md:hidden text-sm text-muted-foreground">Cantidad: </span>
                      {item.quantity}
                    </div>
                    <div className="md:col-span-2 md:text-right">
                      <span className="md:hidden text-sm text-muted-foreground">Precio: </span>
                      {formatCurrency(item.unit_price)}
                    </div>
                    <div className="md:col-span-2 md:text-right">
                      <span className="md:hidden text-sm text-muted-foreground">Descuento: </span>
                      {item.discount_percent}%
                    </div>
                    <div className="md:col-span-2 md:text-right font-semibold">
                      <span className="md:hidden text-sm text-muted-foreground">Total: </span>
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay items en esta venta
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Manager */}
      <PaymentManager
        sale={sale}
        onPaymentAdded={() => loadSale(saleId)}
        onAddPayment={async (payment) => {
          return await addSalePayment(
            saleId,
            payment.amount,
            payment.paymentMethod,
            payment.referenceNumber,
            payment.notes
          );
        }}
      />
    </div>
  );
}
