'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
import { Package, Trash2, Minus, Plus, Tag, ShoppingCart as CartIcon, X } from 'lucide-react';
import type { POSCart, POSCartItem } from '@/lib/types/pos';

// =====================================================
// Props
// =====================================================

interface ShoppingCartProps {
  cart: POSCart;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onApplyDiscount: (type: 'percentage' | 'fixed', value: number) => void;
  onCheckout: () => void;
  onClear: () => void;
}

// =====================================================
// Helpers
// =====================================================

function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

// =====================================================
// CartItem row
// =====================================================

interface CartItemRowProps {
  item: POSCartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
}

// Umbral de desplazamiento horizontal para activar el swipe-to-delete
const SWIPE_THRESHOLD = 80;

function CartItemRow({ item, onUpdateQuantity, onRemoveItem }: CartItemRowProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHorizontalSwipe = useRef(false);

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      onUpdateQuantity(item.id, val);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Determinar dirección dominante en el primer movimiento
    if (!isHorizontalSwipe.current && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
      isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
    }

    // Solo procesar si es un swipe horizontal hacia la izquierda
    if (!isHorizontalSwipe.current || deltaX > 0) return;

    // Prevenir scroll vertical mientras se hace swipe horizontal
    e.preventDefault();

    setIsSwiping(true);
    // Limitar el desplazamiento máximo a -120px
    setTranslateX(Math.max(deltaX, -120));
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;

    if (translateX <= -SWIPE_THRESHOLD) {
      // Desplazamiento suficiente: eliminar el item
      onRemoveItem(item.id);
    } else {
      // Desplazamiento insuficiente: volver a posición original
      setTranslateX(0);
    }

    setIsSwiping(false);
    touchStartX.current = null;
    touchStartY.current = null;
    isHorizontalSwipe.current = false;
  };

  const showDeleteBackground = translateX < -20;

  return (
    <div className="relative overflow-hidden">
      {/* Fondo rojo con ícono de basura (visible al hacer swipe) */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-destructive rounded-sm"
        style={{ width: Math.abs(Math.min(translateX, 0)) || 0 }}
        aria-hidden="true"
      >
        {showDeleteBackground && (
          <Trash2 className="h-5 w-5 text-white" />
        )}
      </div>

      {/* Contenido del item con transform para el efecto de swipe */}
      <div
        className="flex gap-3 py-3 bg-background relative"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Image */}
        <div className="h-14 w-14 shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden">
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image_url}
              alt={item.product_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package className="h-6 w-6 text-muted-foreground/40" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight truncate">{item.product_name}</p>
          {item.variant_name && (
            <Badge variant="secondary" className="text-xs mt-0.5">{item.variant_name}</Badge>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">{formatPrice(item.unit_price)} c/u</p>

          {/* Quantity controls */}
          <div className="flex items-center gap-1.5 mt-2">
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              className="rounded border flex items-center justify-center hover:bg-accent transition-colors min-h-[44px] min-w-[44px]"
              aria-label="Reducir cantidad"
            >
              <Minus className="h-3 w-3" />
            </button>
            <Input
              type="number"
              min={1}
              value={item.quantity}
              onChange={handleQtyChange}
              className="h-9 w-14 text-center text-sm px-1"
            />
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="rounded border flex items-center justify-center hover:bg-accent transition-colors min-h-[44px] min-w-[44px]"
              aria-label="Aumentar cantidad"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Subtotal + remove */}
        <div className="flex flex-col items-end justify-between shrink-0">
          <button
            onClick={() => onRemoveItem(item.id)}
            className="rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Eliminar item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold">{formatPrice(item.subtotal)}</p>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Discount Modal
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
// Main ShoppingCart component
// =====================================================

/**
 * Componente de carrito de compras para el POS.
 *
 * Muestra la lista de items con cantidades editables, resumen de totales
 * y botones de acción (descuento, limpiar, finalizar venta).
 *
 * Requirements: 1.4, 1.5
 */
export function ShoppingCart({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onApplyDiscount,
  onCheckout,
  onClear,
}: ShoppingCartProps) {
  const [discountModalOpen, setDiscountModalOpen] = useState(false);

  const isEmpty = cart.items.length === 0;
  const hasDiscount = cart.discount_amount > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <CartIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Carrito</span>
          {!isEmpty && (
            <Badge variant="secondary" className="text-xs">
              {cart.items.reduce((sum, i) => sum + i.quantity, 0)}
            </Badge>
          )}
        </div>
        {!isEmpty && (
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 min-h-[44px] px-1"
            aria-label="Limpiar carrito"
          >
            <Trash2 className="h-3 w-3" />
            Limpiar
          </button>
        )}
      </div>

      {/* Items list */}
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground py-12">
          <CartIcon className="h-12 w-12 opacity-20" />
          <p className="text-sm">El carrito está vacío</p>
          <p className="text-xs opacity-70">Seleccioná productos del catálogo</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="px-4 divide-y">
            {cart.items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Totals summary */}
      {!isEmpty && (
        <div className="border-t px-4 pt-3 pb-2 space-y-1.5">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPrice(cart.subtotal)}</span>
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
              <span>-{formatPrice(cart.discount_amount)}</span>
            </div>
          )}

          {cart.tax_amount > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Impuestos</span>
              <span>{formatPrice(cart.tax_amount)}</span>
            </div>
          )}

          <Separator className="my-2" />

          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span>{formatPrice(cart.total)}</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-4 pb-4 pt-2 flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDiscountModalOpen(true)}
          disabled={isEmpty}
          className="w-full min-h-[44px]"
        >
          <Tag className="h-4 w-4 mr-2" />
          {hasDiscount ? 'Modificar descuento' : 'Aplicar descuento'}
        </Button>

        <Button
          onClick={onCheckout}
          disabled={isEmpty}
          className="w-full min-h-[44px] text-base font-semibold"
          size="lg"
        >
          Finalizar venta
          {!isEmpty && <span className="ml-2 opacity-80">{formatPrice(cart.total)}</span>}
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
