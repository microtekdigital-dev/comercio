'use client';

import { Tag, CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// =====================================================
// Types
// =====================================================

export interface POSActionToolbarProps {
  /** Abrir modal de descuento (F3) */
  onOpenDiscount: () => void;
  /** Abrir selector de método de pago / finalizar venta (F4 / F12) */
  onOpenPayment: () => void;
  /** Cancelar venta (F9) */
  onCancelSale: () => void;
  /** Finalizar venta (F12) */
  onFinalizeSale: () => void;
  /** Si el carrito está vacío — deshabilita Cancelar y Pagar */
  cartIsEmpty: boolean;
}

// =====================================================
// Component
// =====================================================

/**
 * Barra de acciones del POS para dispositivos móviles y táctiles.
 *
 * Muestra botones con tamaño mínimo de 44px para facilitar el toque,
 * con el atajo de teclado correspondiente como hint visual.
 *
 * Botones:
 * - Descuento (F3)
 * - Pagar     (F4 / F12)
 * - Cancelar  (F9)
 *
 * Requirements: 9.10
 */
export function POSActionToolbar({
  onOpenDiscount,
  onOpenPayment,
  onCancelSale,
  onFinalizeSale,
  cartIsEmpty,
}: POSActionToolbarProps) {
  return (
    <div
      className="flex items-center gap-2 p-2 border-t bg-background"
      role="toolbar"
      aria-label="Acciones rápidas del POS"
    >
      {/* Descuento — F3 */}
      <Button
        variant="outline"
        className="flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 h-auto py-1.5"
        onClick={onOpenDiscount}
        aria-label="Aplicar descuento (F3)"
      >
        <Tag className="h-4 w-4" />
        <span className="text-xs font-medium leading-none">Descuento</span>
        <span className="text-[10px] text-muted-foreground leading-none">F3</span>
      </Button>

      {/* Pagar — F4 / F12 */}
      <Button
        variant="default"
        className="flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 h-auto py-1.5"
        onClick={onOpenPayment}
        disabled={cartIsEmpty}
        aria-label="Pagar (F4 / F12)"
      >
        <CreditCard className="h-4 w-4" />
        <span className="text-xs font-medium leading-none">Pagar</span>
        <span className="text-[10px] leading-none opacity-80">F4 / F12</span>
      </Button>

      {/* Cancelar — F9 */}
      <Button
        variant="destructive"
        className="flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 h-auto py-1.5"
        onClick={onCancelSale}
        disabled={cartIsEmpty}
        aria-label="Cancelar venta (F9)"
      >
        <X className="h-4 w-4" />
        <span className="text-xs font-medium leading-none">Cancelar</span>
        <span className="text-[10px] leading-none opacity-80">F9</span>
      </Button>
    </div>
  );
}
