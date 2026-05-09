"use client";

import { useState } from "react";
import { Sale } from "@/lib/types/erp";
import { addSalePayment } from "@/lib/actions/sales";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const PAYMENT_METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta_debito", label: "Tarjeta de Débito" },
  { value: "tarjeta_credito", label: "Tarjeta de Crédito" },
  { value: "cheque", label: "Cheque" },
  { value: "mercadopago", label: "MercadoPago" },
];

interface QuickPaymentModalProps {
  sale?: Sale;
  entityId?: string;
  entityName?: string;
  entityType?: "supplier" | "customer";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess?: () => void;
  onSuccess?: () => void;
}

export function QuickPaymentModal({ sale, entityId, entityName, entityType, open, onOpenChange, onPaymentSuccess, onSuccess }: QuickPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(sale?.total?.toString() || "");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");

  const isSale = !!sale;
  const change = paymentMethod === "efectivo" && receivedAmount ? parseFloat(receivedAmount) - parseFloat(amount || "0") : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) { toast.error("Seleccioná un método de pago"); return; }
    if (!amount || parseFloat(amount) <= 0) { toast.error("El monto debe ser mayor a 0"); return; }
    if (!isSale) { toast.error("Este modal solo funciona para ventas"); return; }
    setLoading(true);
    try {
      const r = await addSalePayment(sale.id, parseFloat(amount), paymentMethod, referenceNumber || undefined, notes || undefined);
      if (r.error) { toast.error(r.error); }
      else { toast.success("Pago registrado"); if (onPaymentSuccess) onPaymentSuccess(); if (onSuccess) onSuccess(); }
    } catch { toast.error("Error al registrar el pago"); }
    finally { setLoading(false); }
  };

  if (!open) return null;

  const f = "border border-[#808080] bg-white text-sm px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full";
  const l = "text-xs font-bold text-black block mb-0.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[#d4d0c8] border-2 border-[#808080] shadow-[4px_4px_0px_#000] w-full max-w-md text-black select-none">

        {/* Title bar */}
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">💳 Registrar Pago</span>
          <button onClick={() => onOpenChange(false)} className="w-5 h-5 bg-[#d4d0c8] border border-[#808080] text-black text-xs flex items-center justify-center font-bold hover:bg-[#c0c0c0]">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Info */}
          <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] px-3 py-2 space-y-1 text-xs">
            {isSale ? (
              <>
                <div className="flex justify-between"><span className="text-gray-500">Venta:</span><span className="font-bold">#{sale.sale_number}</span></div>
                {sale.customer && <div className="flex justify-between"><span className="text-gray-500">Cliente:</span><span className="font-bold">{sale.customer.name}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Total:</span><span className="font-bold font-mono text-base">${sale.total.toFixed(2)}</span></div>
              </>
            ) : (
              <div className="flex justify-between"><span className="text-gray-500">{entityType === "customer" ? "Cliente:" : "Proveedor:"}</span><span className="font-bold">{entityName}</span></div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={l}>Monto *</label>
              <input type="number" step="0.01" min="0.01" required value={amount} onChange={e => setAmount(e.target.value)} className={f} />
            </div>
            <div>
              <label className={l}>Método de Pago *</label>
              <select required value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={f}>
                <option value="">Seleccionar...</option>
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          {/* Cash change calculator */}
          {paymentMethod === "efectivo" && (
            <div className="border-2 border-[#808080] bg-[#f0f0f0] shadow-[inset_1px_1px_2px_#808080] p-3 space-y-2">
              <div className="text-[10px] font-bold text-[#000080] uppercase">Calculadora de Vuelto</div>
              <div>
                <label className={l}>Monto Recibido</label>
                <input type="number" step="0.01" min="0" value={receivedAmount} onChange={e => setReceivedAmount(e.target.value)} placeholder="0.00" className={f} />
              </div>
              {change !== null && receivedAmount && (
                <div className="flex justify-between items-center border-t border-[#808080] pt-2">
                  <span className="text-xs font-bold">Vuelto:</span>
                  <span className={`text-lg font-bold font-mono ${change < 0 ? "text-red-600" : "text-green-700"}`}>
                    ${Math.abs(change).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className={l}>N° Referencia</label>
            <input type="text" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} placeholder="Opcional" className={f} />
          </div>
          <div>
            <label className={l}>Notas</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Opcional" className={f + " resize-none"} />
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-[#808080]">
            <button type="button" onClick={() => onOpenChange(false)} disabled={loading}
              className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading || !paymentMethod || !isSale}
              className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
              {loading ? <><Loader2 className="h-3 w-3 animate-spin" /> Registrando...</> : "✔ Registrar Pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
