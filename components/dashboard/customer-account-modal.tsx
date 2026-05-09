"use client";

import { useState, useEffect } from "react";
import { getCustomerAccountMovements, getCustomerBalance, addGeneralCustomerPayment } from "@/lib/actions/customers";
import { getCompanySettings } from "@/lib/actions/company-settings";
import { formatCompanyCurrency } from "@/lib/utils/currency";
import type { AccountMovement } from "@/lib/actions/customers";
import type { CompanySettings } from "@/lib/types/erp";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface CustomerAccountModalProps {
  customerId: string;
  customerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerAccountModal({ customerId, customerName, open, onOpenChange }: CustomerAccountModalProps) {
  const [movements, setMovements] = useState<AccountMovement[]>([]);
  const [balance, setBalance] = useState(0);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState({ amount: "", paymentMethod: "", referenceNumber: "", notes: "" });

  useEffect(() => {
    if (open) { getCompanySettings().then(setSettings); loadData(); }
  }, [open, customerId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, b] = await Promise.all([getCustomerAccountMovements(customerId), getCustomerBalance(customerId)]);
      setMovements(m); setBalance(b);
    } finally { setLoading(false); }
  };

  const fmt = (n: number) => settings ? formatCompanyCurrency(n, settings) : `$${n.toFixed(2)}`;

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentData.amount || !paymentData.paymentMethod) { toast.error("Completá los campos requeridos"); return; }
    setSubmitting(true);
    try {
      const r = await addGeneralCustomerPayment(customerId, parseFloat(paymentData.amount), paymentData.paymentMethod, paymentData.referenceNumber || undefined, paymentData.notes || undefined);
      if (r.error) { toast.error(r.error); }
      else { toast.success("Pago registrado"); setPaymentData({ amount: "", paymentMethod: "", referenceNumber: "", notes: "" }); setShowPaymentForm(false); await loadData(); }
    } catch { toast.error("Error al registrar el pago"); }
    finally { setSubmitting(false); }
  };

  if (!open) return null;

  const f = "border border-[#808080] bg-white text-xs px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full";
  const l = "text-[10px] font-bold text-black block mb-0.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[#d4d0c8] border-2 border-[#808080] shadow-[4px_4px_0px_#000] w-full max-w-3xl max-h-[85vh] flex flex-col text-black select-none">

        {/* Title bar */}
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between shrink-0">
          <span className="text-white text-sm font-bold">📋 Cuenta Corriente — {customerName}</span>
          <button onClick={() => onOpenChange(false)} className="w-5 h-5 bg-[#d4d0c8] border border-[#808080] text-black text-xs flex items-center justify-center font-bold hover:bg-[#c0c0c0]">✕</button>
        </div>

        {/* Balance */}
        <div className="px-4 py-3 border-b-2 border-[#808080] bg-[#d4d0c8] shrink-0 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-600 font-bold">Saldo Actual</div>
            <div className={`text-2xl font-bold font-mono ${balance > 0 ? "text-green-700" : balance < 0 ? "text-red-600" : "text-black"}`}>
              {fmt(balance)}
            </div>
            <div className="text-[10px] text-gray-500">
              {balance > 0 ? "El cliente tiene saldo a favor" : balance < 0 ? "El cliente debe este monto" : "Sin saldo pendiente"}
            </div>
          </div>
          <button
            onClick={() => setShowPaymentForm(!showPaymentForm)}
            className={`border border-[#808080] px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 ${showPaymentForm ? "bg-[#c0c0c0]" : "bg-[#d4d0c8]"}`}
          >
            {showPaymentForm ? <><X className="h-3 w-3" /> Cancelar</> : <><Plus className="h-3 w-3" /> Registrar Pago</>}
          </button>
        </div>

        {/* Payment form */}
        {showPaymentForm && (
          <form onSubmit={handleSubmitPayment} className="px-4 py-3 border-b-2 border-[#808080] bg-[#f0f0f0] shrink-0 space-y-2">
            <div className="text-xs font-bold text-[#000080] mb-2">Nuevo Pago</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={l}>Monto *</label>
                <input type="number" step="0.01" required value={paymentData.amount} onChange={e => setPaymentData(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" className={f} />
              </div>
              <div>
                <label className={l}>Método de Pago *</label>
                <select required value={paymentData.paymentMethod} onChange={e => setPaymentData(p => ({ ...p, paymentMethod: e.target.value }))} className={f}>
                  <option value="">Seleccionar...</option>
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="check">Cheque</option>
                  <option value="card">Tarjeta</option>
                </select>
              </div>
              <div>
                <label className={l}>N° Referencia</label>
                <input type="text" value={paymentData.referenceNumber} onChange={e => setPaymentData(p => ({ ...p, referenceNumber: e.target.value }))} placeholder="Opcional" className={f} />
              </div>
              <div>
                <label className={l}>Notas</label>
                <input type="text" value={paymentData.notes} onChange={e => setPaymentData(p => ({ ...p, notes: e.target.value }))} placeholder="Opcional" className={f} />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={submitting} className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
                {submitting ? <><Loader2 className="h-3 w-3 animate-spin" /> Registrando...</> : "✔ Registrar Pago"}
              </button>
            </div>
          </form>
        )}

        {/* Movements table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-xs text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Cargando...</div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-500">Sin movimientos registrados</div>
          ) : (
            <>
              <div className="grid grid-cols-[90px_100px_1fr_100px_100px_100px] border-b-2 border-[#808080] bg-[#d4d0c8] sticky top-0">
                {["Fecha", "Referencia", "Descripción", "Debe", "Haber", "Saldo"].map((h, i) => (
                  <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>
                ))}
              </div>
              {movements.map((m, idx) => (
                <div key={`${m.type}-${m.id}`} className={`grid grid-cols-[90px_100px_1fr_100px_100px_100px] border-b border-[#e0e0e0] ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
                  <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0]">{m.date.toLocaleDateString("es-AR")}</div>
                  <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] truncate">{m.reference}</div>
                  <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0]">
                    <span className={`font-bold ${m.type === "sale" ? "text-blue-700" : "text-green-700"}`}>{m.description}</span>
                  </div>
                  <div className="px-2 py-1.5 text-xs text-right font-mono border-r border-[#e0e0e0] text-red-600">{m.debit > 0 ? fmt(m.debit) : "—"}</div>
                  <div className="px-2 py-1.5 text-xs text-right font-mono border-r border-[#e0e0e0] text-green-700">{m.credit > 0 ? fmt(m.credit) : "—"}</div>
                  <div className="px-2 py-1.5 text-xs text-right font-mono font-bold">{fmt(m.balance)}</div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-[#808080] px-3 py-1 bg-[#c0c0c0] shrink-0">
          <span className="text-[10px] text-gray-600">{movements.length} movimiento(s)</span>
        </div>
      </div>
    </div>
  );
}
