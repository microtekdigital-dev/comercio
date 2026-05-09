'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import type { POSPayment } from '@/lib/types/pos';
import { POS_PAYMENT_METHODS } from '@/lib/types/pos';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentEntry {
  id: string;
  payment_method: string;
  amount: string;
  received: string;
}

interface PaymentModalRetroProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  subtotal?: number;
  discountAmount?: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  onApplyDiscount?: (type: 'percentage' | 'fixed', value: number) => void;
  onConfirm: (payments: POSPayment[]) => void | Promise<void>;
  currencySymbol?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isCash(method: string) { return method === 'Efectivo'; }
function parse(v: string) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }
function fmt(n: number, sym = '$') { return `${sym}${n.toFixed(2)}`; }
function genId() { return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(); }

// ─── Numpad ───────────────────────────────────────────────────────────────────

function Numpad({ onKey }: { onKey: (k: string) => void }) {
  const keys = ['7','8','9','4','5','6','1','2','3','.','0','⌫'];
  return (
    <div className="grid grid-cols-3 gap-1">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onKey(k)}
          className={`h-10 text-sm font-bold border border-[#808080] shadow-[2px_2px_0px_#808080] active:shadow-none active:translate-x-px active:translate-y-px
            ${k === '⌫'
              ? 'bg-[#c0392b] text-white hover:bg-[#e74c3c]'
              : 'bg-[#d4d0c8] hover:bg-[#c0c0c0] text-black'
            }`}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function PaymentModalRetro({
  isOpen,
  onClose,
  total,
  subtotal,
  discountAmount = 0,
  discountType = 'percentage',
  discountValue = 0,
  onApplyDiscount,
  onConfirm,
  currencySymbol = '$',
}: PaymentModalRetroProps) {
  const [entries, setEntries] = useState<PaymentEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<'amount' | 'received'>('received');
  const [loading, setLoading] = useState(false);

  // Reset on open
  useEffect(() => {
    if (!isOpen) return;
    const id = genId();
    setEntries([{ id, payment_method: 'Efectivo', amount: total.toFixed(2), received: total.toFixed(2) }]);
    setActiveId(id);
    setActiveField('received');
  }, [isOpen, total]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const totalAssigned = entries.reduce((s, e) => s + parse(e.amount), 0);
  const remaining = total - totalAssigned;
  const isValid = totalAssigned >= total - 0.001;

  const cashEntry = entries.find(e => isCash(e.payment_method));
  const vuelto = cashEntry
    ? Math.max(0, parse(cashEntry.received) - parse(cashEntry.amount))
    : 0;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const addEntry = () => {
    const used = entries.map(e => e.payment_method);
    const available = POS_PAYMENT_METHODS.find(m => !used.includes(m)) ?? POS_PAYMENT_METHODS[0];
    const id = genId();
    const amt = remaining > 0 ? remaining.toFixed(2) : '0.00';
    setEntries(prev => [...prev, { id, payment_method: available, amount: amt, received: amt }]);
    setActiveId(id);
    setActiveField('amount');
  };

  const removeEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const updateMethod = (id: string, method: string) => {
    setEntries(prev => prev.map(e => e.id !== id ? e : { ...e, payment_method: method }));
  };

  const updateAmount = (id: string, val: string) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      const updated = { ...e, amount: val };
      if (isCash(e.payment_method) && parse(e.received) < parse(val)) updated.received = val;
      return updated;
    }));
  };

  const updateReceived = (id: string, val: string) => {
    setEntries(prev => prev.map(e => e.id !== id ? e : { ...e, received: val }));
  };

  const handleNumpadKey = useCallback((key: string) => {
    if (!activeId) return;
    const apply = (cur: string): string => {
      if (key === '⌫') return cur.slice(0, -1) || '0';
      if (key === '.') return cur.includes('.') ? cur : cur + '.';
      return cur === '0' ? key : cur + key;
    };
    setEntries(prev => prev.map(e => {
      if (e.id !== activeId) return e;
      if (activeField === 'received' && isCash(e.payment_method)) {
        return { ...e, received: apply(e.received) };
      }
      const newAmt = apply(e.amount);
      const updated = { ...e, amount: newAmt };
      if (isCash(e.payment_method) && parse(e.received) < parse(newAmt)) updated.received = newAmt;
      return updated;
    }));
  }, [activeId, activeField]);

  const handleConfirm = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      await onConfirm(entries.map(e => ({ payment_method: e.payment_method, amount: parse(e.amount) })));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#d4d0c8] border-2 border-[#808080] shadow-[4px_4px_0px_#000] w-full max-w-md flex flex-col text-black select-none">

        {/* Title bar */}
        <div className="flex items-center justify-between bg-[#000080] px-2 py-1 shrink-0">
          <span className="text-white text-sm font-bold">💳 Confirmar Pago</span>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-5 h-5 bg-[#d4d0c8] border border-[#808080] text-black text-xs flex items-center justify-center font-bold hover:bg-[#c0c0c0] disabled:opacity-50"
          >✕</button>
        </div>

        <div className="p-3 space-y-3">

          {/* Total a pagar */}
          <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] px-3 py-2 flex items-center justify-between">
            <span className="text-sm font-bold">Total a pagar</span>
            <span className="text-2xl font-bold font-mono">{fmt(total, currencySymbol)}</span>
          </div>

          {/* Descuento global */}
          {onApplyDiscount && (
            <div className="border border-[#808080] bg-[#f0f0f0] shadow-[inset_1px_1px_2px_#808080] px-3 py-2 space-y-1.5">
              <div className="text-[10px] font-bold text-black uppercase tracking-wide">Descuento Global</div>
              <div className="flex items-center gap-2">
                <select
                  value={discountType}
                  onChange={e => onApplyDiscount(e.target.value as 'percentage' | 'fixed', discountValue)}
                  className="border border-[#808080] bg-white text-xs px-1 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none"
                >
                  <option value="percentage">%</option>
                  <option value="fixed">{currencySymbol}</option>
                </select>
                <input
                  type="number"
                  min={0}
                  step={discountType === 'percentage' ? 1 : 0.01}
                  max={discountType === 'percentage' ? 100 : undefined}
                  value={discountValue || ""}
                  onChange={e => onApplyDiscount(discountType, parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="flex-1 border border-[#808080] bg-white text-xs px-2 py-1 text-right font-mono shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]"
                />
                {discountAmount > 0 && (
                  <>
                    <span className="text-xs text-green-700 font-bold font-mono shrink-0">-{fmt(discountAmount, currencySymbol)}</span>
                    <button onClick={() => onApplyDiscount('percentage', 0)} className="text-red-600 text-xs font-bold hover:text-red-800 shrink-0" title="Quitar">✕</button>
                  </>
                )}
              </div>
              {discountAmount > 0 && subtotal !== undefined && (
                <div className="flex justify-between text-[10px] text-gray-600">
                  <span>Subtotal: {fmt(subtotal, currencySymbol)}</span>
                  <span>Descuento: -{fmt(discountAmount, currencySymbol)}</span>
                  <span className="font-bold text-black">Total: {fmt(total, currencySymbol)}</span>
                </div>
              )}
            </div>
          )}

          {/* Resumen asignado / pendiente / vuelto */}
          <div className="grid grid-cols-3 gap-2">
            <div className="border border-[#808080] bg-[#f0f0f0] shadow-[inset_1px_1px_2px_#808080] px-2 py-1 text-center">
              <div className="text-[10px] text-gray-600 font-bold uppercase">Asignado</div>
              <div className={`text-sm font-bold font-mono ${totalAssigned >= total ? 'text-green-700' : 'text-amber-700'}`}>
                {fmt(totalAssigned, currencySymbol)}
              </div>
            </div>
            <div className="border border-[#808080] bg-[#f0f0f0] shadow-[inset_1px_1px_2px_#808080] px-2 py-1 text-center">
              <div className="text-[10px] text-gray-600 font-bold uppercase">Pendiente</div>
              <div className={`text-sm font-bold font-mono ${remaining > 0.001 ? 'text-red-700' : 'text-gray-400'}`}>
                {remaining > 0.001 ? fmt(remaining, currencySymbol) : '—'}
              </div>
            </div>
            <div className="border border-[#808080] bg-[#f0f0f0] shadow-[inset_1px_1px_2px_#808080] px-2 py-1 text-center">
              <div className="text-[10px] text-gray-600 font-bold uppercase">Vuelto</div>
              <div className={`text-sm font-bold font-mono ${vuelto > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                {vuelto > 0 ? fmt(vuelto, currencySymbol) : '—'}
              </div>
            </div>
          </div>

          {/* Payment entries */}
          <div className="space-y-2">
            {entries.map((entry, idx) => (
              <div
                key={entry.id}
                className={`border-2 p-2 space-y-2 cursor-pointer ${activeId === entry.id ? 'border-[#000080] bg-white' : 'border-[#808080] bg-[#e8e8e8]'}`}
                onClick={() => { setActiveId(entry.id); setActiveField('amount'); }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#000080]">Pago {idx + 1}</span>
                  {entries.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeEntry(entry.id); }}
                      className="text-red-600 hover:text-red-800 text-xs font-bold px-1"
                    >✕</button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Método */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-gray-600 uppercase">Método</span>
                    <select
                      value={entry.payment_method}
                      onChange={(e) => { e.stopPropagation(); updateMethod(entry.id, e.target.value); }}
                      onClick={(e) => e.stopPropagation()}
                      className="border border-[#808080] bg-white text-xs px-1 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]"
                    >
                      {POS_PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  {/* Monto */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-gray-600 uppercase">Monto</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={entry.amount}
                      onChange={(e) => updateAmount(entry.id, e.target.value)}
                      onFocus={() => { setActiveId(entry.id); setActiveField('amount'); }}
                      onClick={(e) => e.stopPropagation()}
                      className={`border text-right font-mono text-sm px-1 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none w-full
                        ${activeId === entry.id && activeField === 'amount' ? 'border-[#000080] bg-[#ffffcc]' : 'border-[#808080] bg-white'}`}
                    />
                  </div>
                </div>

                {/* Efectivo: recibido + vuelto */}
                {isCash(entry.payment_method) && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-gray-600 uppercase">Recibido</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={entry.received}
                        onChange={(e) => updateReceived(entry.id, e.target.value)}
                        onFocus={() => { setActiveId(entry.id); setActiveField('received'); }}
                        onClick={(e) => e.stopPropagation()}
                        className={`border text-right font-mono text-base font-bold px-1 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none w-full
                          ${activeId === entry.id && activeField === 'received' ? 'border-[#000080] bg-[#ffffcc]' : 'border-[#808080] bg-white'}`}
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-gray-600 uppercase">Vuelto</span>
                      <div className={`border border-[#808080] px-1 py-1 text-right font-mono text-base font-bold shadow-[inset_1px_1px_2px_#808080]
                        ${Math.max(0, parse(entry.received) - parse(entry.amount)) > 0 ? 'bg-[#cce5ff] text-blue-800' : 'bg-[#f0f0f0] text-gray-400'}`}>
                        {fmt(Math.max(0, parse(entry.received) - parse(entry.amount)), currencySymbol)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Agregar método */}
            {entries.length < POS_PAYMENT_METHODS.length && (
              <button
                onClick={addEntry}
                className="w-full border border-dashed border-[#808080] bg-[#d4d0c8] py-1.5 text-xs font-bold hover:bg-[#c0c0c0] flex items-center justify-center gap-1"
              >
                <Plus className="h-3 w-3" /> Agregar método de pago
              </button>
            )}
          </div>

          {/* Numpad */}
          {activeId && <Numpad onKey={handleNumpadKey} />}

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-1 border-t border-[#808080]">
            <button
              onClick={onClose}
              disabled={loading}
              className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] active:shadow-none hover:bg-[#c0c0c0] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isValid || loading}
              className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] active:shadow-none hover:bg-[#c0c0c0] disabled:opacity-40 flex items-center gap-1"
            >
              {loading ? <><Loader2 className="h-3 w-3 animate-spin" /> Procesando...</> : '✔ Confirmar pago'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
