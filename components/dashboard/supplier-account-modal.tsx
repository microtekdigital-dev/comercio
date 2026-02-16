"use client";

import { useState, useEffect } from "react";
import { getSupplierAccountMovements, getSupplierBalance, addGeneralSupplierPayment } from "@/lib/actions/suppliers";
import type { AccountMovement } from "@/lib/actions/suppliers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SupplierAccountModalProps {
  supplierId: string;
  supplierName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupplierAccountModal({
  supplierId,
  supplierName,
  open,
  onOpenChange,
}: SupplierAccountModalProps) {
  const [movements, setMovements] = useState<AccountMovement[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Payment form state
  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentMethod: "",
    referenceNumber: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, supplierId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [movementsData, balanceData] = await Promise.all([
        getSupplierAccountMovements(supplierId),
        getSupplierBalance(supplierId),
      ]);
      setMovements(movementsData);
      setBalance(balanceData);
    } catch (error) {
      console.error("Error loading supplier account data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentData.amount || !paymentData.paymentMethod) {
      toast({
        title: "Error",
        description: "Por favor completa los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await addGeneralSupplierPayment(
        supplierId,
        parseFloat(paymentData.amount),
        paymentData.paymentMethod,
        paymentData.referenceNumber || undefined,
        paymentData.notes || undefined
      );

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: "Pago registrado correctamente",
        });
        
        // Reset form and reload data
        setPaymentData({
          amount: "",
          paymentMethod: "",
          referenceNumber: "",
          notes: "",
        });
        setShowPaymentForm(false);
        await loadData();
      }
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast({
        title: "Error",
        description: "Error al registrar el pago",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cuenta Corriente - {supplierName}</DialogTitle>
          <DialogDescription>
            Detalle de movimientos y saldo actual
          </DialogDescription>
        </DialogHeader>

        {/* Saldo destacado */}
        <div className="rounded-lg border p-4 bg-muted/50">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Saldo Actual:</span>
            <span className={`text-2xl font-bold ${balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : ''}`}>
              ${balance.toFixed(2)}
            </span>
          </div>
          {balance > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Monto pendiente de pago al proveedor
            </p>
          )}
          
          {/* Botón para registrar pago */}
          <div className="mt-4">
            {!showPaymentForm ? (
              <Button
                onClick={() => setShowPaymentForm(true)}
                size="sm"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar Pago
              </Button>
            ) : (
              <Button
                onClick={() => setShowPaymentForm(false)}
                size="sm"
                variant="outline"
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            )}
          </div>
        </div>

        {/* Formulario de pago */}
        {showPaymentForm && (
          <form onSubmit={handleSubmitPayment} className="rounded-lg border p-4 space-y-4 bg-blue-50/50">
            <h3 className="font-semibold text-sm">Nuevo Pago</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Método de Pago *</Label>
                <Select
                  value={paymentData.paymentMethod}
                  onValueChange={(value) => setPaymentData({ ...paymentData, paymentMethod: value })}
                  required
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                    <SelectItem value="check">Cheque</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceNumber">Número de Referencia</Label>
              <Input
                id="referenceNumber"
                type="text"
                placeholder="Opcional"
                value={paymentData.referenceNumber}
                onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Notas adicionales (opcional)"
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrar Pago"
              )}
            </Button>
          </form>
        )}

        {/* Tabla de movimientos */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay movimientos registrados
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Debe</TableHead>
                  <TableHead className="text-right">Haber</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={`${movement.type}-${movement.id}`}>
                    <TableCell>
                      {movement.date.toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell>{movement.reference}</TableCell>
                    <TableCell>
                      <Badge variant={movement.type === 'purchase' ? 'default' : 'secondary'}>
                        {movement.description}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {movement.debit > 0 ? `$${movement.debit.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {movement.credit > 0 ? `$${movement.credit.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${movement.balance.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
