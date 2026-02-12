"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  getPurchaseOrder,
  updatePurchaseOrderStatus,
  receiveItems,
  addSupplierPayment,
  deletePurchaseOrder,
} from "@/lib/actions/purchase-orders";
import type { PurchaseOrder } from "@/lib/types/erp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Package, DollarSign, Trash2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({});
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    payment_method: "transferencia",
    reference_number: "",
    notes: "",
  });

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    const data = await getPurchaseOrder(id);
    setOrder(data);
    setLoading(false);
  };

  const handleStatusChange = async (status: "pending" | "confirmed" | "received" | "cancelled") => {
    const result = await updatePurchaseOrderStatus(id, status);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Estado actualizado");
      loadOrder();
    }
  };

  const handleReceiveItems = async () => {
    const items = Object.entries(receiveQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity }));

    if (items.length === 0) {
      toast.error("Ingresa las cantidades a recibir");
      return;
    }

    const result = await receiveItems(id, items);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Mercadería recibida y stock actualizado");
      setReceiveDialogOpen(false);
      setReceiveQuantities({});
      loadOrder();
    }
  };

  const handleAddPayment = async () => {
    if (paymentData.amount <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    const result = await addSupplierPayment(
      id,
      paymentData.amount,
      paymentData.payment_method,
      paymentData.reference_number,
      paymentData.notes
    );

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Pago registrado");
      setPaymentDialogOpen(false);
      setPaymentData({
        amount: 0,
        payment_method: "transferencia",
        reference_number: "",
        notes: "",
      });
      loadOrder();
    }
  };

  const handleDelete = async () => {
    const result = await deletePurchaseOrder(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Orden eliminada");
      router.push("/dashboard/purchase-orders");
    }
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
    const variants: Record<string, any> = {
      pending: "secondary",
      confirmed: "default",
      received: "outline",
      cancelled: "destructive",
    };
    const labels: Record<string, string> = {
      pending: "Pendiente",
      confirmed: "Confirmada",
      received: "Recibida",
      cancelled: "Cancelada",
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  if (loading) return <div className="flex-1 p-8">Cargando...</div>;
  if (!order) return <div className="flex-1 p-8">Orden no encontrada</div>;

  const totalPaid = order.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balance = order.total - totalPaid;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/purchase-orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold">Orden {order.order_number}</h2>
            <p className="text-muted-foreground">{order.supplier?.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {order.status !== "received" && order.status !== "cancelled" && (
            <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Package className="mr-2 h-4 w-4" />
                  Recibir Mercadería
                </Button>
              </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Recibir Mercadería</DialogTitle>
                    <DialogDescription>
                      Ingresa las cantidades recibidas. El stock se actualizará automáticamente.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Ordenado: {item.quantity} | Recibido: {item.received_quantity}
                          </p>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          max={item.quantity - item.received_quantity}
                          placeholder="Cantidad"
                          value={receiveQuantities[item.id] || ""}
                          onChange={(e) =>
                            setReceiveQuantities((prev) => ({
                              ...prev,
                              [item.id]: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-32"
                        />
                      </div>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setReceiveDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleReceiveItems}>Confirmar Recepción</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
          )}

          {balance > 0 && order.status !== "cancelled" && (
            <Dialog 
              open={paymentDialogOpen} 
              onOpenChange={(open) => {
                setPaymentDialogOpen(open);
                // Cuando se abre el modal, establecer el monto al saldo pendiente
                if (open) {
                  setPaymentData((prev) => ({
                    ...prev,
                    amount: balance,
                  }));
                }
              }}
            >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Registrar Pago
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Pago</DialogTitle>
                    <DialogDescription>
                      Saldo pendiente: {formatCurrency(balance)}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Monto</Label>
                      <Input
                        type="number"
                        min="0"
                        max={balance}
                        step="0.01"
                        value={paymentData.amount || ""}
                        onChange={(e) =>
                          setPaymentData((prev) => ({
                            ...prev,
                            amount: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Método de Pago</Label>
                      <Select
                        value={paymentData.payment_method}
                        onValueChange={(value) =>
                          setPaymentData((prev) => ({ ...prev, payment_method: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="transferencia">Transferencia</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="tarjeta_debito">Tarjeta Débito</SelectItem>
                          <SelectItem value="tarjeta_credito">Tarjeta Crédito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Referencia</Label>
                      <Input
                        value={paymentData.reference_number}
                        onChange={(e) =>
                          setPaymentData((prev) => ({
                            ...prev,
                            reference_number: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notas</Label>
                      <Textarea
                        value={paymentData.notes}
                        onChange={(e) =>
                          setPaymentData((prev) => ({ ...prev, notes: e.target.value }))
                        }
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddPayment}>Registrar Pago</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar orden?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={order.status}
              onValueChange={(value: any) => handleStatusChange(value)}
              disabled={order.status === "received" || order.status === "cancelled"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                <SelectItem value="received">Recibida</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(order.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pagado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {formatCurrency(balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Recibido</TableHead>
                <TableHead>Costo Unit.</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      {item.product_sku && (
                        <p className="text-sm text-muted-foreground">SKU: {item.product_sku}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.received_quantity}
                      {item.received_quantity >= item.quantity && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(item.unit_cost)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {order.payments && order.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    <TableCell className="capitalize">
                      {payment.payment_method.replace("_", " ")}
                    </TableCell>
                    <TableCell>{payment.reference_number || "-"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
