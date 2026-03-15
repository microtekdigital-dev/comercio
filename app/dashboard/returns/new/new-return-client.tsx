"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createReturn } from "@/lib/actions/returns";
import { ReturnItemsTable } from "@/components/dashboard/return-items-table";
import { ReturnForm } from "@/components/dashboard/return-form";
import type { Sale, CreateReturnInput } from "@/lib/types/erp";

interface ItemRow {
  sale_item_id: string;
  product_name: string;
  variant_name: string | null;
  quantity_sold: number;
  quantity_available: number;
  unit_price: number;
  item_total: number;
  quantity_to_return: number;
}

interface Props {
  sale: Sale;
  itemRows: ItemRow[];
  hasCustomer: boolean;
}

export function NewReturnClient({ sale, itemRows: initialRows, hasCustomer }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState<ItemRow[]>(initialRows);
  const [reason, setReason] = useState<CreateReturnInput["reason"] | "">("");
  const [reasonNotes, setReasonNotes] = useState("");
  const [refundMethod, setRefundMethod] = useState<CreateReturnInput["refund_method"] | "">("");
  const [error, setError] = useState<string | null>(null);

  const handleQtyChange = (saleItemId: string, qty: number) => {
    setRows((prev) =>
      prev.map((r) => (r.sale_item_id === saleItemId ? { ...r, quantity_to_return: qty } : r))
    );
  };

  const totalAmount = rows.reduce((sum, r) => {
    if (r.quantity_to_return <= 0) return sum;
    // Proportional total including tax/discount based on item total
    const pricePerUnit = r.item_total / r.quantity_sold;
    return sum + pricePerUnit * r.quantity_to_return;
  }, 0);

  const handleSubmit = () => {
    setError(null);

    const items = rows
      .filter((r) => r.quantity_to_return > 0)
      .map((r) => ({ sale_item_id: r.sale_item_id, quantity: r.quantity_to_return }));

    if (items.length === 0) {
      setError("Debe seleccionar al menos un ítem para devolver.");
      return;
    }
    if (!reason) {
      setError("Debe seleccionar un motivo.");
      return;
    }
    if (!refundMethod) {
      setError("Debe seleccionar un método de devolución.");
      return;
    }

    const input: CreateReturnInput = {
      sale_id: sale.id,
      items,
      refund_method: refundMethod as CreateReturnInput["refund_method"],
      reason: reason as CreateReturnInput["reason"],
      reason_notes: reasonNotes || undefined,
    };

    startTransition(async () => {
      const result = await createReturn(input);
      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/dashboard/returns/${result.data!.id}`);
      }
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Registrar Devolución</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Venta #{sale.sale_number} — Total: $
          {Number(sale.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
        </p>
      </div>

      <ReturnItemsTable items={rows} onChange={handleQtyChange} />

      <ReturnForm
        reason={reason}
        reasonNotes={reasonNotes}
        refundMethod={refundMethod}
        totalAmount={totalAmount}
        hasCustomer={hasCustomer}
        onReasonChange={setReason}
        onReasonNotesChange={setReasonNotes}
        onRefundMethodChange={setRefundMethod}
      />

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border rounded text-sm"
          disabled={isPending}
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending || totalAmount <= 0}
          className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
        >
          {isPending ? "Procesando..." : "Confirmar Devolución"}
        </button>
      </div>
    </div>
  );
}
