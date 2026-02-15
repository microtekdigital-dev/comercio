"use client";

import { useState, useEffect } from "react";
import { getSupplierAccountMovements, getSupplierBalance } from "@/lib/actions/suppliers";
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
import { Loader2 } from "lucide-react";

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
        </div>

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
