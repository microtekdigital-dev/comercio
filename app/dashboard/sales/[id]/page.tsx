"use client";

import { useState, useEffect, useRef } from "react";
import { getSale, updateSale, addSalePayment, deleteSale, hasElectronicInvoice, getElectronicInvoiceForSale } from "@/lib/actions/sales";
import { getCompanyInfo } from "@/lib/actions/company";
import { getCompanySettings } from "@/lib/actions/company-settings";
import { sendInvoiceEmail } from "@/lib/actions/email";
import { getUserPermissions } from "@/lib/utils/permissions";
import { formatCompanyCurrency } from "@/lib/utils/currency";
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
import { ArrowLeft, Calendar, User, FileText, Save, Printer, Mail, Trash2, Receipt, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import { InvoicePrint } from "@/components/dashboard/invoice-print";
import { PaymentManager } from "@/components/dashboard/payment-manager";
import { SaleReturnsSection } from "@/components/dashboard/sale-returns-section";
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
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [currencyPosition, setCurrencyPosition] = useState<"before" | "after">("before");
  const [electronicInvoice, setElectronicInvoice] = useState<any>(null);
  const [hasEInvoice, setHasEInvoice] = useState(false);
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
      loadCurrencySettings();
      loadElectronicInvoice(resolvedParams.id);
    });
  }, []);

  const loadCurrencySettings = async () => {
    const settings = await getCompanySettings();
    if (settings) {
      setCurrencySymbol(settings.currency_symbol);
      setCurrencyPosition(settings.currency_position);
    }
  };

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
    const settings = await getCompanySettings();
    setCompanyInfo({
      name: data?.name || "Mi Empresa",
      address: data?.address || undefined,
      phone: data?.phone || undefined,
      email: data?.email || undefined,
      taxId: data?.tax_id || undefined,
      logoUrl: data?.logo_url || undefined,
      termsAndConditions: data?.terms_and_conditions || undefined,
      currencySymbol: settings?.currency_symbol || "$",
      currencyPosition: settings?.currency_position || "before",
    });
  };

  const loadElectronicInvoice = async (id: string) => {
    const hasInvoiceResult = await hasElectronicInvoice(id);
    if (hasInvoiceResult.success && hasInvoiceResult.hasInvoice) {
      setHasEInvoice(true);
      
      const invoiceResult = await getElectronicInvoiceForSale(id);
      if (invoiceResult.success && invoiceResult.invoice) {
        setElectronicInvoice(invoiceResult.invoice);
      }
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
    return formatCompanyCurrency(amount, { currency_symbol: currencySymbol, currency_position: currencyPosition });
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
        {sale && companyInfo && <InvoicePrint ref={invoiceRef} sale={sale} companyInfo={companyInfo} />}
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
          <Button variant="outline" onClick={handlePrint} disabled={!companyInfo}>
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

      {/* Electronic Invoice Card */}
      {hasEInvoice && electronicInvoice && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                <CardTitle>Factura Electrónica</CardTitle>
              </div>
              <Link href={`/dashboard/arca/invoices/${electronicInvoice.id}`}>
                <Button variant="outline" size="sm">
                  Ver Detalle
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Comprobante</p>
                <p className="font-medium">{electronicInvoice.invoice_type.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Número</p>
                <p className="font-medium">
                  {String(electronicInvoice.point_of_sale).padStart(5, '0')}-{String(electronicInvoice.invoice_number).padStart(8, '0')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge variant={
                  electronicInvoice.status === 'AUTHORIZED' ? 'default' :
                  electronicInvoice.status === 'PENDING' ? 'secondary' :
                  electronicInvoice.status === 'REJECTED' ? 'destructive' :
                  'outline'
                }>
                  {electronicInvoice.status}
                </Badge>
              </div>
            </div>

            {electronicInvoice.cae && (
              <div className="pt-4 border-t">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">CAE</p>
                    <p className="font-mono text-sm">{electronicInvoice.cae}</p>
                  </div>
                  {electronicInvoice.cae_expiration_date && (
                    <div>
                      <p className="text-sm text-muted-foreground">Vencimiento CAE</p>
                      <p className="text-sm">{formatDate(electronicInvoice.cae_expiration_date)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generate Electronic Invoice Button */}
      {!hasEInvoice && sale.status === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle>Facturación Electrónica</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Esta venta no tiene una factura electrónica asociada. Puede generar una factura electrónica para cumplir con las obligaciones fiscales.
            </p>
            <Link href={`/dashboard/arca/invoices/new?saleId=${sale.id}`}>
              <Button>
                <Receipt className="mr-2 h-4 w-4" />
                Generar Factura Electrónica
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

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

      {/* Returns Section */}
      <SaleReturnsSection saleId={saleId} saleStatus={sale.status} salePaymentStatus={sale.payment_status} />
    </div>
  );
}
