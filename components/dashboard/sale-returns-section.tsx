"use client";

import { useEffect, useState } from "react";
import { getReturnsBySale } from "@/lib/actions/returns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { SaleReturn } from "@/lib/types/erp";

const METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  customer_credit: "Crédito al cliente",
};

const REASON_LABELS: Record<string, string> = {
  defective_product: "Producto defectuoso",
  wrong_product: "Producto equivocado",
  customer_changed_mind: "Cambio de opinión",
  damaged_in_transit: "Dañado en tránsito",
  other: "Otro",
};

interface Props {
  saleId: string;
  saleStatus: string;
  salePaymentStatus: string;
}

export function SaleReturnsSection({ saleId, saleStatus, salePaymentStatus }: Props) {
  const [returns, setReturns] = useState<SaleReturn[]>([]);

  useEffect(() => {
    if (saleId) {
      getReturnsBySale(saleId).then(setReturns);
    }
  }, [saleId]);

  const canReturn =
    saleStatus === "completed" && salePaymentStatus !== "refunded";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Devoluciones</CardTitle>
        {canReturn && (
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/returns/new?saleId=${saleId}`}>
              Registrar Devolución
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {returns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay devoluciones para esta venta.</p>
        ) : (
          <div className="space-y-3">
            {returns.map((ret) => (
              <div
                key={ret.id}
                className="flex items-center justify-between border rounded-lg px-4 py-3 text-sm"
              >
                <div className="space-y-0.5">
                  <p className="font-medium font-mono">{ret.return_number}</p>
                  <p className="text-muted-foreground text-xs">
                    {REASON_LABELS[ret.reason] ?? ret.reason} ·{" "}
                    {METHOD_LABELS[ret.refund_method] ?? ret.refund_method} ·{" "}
                    {format(new Date(ret.return_date), "dd/MM/yyyy", { locale: es })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">
                    ${Number(ret.total_amount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                  <Link
                    href={`/dashboard/returns/${ret.id}`}
                    className="text-primary text-xs underline"
                  >
                    Ver
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
