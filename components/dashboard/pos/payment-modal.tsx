'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Delete, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { POSPayment } from '@/lib/types/pos';
import { POS_PAYMENT_METHODS } from '@/lib/types/pos';

// =====================================================
// Types
// =====================================================

interface PaymentEntry {
  id: string;
  payment_method: string;
  amount: string; // string for controlled input
  received?: string; // only for cash: monto recibido
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (payments: POSPayment[]) => void | Promise<void>;
  currencySymbol?: string;
}

// =====================================================
// Helpers
// =====================================================

function isCash(method: string) {
  return method === 'Efectivo';
}

function parseAmount(value: string): number {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
}

function fmt(n: number, symbol: string) {
  return `${symbol}${n.toFixed(2)}`;
}

function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString();
}

// =====================================================
// Virtual Numpad
// =====================================================

interface NumpadProps {
  onKey: (key: string) => void;
}

function Numpad({ onKey }: NumpadProps) {
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫'];

  return (
    <div className="grid grid-cols-3 gap-2 mt-3">
      {keys.map((key) => (
        <Button
          key={key}
          type="button"
          variant={key === '⌫' ? 'destructive' : 'outline'}
          className="h-12 text-lg font-semibold"
          onClick={() => onKey(key)}
        >
          {key === '⌫' ? <Delete className="h-5 w-5" /> : key}
        </Button>
      ))}
    </div>
  );
}

// =====================================================
// Main Component
// =====================================================

export function PaymentModal({
  isOpen,
  onClose,
  total,
  onConfirm,
  currencySymbol = '$',
}: PaymentModalProps) {
  const [entries, setEntries] = useState<PaymentEntry[]>([
    { id: generateId(), payment_method: 'Efectivo', amount: total.toFixed(2), received: total.toFixed(2) },
  ]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<'amount' | 'received'>('amount');
  const [loading, setLoading] = useState(false);

  // Sync entries when modal opens or total changes
  useEffect(() => {
    if (isOpen) {
      setEntries([
        {
          id: generateId(),
          payment_method: 'Efectivo',
          amount: total.toFixed(2),
          received: total.toFixed(2),
        },
      ]);
      setActiveEntryId(null);
      setActiveField('amount');
    }
  }, [isOpen, total]);

  // ---- Derived values ----
  const totalAssigned = entries.reduce((sum, e) => sum + parseAmount(e.amount), 0);
  const remaining = total - totalAssigned;
  const isValid = totalAssigned >= total - 0.001;

  // Cash change calculation
  const cashEntry = entries.find((e) => isCash(e.payment_method));
  const cashAmount = cashEntry ? parseAmount(cashEntry.amount) : 0;
  const cashReceived = cashEntry ? parseAmount(cashEntry.received ?? '0') : 0;
  const change = cashReceived > cashAmount ? cashReceived - cashAmount : 0;

  // ---- Handlers ----

  const addEntry = () => {
    const usedMethods = entries.map((e) => e.payment_method);
    const available = POS_PAYMENT_METHODS.find((m) => !usedMethods.includes(m));
    const newEntry: PaymentEntry = {
      id: generateId(),
      payment_method: available ?? POS_PAYMENT_METHODS[0],
      amount: remaining > 0 ? remaining.toFixed(2) : '0.00',
    };
    setEntries((prev) => [...prev, newEntry]);
    setActiveEntryId(newEntry.id);
    setActiveField('amount');
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (activeEntryId === id) setActiveEntryId(null);
  };

  const updateMethod = (id: string, method: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, payment_method: method, received: isCash(method) ? e.amount : undefined }
          : e
      )
    );
  };

  const updateAmount = (id: string, value: string) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const updated = { ...e, amount: value };
        // Keep received >= amount for cash
        if (isCash(e.payment_method)) {
          const amt = parseAmount(value);
          const rec = parseAmount(e.received ?? '0');
          if (rec < amt) updated.received = value;
        }
        return updated;
      })
    );
  };

  const updateReceived = (id: string, value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, received: value } : e))
    );
  };

  // Numpad handler
  const handleNumpadKey = useCallback(
    (key: string) => {
      if (!activeEntryId) return;

      const applyKey = (current: string): string => {
        if (key === '⌫') return current.slice(0, -1) || '0';
        if (key === '.') {
          if (current.includes('.')) return current;
          return current + '.';
        }
        if (current === '0') return key;
        return current + key;
      };

      setEntries((prev) =>
        prev.map((e) => {
          if (e.id !== activeEntryId) return e;
          if (activeField === 'received' && isCash(e.payment_method)) {
            return { ...e, received: applyKey(e.received ?? '0') };
          }
          const newAmount = applyKey(e.amount);
          const updated = { ...e, amount: newAmount };
          if (isCash(e.payment_method)) {
            const amt = parseAmount(newAmount);
            const rec = parseAmount(e.received ?? '0');
            if (rec < amt) updated.received = newAmount;
          }
          return updated;
        })
      );
    },
    [activeEntryId, activeField]
  );

  const handleConfirm = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const payments: POSPayment[] = entries.map((e) => ({
        payment_method: e.payment_method,
        amount: parseAmount(e.amount),
      }));
      await onConfirm(payments);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  // Reset on open
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    } else {
      setEntries([
        {
          id: generateId(),
          payment_method: 'Efectivo',
          amount: total.toFixed(2),
          received: total.toFixed(2),
        },
      ]);
      setActiveEntryId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Confirmar Pago</DialogTitle>
        </DialogHeader>

        {/* Total summary */}
        <div className="rounded-lg bg-muted/50 border p-4 space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Total a pagar</span>
            <span className="font-semibold text-foreground text-base">
              {fmt(total, currencySymbol)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Asignado</span>
            <span className={cn('font-medium', totalAssigned >= total ? 'text-green-600' : 'text-amber-600')}>
              {fmt(totalAssigned, currencySymbol)}
            </span>
          </div>
          {remaining > 0.001 && (
            <div className="flex justify-between text-sm font-semibold text-destructive">
              <span>Pendiente</span>
              <span>{fmt(remaining, currencySymbol)}</span>
            </div>
          )}
          {change > 0.001 && (
            <div className="flex justify-between text-sm font-semibold text-blue-600">
              <span>Cambio (efectivo)</span>
              <span>{fmt(change, currencySymbol)}</span>
            </div>
          )}
        </div>

        {/* Payment entries */}
        <div className="space-y-3">
          {entries.map((entry, idx) => (
            <div
              key={entry.id}
              className={cn(
                'border rounded-lg p-3 space-y-3 cursor-pointer transition-colors',
                activeEntryId === entry.id ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/40'
              )}
              onClick={() => {
                setActiveEntryId(entry.id);
                setActiveField('amount');
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="text-xs shrink-0">
                  Pago {idx + 1}
                </Badge>
                {entries.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeEntry(entry.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Method selector */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Método</Label>
                  <Select
                    value={entry.payment_method}
                    onValueChange={(val) => updateMethod(entry.id, val)}
                  >
                    <SelectTrigger className="h-11" onClick={(e) => e.stopPropagation()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POS_PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount input */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Monto</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={entry.amount}
                    className={cn(
                      'h-11 text-right font-mono',
                      activeEntryId === entry.id && activeField === 'amount' && 'ring-2 ring-primary'
                    )}
                    onChange={(e) => updateAmount(entry.id, e.target.value)}
                    onFocus={() => {
                      setActiveEntryId(entry.id);
                      setActiveField('amount');
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Cash: received + change */}
              {isCash(entry.payment_method) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">
                      Dinero recibido del cliente
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={entry.received ?? entry.amount}
                      className={cn(
                        'h-12 text-right font-mono text-base font-semibold border-2',
                        activeEntryId === entry.id && activeField === 'received'
                          ? 'ring-2 ring-primary border-primary'
                          : 'border-muted-foreground/30'
                      )}
                      onChange={(e) => updateReceived(entry.id, e.target.value)}
                      onFocus={() => {
                        setActiveEntryId(entry.id);
                        setActiveField('received');
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus={isCash(entry.payment_method)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Vuelto</Label>
                    <div className={cn(
                      'h-12 flex items-center justify-end px-3 rounded-md border-2 font-mono font-bold text-lg',
                      Math.max(0, parseAmount(entry.received ?? entry.amount) - parseAmount(entry.amount)) > 0
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-muted border-muted text-muted-foreground'
                    )}>
                      {fmt(
                        Math.max(0, parseAmount(entry.received ?? entry.amount) - parseAmount(entry.amount)),
                        currencySymbol
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add payment method button */}
          {entries.length < POS_PAYMENT_METHODS.length && (
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 border-dashed"
              onClick={addEntry}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar método de pago
            </Button>
          )}
        </div>

        {/* Virtual numpad */}
        {activeEntryId && (
          <div className="border rounded-lg p-3 bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1 text-center">Teclado numérico</p>
            <Numpad onKey={handleNumpadKey} />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid || loading}
            className="min-w-[140px]"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {loading ? 'Procesando...' : 'Confirmar pago'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
