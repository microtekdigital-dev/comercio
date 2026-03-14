'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import type { POSProductSearchResult } from '@/lib/types/pos';
import type { ProductVariant } from '@/lib/types/erp';

interface VariantSelectorModalProps {
  /** Producto cuyas variantes se van a mostrar. null = modal cerrado. */
  product: POSProductSearchResult | null;
  /** Callback al seleccionar una variante */
  onSelect: (product: POSProductSearchResult, variant: ProductVariant) => void;
  /** Callback al cerrar el modal sin seleccionar */
  onClose: () => void;
}

/**
 * Modal para seleccionar una variante de producto en el POS.
 *
 * - Muestra todas las variantes activas del producto.
 * - Muestra el stock disponible de cada variante.
 * - Deshabilita variantes con stock = 0.
 * - Al seleccionar una variante llama onSelect(product, variant).
 *
 * Requirements: 11.1, 11.2, 11.3
 */
export function VariantSelectorModal({
  product,
  onSelect,
  onClose,
}: VariantSelectorModalProps) {
  const isOpen = product !== null;
  const activeVariants = (product?.variants ?? []).filter((v) => v.is_active);

  const handleSelect = (variant: ProductVariant) => {
    if (!product || variant.stock_quantity <= 0) return;
    onSelect(product, variant);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            {product?.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image_url}
                alt={product?.name ?? ''}
                className="h-8 w-8 rounded object-cover shrink-0"
              />
            ) : (
              <Package className="h-8 w-8 text-muted-foreground/40 shrink-0" />
            )}
            <span className="truncate">{product?.name}</span>
          </DialogTitle>
        </DialogHeader>

        {activeVariants.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No hay variantes disponibles
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2">
            {activeVariants.map((variant) => {
              const outOfStock = variant.stock_quantity <= 0;
              const lowStock =
                !outOfStock && variant.stock_quantity <= variant.min_stock_level;

              return (
                <button
                  key={variant.id}
                  onClick={() => handleSelect(variant)}
                  disabled={outOfStock}
                  className={`
                    flex flex-col items-center justify-center gap-1 rounded-lg border p-3
                    min-h-[64px] min-w-[44px] text-sm font-medium transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                    ${
                      outOfStock
                        ? 'opacity-40 cursor-not-allowed bg-muted border-muted'
                        : 'hover:bg-accent hover:border-primary cursor-pointer bg-card'
                    }
                  `}
                >
                  <span className="leading-tight text-center">
                    {variant.variant_name}
                  </span>

                  {outOfStock ? (
                    <Badge variant="destructive" className="text-xs">
                      Sin stock
                    </Badge>
                  ) : lowStock ? (
                    <Badge
                      variant="outline"
                      className="text-xs border-orange-400 text-orange-600"
                    >
                      Stock: {variant.stock_quantity}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-xs border-green-500 text-green-600"
                    >
                      Stock: {variant.stock_quantity}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
