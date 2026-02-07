"use client";

import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, Calendar, CreditCard, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Sale, SalePayment } from "@/lib/types/erp";

interface PaymentManagerProps {
  sale: Sale;
  onPaymentAdded: () => void;
  onAddPayment: (payment: {
    amount: number;
    paymentMethod: string;
    referenceNumber?: string;
    notes?: string;
  }) => Promise<{ error?: string; data?: any }>;
}

export function PaymentManager({ sale, onPaymentAdded, onAddPayment }: PaymentManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [formData, setFormData] = useState({
    amount: 0,
    paymentMethod: "efectivo",
    paymentDate: "",
    referenceNumber: "",
    notes: "",
  });

  // Cuando se abre el diálogo, establecer el monto al saldo pendiente
  const handleDialogOpen = (open: boolean) => {
    setDialogOpen(open);
    if (open) {
      const balance = getBalance();
      setFormData(prev => ({
        ...prev,
        amount: balance,
        paymentDate: new Date().toISOString().split("T")[0],
      }));
      setAmountReceived(0);
    }
  };

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

  const getTotalPaid = () => {
    return (sale.payments || []).reduce((sum, payment) => sum + payment.amount, 0);
  };

  const getBalance = () => {
    return sale.total - getTotalPaid();
  };

  const getChange = () => {
    if (formData.paymentMethod !== "efectivo" || amountReceived <= 0) return 0;
    return amountReceived - formData.amount;
  };

  const getPaymentStatusBadge = () => {
    const balance = getBalance();
    if (balance <= 0) {
      return <Badge variant="default">Pagado</Badge>;
    } else if (getTotalPaid() > 0) {
      return <Badge variant="outline">Pago Parcial</Badge>;
    } else {
      return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    if (formData.amount > getBalance()) {
      toast.error("El monto no puede ser mayor al saldo pendiente");
      return;
    }

    // Validar que el monto recibido sea suficiente si es efectivo
    if (formData.paymentMethod === "efectivo" && amountReceived > 0 && amountReceived < formData.amount) {
      toast.error("El monto recibido es insuficiente");
      return;
    }

    setLoading(true);
    try {
      const result = await onAddPayment({
        amount: formData.amount,
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber || undefined,
        notes: formData.notes || undefined,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Pago registrado exitosamente");
        setDialogOpen(false);
        setFormData({
          amount: 0,
          paymentMethod: "efectivo",
          paymentDate: "",
          referenceNumber: "",
          notes: "",
        });
        setAmountReceived(0);
        onPaymentAdded();
      }
    } catch (error) {
      toast.error("Error al registrar el pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Gestión de Pagos
          </CardTitle>
          {getPaymentStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total de la Venta</p>
            <p className="text-2xl font-bold">{formatCurrency(sale.total)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Pagado</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(getTotalPaid())}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Saldo Pendiente</p>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(getBalance())}
            </p>
          </div>
        </div>

        {/* Add Payment Button */}
        {getBalance() > 0 && (
          <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Registrar Pago
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Pago</DialogTitle>
                <DialogDescription>
                  Saldo pendiente: {formatCurrency(getBalance())}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Monto <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={getBalance()}
                    required
                    value={formData.amount || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    El monto se ha establecido automáticamente al saldo pendiente
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Método de Pago</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) =>
                      setFormData({ ...formData, paymentMethod: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="tarjeta_debito">Tarjeta de Débito</SelectItem>
                      <SelectItem value="tarjeta_credito">Tarjeta de Crédito</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="mercadopago">MercadoPago</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">Número de Referencia</Label>
                  <Input
                    id="referenceNumber"
                    placeholder="Ej: Transferencia #12345"
                    value={formData.referenceNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, referenceNumber: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    placeholder="Notas adicionales sobre el pago..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>

                {/* Calculadora de Vuelto para Efectivo */}
                {formData.paymentMethod === "efectivo" && formData.amount > 0 && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3 border-2 border-primary/20">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="amount_received" className="text-base font-semibold">
                        💵 Calculadora de Vuelto
                      </Label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="amount_received">Monto Recibido del Cliente</Label>
                      <Input
                        id="amount_received"
                        type="number"
                        min="0"
                        step="0.01"
                        value={amountReceived || ""}
                        onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                        placeholder="Ingresa el monto que te dio el cliente"
                        className="text-lg font-semibold"
                      />
                    </div>

                    {amountReceived > 0 && (
                      <>
                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span className="text-muted-foreground">Monto del pago:</span>
                          <span className="font-semibold">{formatCurrency(formData.amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Monto recibido:</span>
                          <span className="font-semibold">{formatCurrency(amountReceived)}</span>
                        </div>
                        <div className={`flex justify-between text-xl font-bold pt-2 border-t ${
                          getChange() >= 0 ? 'text-green-600' : 'text-destructive'
                        }`}>
                          <span>Vuelto a devolver:</span>
                          <span>{formatCurrency(getChange())}</span>
                        </div>
                        {getChange() < 0 && (
                          <p className="text-sm text-destructive flex items-center gap-2">
                            ⚠️ El monto recibido es insuficiente. Faltan {formatCurrency(Math.abs(getChange()))}
                          </p>
                        )}
                        {getChange() > 0 && (
                          <p className="text-sm text-green-600 flex items-center gap-2">
                            ✓ Debes devolver {formatCurrency(getChange())} al cliente
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Registrando..." : "Registrar Pago"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Payment History */}
        {sale.payments && sale.payments.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Historial de Pagos</h3>
            <div className="space-y-2">
              {sale.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <Badge variant="outline" className="capitalize">
                        {payment.payment_method.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(payment.payment_date)}</span>
                    </div>
                    {payment.reference_number && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Ref: {payment.reference_number}
                      </p>
                    )}
                    {payment.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {payment.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Payments Message */}
        {(!sale.payments || sale.payments.length === 0) && (
          <div className="text-center py-6 text-muted-foreground">
            <DollarSign className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>No hay pagos registrados</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
