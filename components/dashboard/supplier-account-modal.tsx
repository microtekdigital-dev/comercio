"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSupplierAccountMovements, getSupplierBalance, addGeneralSupplierPayment } from "@/lib/actions/suppliers";
import { getCompanySettings } from "@/lib/actions/company-settings";
import { formatCompanyCurrency } from "@/lib/utils/currency";
import type { AccountMovement } from "@/lib/actions/suppliers";
import type { CompanySettings } from "@/lib/types/erp";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface SupplierAccountModalProps {
  supplierId: string;
  supplierName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const f = "border border-[#808080] bg-white text-xs px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full";
const l = "text-xs font-bold text-black block mb-0.5";

export function SupplierAccountModal({
  supplierId,
  supplierName,
  open,
  onOpenChange,
}: SupplierAccountModalProps) {
  const [movements, setMovements] = useState<AccountMovement[]>([]);
  const [balance, setBalance] = useState(0);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentMethod: "",
    referenceNumber: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      loadSettings();
      loadData();
    }
  }, [open, supplierId]);

  const loadSettings = async () => {
    const data = await getCompanySettings();
    setSettings(data);
  };

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

  const fmt = (amount: number) =>
    settings ? formatCompanyCurrency(amount, settings) : `$${amount.toFixed(2)}`;

  // ── Stable handlers ──────────────────────────────────────────────────────────
  const handlePaymentChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setPaymentData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleShowForm = useCallback(() => setShowPaymentForm(true), []);
  const handleHideForm = useCallback(() => setShowPaymentForm(false), []);
  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);

  // Close on overlay click
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current) onOpenChange(false);
    },
    [onOpenChange]
  );

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentData.amount || !paymentData.paymentMethod) {
      toast.error("Completá los campos requeridos");
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
        toast.error(result.error);
      } else {
        toast.success("Pago registrado correctamente");
        setPaymentData({ amount: "", paymentMethod: "", referenceNumber: "", notes: "" });
        setShowPaymentForm(false);
        await loadData();
      }
    } catch {
      toast.error("Error al registrar el pago");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      {/* Window */}
      <div className="w-full max-w-3xl mx-4 border-2 border-[#808080] shadow-[4px_4px_0px_#000] flex flex-col max-h-[90vh]">
        {/* Title bar */}
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between flex-shrink-0">
          <span className="text-white text-sm font-bold">
            💳 Cuenta Corriente — {supplierName}
          </span>
          <button
            onClick={handleClose}
            className="text-white hover:bg-[#cc0000] px-2 py-0.5 text-xs font-bold border border-[#6060a0]"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="bg-[#d4d0c8] p-3 overflow-y-auto flex-1 space-y-3">

          {/* Saldo */}
          <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] p-3">
            <div className="bg-[#c0c0c0] border-b border-[#808080] -mx-3 -mt-3 px-3 py-1 mb-3">
              <span className="text-xs font-bold">Saldo Actual</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Saldo con el proveedor:</span>
              <span
                className={`text-xl font-bold font-mono ${
                  balance > 0 ? "text-red-700" : balance < 0 ? "text-green-700" : "text-black"
                }`}
              >
                {fmt(balance)}
              </span>
            </div>
            {balance > 0 && (
              <p className="text-xs text-gray-500 mt-1">⚠ Monto pendiente de pago al proveedor</p>
            )}
            {balance < 0 && (
              <p className="text-xs text-gray-500 mt-1">✔ Saldo a favor</p>
            )}

            <div className="mt-3">
              {!showPaymentForm ? (
                <button
                  onClick={handleShowForm}
                  className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 w-full justify-center"
                >
                  <Plus className="h-3 w-3" /> Registrar Pago
                </button>
              ) : (
                <button
                  onClick={handleHideForm}
                  className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 w-full justify-center"
                >
                  <X className="h-3 w-3" /> Cancelar
                </button>
              )}
            </div>
          </div>

          {/* Formulario de pago */}
          {showPaymentForm && (
            <div className="border-2 border-[#000080] bg-white shadow-[inset_1px_1px_2px_#808080] p-3">
              <div className="bg-[#000080] border-b border-[#808080] -mx-3 -mt-3 px-3 py-1 mb-3">
                <span className="text-xs font-bold text-white">💵 Nuevo Pago</span>
              </div>
              <form onSubmit={handleSubmitPayment} className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={l}>Monto *</label>
                    <input
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={paymentData.amount}
                      onChange={handlePaymentChange}
                      required
                      className={f}
                    />
                  </div>
                  <div>
                    <label className={l}>Método de Pago *</label>
                    <select
                      name="paymentMethod"
                      value={paymentData.paymentMethod}
                      onChange={handlePaymentChange}
                      required
                      className={f}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="cash">Efectivo</option>
                      <option value="transfer">Transferencia</option>
                      <option value="check">Cheque</option>
                      <option value="card">Tarjeta</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className={l}>Número de Referencia</label>
                    <input
                      name="referenceNumber"
                      type="text"
                      placeholder="Opcional"
                      value={paymentData.referenceNumber}
                      onChange={handlePaymentChange}
                      className={f}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={l}>Notas</label>
                    <textarea
                      name="notes"
                      placeholder="Notas adicionales (opcional)"
                      value={paymentData.notes}
                      onChange={handlePaymentChange}
                      rows={2}
                      className={f + " resize-none"}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1 w-full justify-center"
                >
                  {submitting ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> Registrando...</>
                  ) : (
                    "✔ Registrar Pago"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Tabla de movimientos */}
          <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] p-3">
            <div className="bg-[#c0c0c0] border-b border-[#808080] -mx-3 -mt-3 px-3 py-1 mb-3">
              <span className="text-xs font-bold">Movimientos</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : movements.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500">
                No hay movimientos registrados
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#d4d0c8] border-b-2 border-[#808080]">
                      {["Fecha", "Referencia", "Descripción", "Debe", "Haber", "Saldo"].map((h, i) => (
                        <th
                          key={i}
                          className={`px-2 py-1 font-bold border-r border-[#808080] last:border-r-0 ${
                            i >= 3 ? "text-right" : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((mov, idx) => (
                      <tr
                        key={`${mov.type}-${mov.id}`}
                        className={`border-b border-[#e0e0e0] ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}
                      >
                        <td className="px-2 py-1 border-r border-[#e0e0e0] whitespace-nowrap">
                          {mov.date.toLocaleDateString("es-AR")}
                        </td>
                        <td className="px-2 py-1 border-r border-[#e0e0e0] font-mono">
                          {mov.reference}
                        </td>
                        <td className="px-2 py-1 border-r border-[#e0e0e0]">
                          <span
                            className={`inline-block px-1.5 py-0.5 text-[10px] font-bold border ${
                              mov.type === "purchase"
                                ? "bg-[#fff3cd] border-[#ffc107] text-[#856404]"
                                : "bg-[#d4edda] border-[#28a745] text-[#155724]"
                            }`}
                          >
                            {mov.description}
                          </span>
                        </td>
                        <td className="px-2 py-1 border-r border-[#e0e0e0] text-right font-mono text-red-700">
                          {mov.debit > 0 ? fmt(mov.debit) : "—"}
                        </td>
                        <td className="px-2 py-1 border-r border-[#e0e0e0] text-right font-mono text-green-700">
                          {mov.credit > 0 ? fmt(mov.credit) : "—"}
                        </td>
                        <td className="px-2 py-1 text-right font-mono font-bold">
                          {fmt(mov.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#d4d0c8] border-t-2 border-[#808080] px-3 py-2 flex justify-end flex-shrink-0">
          <button
            onClick={handleClose}
            className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
