'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { POSProductSearchResult } from '@/lib/types/pos';
import type { ProductVariant } from '@/lib/types/erp';

interface VariantSelectorProps {
  product: POSProductSearchResult;
  isOpen: boolean;
  onClose: () => void;
  onVariantSelect: (product: POSProductSearchResult, variant: ProductVariant) => void;
}

export function VariantSelector({
  product,
  isOpen,
  onClose,
  onVariantSelect,
}: VariantSelectorProps) {
  const activeVariants = (product.variants ?? []).filter((v) => v.is_active);

  const handleSelect = (variant: ProductVariant) => {
    if (variant.stock_quantity <= 0) return;
    onVariantSelect(product, variant);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{product.name}</DialogTitle>
        </DialogHeader>

        {activeVariants.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No hay variantes disponibles
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2">
            {activeVariants.map((variant) => {
              const outOfStock = variant.stock_quantity <= 0;
              return (
                <button
                  key={variant.id}
                  onClick={() => handleSelect(variant)}
                  disabled={outOfStock}
                  className={`
                    flex flex-col items-center justify-center gap-1 rounded-lg border p-3
                    min-h-[64px] text-sm font-medium transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                    ${outOfStock
                      ? 'opacity-40 cursor-not-allowed bg-muted border-muted'
                      : 'hover:bg-accent hover:border-primary cursor-pointer bg-card'
                    }
                  `}
                >
                  <span className="leading-tight text-center">{variant.variant_name}</span>
                  <Badge
                    variant={outOfStock ? 'destructive' : 'outline'}
                    className="text-xs"
                  >
                    {outOfStock ? 'Sin stock' : `Stock: ${variant.stock_quantity}`}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
