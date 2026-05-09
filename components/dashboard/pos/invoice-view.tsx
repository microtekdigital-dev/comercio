'use client';

import { useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tag, Trash2, ShoppingCart as CartIcon, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { POSCart, POSCartItem } from '@/lib/types/pos';
import type { Customer } from '@/lib/types/erp';

// =====================================================
// Types
// =====================================================

export type InvoiceType = 'consumidor_final' | 'factura_a' | 'factura_b';

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  consumidor_final: 'Consumidor Final',
  factura_a: 'Factura A',
  factura_b: 'Factura B',
};

export const INVOICE_TYPE_LETTERS: Record<InvoiceType, string> = {
  consumidor_final: 'CF',
  factura_a: 'A',
  factura_b: 'B',
};

interface InvoiceViewProps {
  cart: POSCart;
  customer: Customer | null;
  invoiceType: InvoiceType;
  onInvoiceTypeChange: (type: InvoiceType) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onApplyDiscount: (type: 'percentage' | 'fixed', value: number) => void;
  onCheckout: () => void;
  onClear: () => void;
  currencySymbol?: string;
}

// =====================================================
// Helpers
// =====================================================

function fmt(n: number, symbol = '$') {
  return `${symbol}${Number(n).toFixed(2)}`;
}

// =====================================================
// Invoice Type Selector
// =====================================================

interface InvoiceTypeSelectorProps {
  value: InvoiceType;
  onChange: (type: InvoiceType) => void;
}

function InvoiceTypeSelector({ value, onChange }: InvoiceTypeSelectorProps) {
  const types: InvoiceType[] = ['consumidor_final', 'factura_a', 'factura_b'];

  return (
    <div className="flex gap-1">
      {types.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all min-h-[36px]
            ${value === type
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
            }
          `}
        >
          <span className={`
            inline-flex items-center justify-center w-5 h-5 rounded border text-[10px] font-bold
            ${value === type ? 'border-primary-foreground/50 text-primary-foreground' : 'border-muted-foreground/40'}
          `}>
            {INVOICE_TYPE_LETTERS[type]}
          </span>
          <span className="hidden sm:inline">{INVOICE_TYPE_LABELS[type]}</span>
        </button>
      ))}
    </div>
  );
}

// =====================================================
// Invoice Item Row
// =====================================================

interface InvoiceItemRowProps {
  item: POSCartItem;
  index: number;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  currencySymbol: string;
}

function InvoiceItemRow({ item, index, onUpdateQuantity, onRemoveItem, currencySymbol }: InvoiceItemRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      onUpdateQuantity(item.id, val);
    }
  };

  return (
    <tr className="border-b border-border/50 hover:bg-muted/30 group">
      {/* # */}
      <td className="py-2 px-2 text-center text-xs text-muted-foreground w-8">
        {index + 1}
      </td>

      {/* Cant */}
      <td className="py-2 px-2 text-center w-20">
        <input
          ref={inputRef}
          type="number"
          min={1}
          value={item.quantity}
          onChange={handleQtyChange}
          className="w-14 text-center text-sm border border-border rounded px-1 py-0.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </td>

      {/* Código */}
      <td className="py-2 px-2 text-xs text-muted-foreground w-24 font-mono">
        {item.product_sku ?? '—'}
      </td>

      {/* Descripción */}
      <td className="py-2 px-2 text-sm">
        <div className="font-medium leading-tight">{item.product_name}</div>
        {item.variant_name && (
          <div className="text-xs text-muted-foreground">{item.variant_name}</div>
        )}
      </td>

      {/* Precio unit */}
      <td className="py-2 px-2 text-right text-sm font-mono whitespace-nowrap">
        {fmt(item.unit_price, currencySymbol)}
      </td>

      {/* Desc % */}
      <td className="py-2 px-2 text-center text-sm w-16">
        {item.discount_percent > 0 ? (
          <Badge variant="secondary" className="text-xs px-1">
            {item.discount_percent}%
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </td>

      {/* Total */}
      <td className="py-2 px-2 text-right text-sm font-mono font-semibold whitespace-nowrap">
        {fmt(item.subtotal, currencySymbol)}
      </td>

      {/* Acciones */}
      <td className="py-2 px-1 w-8">
        <button
          onClick={() => onRemoveItem(item.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded min-h-[32px] min-w-[32px] flex items-center justify-center"
          aria-label="Eliminar item"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

// =====================================================
// Discount Modal (same as ShoppingCart's)
// =====================================================

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentType: 'percentage' | 'fixed';
  currentValue: number;
  onApply: (type: 'percentage' | 'fixed', value: number) => void;
}

function DiscountModal({ isOpen, onClose, currentType, currentValue, onApply }: DiscountModalProps) {
  const [type, setType] = useState<'percentage' | 'fixed'>(currentType);
  const [value, setValue] = useState(currentValue > 0 ? String(currentValue) : '');

  const handleApply = () => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      onApply(type, num);
    }
    onClose();
  };

  const handleRemove = () => {
    onApply('percentage', 0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Aplicar descuento
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de descuento</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'percentage' | 'fixed')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                <SelectItem value="fixed">Monto fijo ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Valor</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {type === 'percentage' ? '%' : '$'}
              </span>
              <Input
                type="number"
                min={0}
                max={type === 'percentage' ? 100 : undefined}
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pl-8"
                placeholder="0"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleApply()}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          {currentValue > 0 && (
            <Button variant="ghost" size="sm" onClick={handleRemove} className="mr-auto">
              <X className="h-3 w-3 mr-1" />
              Quitar descuento
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleApply}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// Main InvoiceView Component
// =====================================================

export function InvoiceView({
  cart,
  customer,
  invoiceType,
  onInvoiceTypeChange,
  onUpdateQuantity,
  onRemoveItem,
  onApplyDiscount,
  onCheckout,
  onClear,
  currencySymbol = '$',
}: InvoiceViewProps) {
  const isEmpty = cart.items.length === 0;
  const hasDiscount = cart.discount_amount > 0;
  const totalItems = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-background">

      {/* ── Header: tipo de comprobante ── */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <CartIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Comprobante</span>
          {!isEmpty && (
            <Badge variant="secondary" className="text-xs">{totalItems}</Badge>
          )}
        </div>
        <InvoiceTypeSelector value={invoiceType} onChange={onInvoiceTypeChange} />
      </div>

      {/* ── Customer info bar ── */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-4 py-2 border-b bg-muted/10 text-xs">
        <div className="flex gap-1.5">
          <span className="text-muted-foreground font-medium shrink-0">Cliente:</span>
          <span className="font-semibold truncate">
            {customer?.name ?? 'Consumidor Final'}
          </span>
        </div>
        <div className="flex gap-1.5">
          <span className="text-muted-foreground font-medium shrink-0">CUIT/DNI:</span>
          <span className="font-mono">
            {customer?.document_number ?? '—'}
          </span>
        </div>
        <div className="flex gap-1.5">
          <span className="text-muted-foreground font-medium shrink-0">Dirección:</span>
          <span className="truncate">
            {customer?.address ?? '—'}
          </span>
        </div>
        <div className="flex gap-1.5">
          <span className="text-muted-foreground font-medium shrink-0">Condición IVA:</span>
          <span>
            {invoiceType === 'factura_a'
              ? 'Resp. Inscripto'
              : invoiceType === 'factura_b'
              ? 'Monotributista'
              : 'Consumidor Final'}
          </span>
        </div>
      </div>

      {/* ── Items table ── */}
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground py-12">
          <CartIcon className="h-12 w-12 opacity-20" />
          <p className="text-sm">Sin artículos</p>
          <p className="text-xs opacity-70">Seleccioná productos del catálogo</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                <th className="py-2 px-2 text-center font-medium w-8">#</th>
                <th className="py-2 px-2 text-center font-medium w-20">Cant.</th>
                <th className="py-2 px-2 text-left font-medium w-24">Código</th>
                <th className="py-2 px-2 text-left font-medium">Descripción</th>
                <th className="py-2 px-2 text-right font-medium">Precio</th>
                <th className="py-2 px-2 text-center font-medium w-16">Desc.</th>
                <th className="py-2 px-2 text-right font-medium">Total</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item, index) => (
                <InvoiceItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemoveItem={onRemoveItem}
                  currencySymbol={currencySymbol}
                />
              ))}
            </tbody>
          </table>
        </ScrollArea>
      )}

      {/* ── Totals ── */}
      {!isEmpty && (
        <div className="border-t px-4 pt-3 pb-2 space-y-1.5 bg-muted/10">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-mono">{fmt(cart.subtotal, currencySymbol)}</span>
          </div>

          {hasDiscount && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Descuento
                {cart.discount_type === 'percentage' && cart.discount_value > 0 && (
                  <span className="text-xs">({cart.discount_value}%)</span>
                )}
              </span>
              <span className="font-mono">-{fmt(cart.discount_amount, currencySymbol)}</span>
            </div>
          )}

          {cart.tax_amount > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>IVA</span>
              <span className="font-mono">{fmt(cart.tax_amount, currencySymbol)}</span>
            </div>
          )}

          <Separator className="my-1.5" />

          <div className="flex justify-between font-bold text-base">
            <span>TOTAL</span>
            <span className="font-mono text-lg">{fmt(cart.total, currencySymbol)}</span>
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="px-4 pb-4 pt-2 flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDiscountModalOpen(true)}
            disabled={isEmpty}
            className="flex-1 min-h-[40px]"
          >
            <Tag className="h-4 w-4 mr-1.5" />
            {hasDiscount ? 'Desc. aplicado' : 'Descuento'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            disabled={isEmpty}
            className="min-h-[40px] px-3 text-muted-foreground hover:text-destructive"
            aria-label="Limpiar"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <Button
          onClick={onCheckout}
          disabled={isEmpty}
          className="w-full min-h-[48px] text-base font-semibold"
          size="lg"
        >
          Cobrar
          {!isEmpty && (
            <span className="ml-2 opacity-80 font-mono">
              {fmt(cart.total, currencySymbol)}
            </span>
          )}
        </Button>
      </div>

      {/* Discount modal */}
      <DiscountModal
        isOpen={discountModalOpen}
        onClose={() => setDiscountModalOpen(false)}
        currentType={cart.discount_type}
        currentValue={cart.discount_value}
        onApply={onApplyDiscount}
      />
    </div>
  );
}
