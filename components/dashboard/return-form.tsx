"use client";

import type { CreateReturnInput } from "@/lib/types/erp";

const REASON_OPTIONS = [
  { value: "defective_product", label: "Producto defectuoso" },
  { value: "wrong_product", label: "Producto equivocado" },
  { value: "customer_changed_mind", label: "Cambio de opinión del cliente" },
  { value: "damaged_in_transit", label: "Dañado en tránsito" },
  { value: "other", label: "Otro" },
] as const;

const METHOD_OPTIONS = [
  { value: "cash", label: "Efectivo" },
  { value: "transfer", label: "Transferencia" },
  { value: "customer_credit", label: "Crédito al cliente" },
] as const;

interface ReturnFormProps {
  reason: CreateReturnInput["reason"] | "";
  reasonNotes: string;
  refundMethod: CreateReturnInput["refund_method"] | "";
  totalAmount: number;
  hasCustomer: boolean;
  onReasonChange: (v: CreateReturnInput["reason"]) => void;
  onReasonNotesChange: (v: string) => void;
  onRefundMethodChange: (v: CreateReturnInput["refund_method"]) => void;
}

export function ReturnForm({
  reason,
  reasonNotes,
  refundMethod,
  totalAmount,
  hasCustomer,
  onReasonChange,
  onReasonNotesChange,
  onRefundMethodChange,
}: ReturnFormProps) {
  return (
    <div className="space-y-4">
      {/* Motivo */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Motivo de devolución *</label>
        <select
          value={reason}
          onChange={(e) => onReasonChange(e.target.value as CreateReturnInput["reason"])}
          className="w-full border rounded px-3 py-2 text-sm bg-background text-foreground border-input"
          required
        >
          <option value="">Seleccionar motivo...</option>
          {REASON_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {reason === "other" && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Descripción del motivo *</label>
          <textarea
            value={reasonNotes}
            onChange={(e) => onReasonNotesChange(e.target.value)}
            placeholder="Describa el motivo (mínimo 10 caracteres)"
            className="w-full border rounded px-3 py-2 text-sm min-h-[80px] bg-background text-foreground border-input"
            required
            minLength={10}
          />
        </div>
      )}

      {/* Método de devolución */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Método de devolución *</label>
        <div className="flex flex-wrap gap-3">
          {METHOD_OPTIONS.map((o) => {
            const disabled = o.value === "customer_credit" && !hasCustomer;
            return (
              <label
                key={o.value}
                className={`flex items-center gap-2 cursor-pointer ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <input
                  type="radio"
                  name="refundMethod"
                  value={o.value}
                  checked={refundMethod === o.value}
                  onChange={() => onRefundMethodChange(o.value as CreateReturnInput["refund_method"])}
                  disabled={disabled}
                />
                <span className="text-sm">{o.label}</span>
              </label>
            );
          })}
        </div>
        {!hasCustomer && (
          <p className="text-xs text-muted-foreground">
            Crédito al cliente no disponible: la venta no tiene cliente asociado.
          </p>
        )}
      </div>

      {/* Resumen */}
      <div className="bg-muted/40 rounded-lg p-4 flex items-center justify-between">
        <span className="text-sm font-medium">Total a devolver</span>
        <span className="text-lg font-bold">
          ${totalAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}
