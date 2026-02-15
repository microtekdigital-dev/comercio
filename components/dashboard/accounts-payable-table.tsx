"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AccountPayable } from "@/lib/types/accounts-settlement";
import { AlertCircle } from "lucide-react";

interface AccountsPayableTableProps {
  data: AccountPayable[];
  currency: string;
  isLoading: boolean;
}

export function AccountsPayableTable({
  data,
  currency,
  isLoading,
}: AccountsPayableTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency || "ARS",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cuentas por Pagar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cuentas por Pagar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">
              No hay cuentas por pagar pendientes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuentas por Pagar</CardTitle>
        <p className="text-sm text-muted-foreground">
          Órdenes de compra pendientes de pago
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha Orden</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Pagado</TableHead>
                <TableHead className="text-right">Saldo Pendiente</TableHead>
                <TableHead className="text-right">Días Vencido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">
                    {account.supplierName}
                  </TableCell>
                  <TableCell>
                    {account.orderDate.toLocaleDateString("es-AR")}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(account.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(account.paid)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(account.balance)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {account.daysOverdue > 30 && (
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      )}
                      <span
                        className={
                          account.daysOverdue > 30
                            ? "text-orange-600 font-semibold"
                            : ""
                        }
                      >
                        {account.daysOverdue}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
