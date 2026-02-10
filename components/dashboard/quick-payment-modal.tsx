"use client";

import { useState } from "react";
import { Sale } from "@/lib/types/erp";
import { addSalePayment } from "@/lib/actions/sales";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Calculator } from "lucide-react";

interface QuickPaymentModalProps {
  sale: Sale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess: () => void;
}

interface PaymentFormState {
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  notes: string;
  receivedAmount: number;
}

const PAYMENT_METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta_debito", label: "Tarjeta de Débito" },
  { value: "tarjeta_credito", label: "Tarjeta de Crédito" },
  { value: "cheque", label: "Cheque" },
  { value: "mercadopago", label: "MercadoPago" },
];

export function QuickPaymentModal({
  sale,
  open,
  onOpenChange,
  onPaymentSuccess,
}: QuickPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PaymentFormState>({
    amount: sale.total,
    paymentMethod: "",
    referenceNumber: "",
    notes: "",
    receivedAmount: 0,
  });

  // Calcular el vuelto
  const change = formData.receivedAmount - formData.amount;
  const showChange = formData.paymentMethod === "efectivo" && formData.receivedAmount > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.paymentMethod) {
      toast.error("Debes seleccionar un método de pago");
      return;
    }

    if (formData.amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    setLoading(true);

    try {
      const result = await addSalePayment(
        sale.id,
        formData.amount,
        formData.paymentMethod,
        formData.referenceNumber || undefined,
        formData.notes || undefined
      );

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Pago registrado exitosamente");
        onPaymentSuccess();
      }
    } catch (error) {
      toast.error("Error al registrar el pago");
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFormData({ ...formData, amount: numValue });
      
      // Mostrar advertencia si excede el total
      if (numValue > sale.total) {
        toast.warning("El monto excede el total de la venta");
      }
    }
  };

  const handleReceivedAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData({ ...formData, receivedAmount: numValue });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>
            Registra el pago para la venta #{sale.sale_number}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información de la venta */}
          <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Venta:</span>
              <span className="text-sm font-medium">#{sale.sale_number}</span>
            </div>
            {sale.customer && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cliente:</span>
                <span className="text-sm font-medium">{sale.customer.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className="text-sm font-bold">
                ${sale.total.toFixed(2)} {sale.currency}
              </span>
            </div>
          </div>

          {/* Formulario de pago */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="amount">
                Monto del Pago <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                required
                aria-label="Monto del pago"
                aria-required="true"
                className="text-base"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="paymentMethod">
                Método de Pago <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) =>
                  setFormData({ ...formData, paymentMethod: value })
                }
                required
              >
                <SelectTrigger
                  id="paymentMethod"
                  aria-label="Método de pago"
                  aria-required="true"
                >
                  <SelectValue placeholder="Selecciona un método" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calculadora de vuelto - solo para efectivo */}
            {formData.paymentMethod === "efectivo" && (
              <div className="sm:col-span-2 space-y-3 rounded-lg border p-4 bg-primary/5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calculator className="h-4 w-4" />
                  Calculadora de Vuelto
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="receivedAmount">Monto Recibido</Label>
                  <Input
                    id="receivedAmount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={formData.receivedAmount || ""}
                    onChange={(e) => handleReceivedAmountChange(e.target.value)}
                    placeholder="Ingresa el monto recibido del cliente"
                    aria-label="Monto recibido"
                    className="text-base"
                  />
                </div>

                {showChange && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Vuelto a devolver:</span>
                      <span className={`text-lg font-bold ${change < 0 ? 'text-destructive' : 'text-primary'}`}>
                        ${Math.abs(change).toFixed(2)} {sale.currency}
                      </span>
                    </div>
                    {change < 0 && (
                      <p className="text-xs text-destructive mt-1">
                        Falta: ${Math.abs(change).toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="referenceNumber">Número de Referencia</Label>
              <Input
                id="referenceNumber"
                type="text"
                value={formData.referenceNumber}
                onChange={(e) =>
                  setFormData({ ...formData, referenceNumber: e.target.value })
                }
                placeholder="Opcional"
                aria-label="Número de referencia"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Notas adicionales (opcional)"
                rows={3}
                aria-label="Notas"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Registrar después
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.paymentMethod}
              aria-busy={loading}
              className="w-full sm:w-auto"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Registrando..." : "Registrar Pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
