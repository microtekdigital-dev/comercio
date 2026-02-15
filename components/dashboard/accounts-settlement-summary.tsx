"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingDown, TrendingUp, Scale } from "lucide-react";

interface AccountsSettlementSummaryProps {
  totalReceivable: number;
  totalPayable: number;
  netBalance: number;
  currency: string;
}

export function AccountsSettlementSummary({
  totalReceivable,
  totalPayable,
  netBalance,
  currency,
}: AccountsSettlementSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency || "ARS",
    }).format(amount);
  };

  const isPositiveBalance = netBalance >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Cuentas por Cobrar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Cuentas por Cobrar
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalReceivable)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total a cobrar de clientes
          </p>
        </CardContent>
      </Card>

      {/* Cuentas por Pagar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Cuentas por Pagar
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(totalPayable)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total a pagar a proveedores
          </p>
        </CardContent>
      </Card>

      {/* Balance Neto */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Balance Neto
          </CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              isPositiveBalance ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(netBalance)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isPositiveBalance
              ? "Saldo a favor"
              : "Saldo en contra"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
