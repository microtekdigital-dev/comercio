"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ProductVariant } from "@/lib/types/erp";

interface VariantSelectorInSaleProps {
  productId: string;
  variants: ProductVariant[];
  onSelect: (variant: ProductVariant) => void;
  selectedVariantId?: string;
}

export function VariantSelectorInSale({
  productId,
  variants,
  onSelect,
  selectedVariantId,
}: VariantSelectorInSaleProps) {
  // Filtrar solo variantes con stock disponible
  const availableVariants = variants.filter(
    (v) => v.is_active && v.stock_quantity > 0
  );

  const handleVariantChange = (variantId: string) => {
    const variant = variants.find((v) => v.id === variantId);
    if (variant) {
      onSelect(variant);
    }
  };

  if (availableVariants.length === 0) {
    return (
      <div className="space-y-2">
        <Label>Variante</Label>
        <div className="p-3 border rounded-md bg-muted/50">
          <p className="text-sm text-muted-foreground">
            No hay variantes disponibles con stock
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`variant-${productId}`}>
        Talle <span className="text-destructive">*</span>
      </Label>
      <Select
        value={selectedVariantId}
        onValueChange={handleVariantChange}
      >
        <SelectTrigger id={`variant-${productId}`}>
          <SelectValue placeholder="Seleccionar talle" />
        </SelectTrigger>
        <SelectContent>
          {availableVariants.map((variant) => (
            <SelectItem key={variant.id} value={variant.id}>
              {variant.variant_name} (Stock: {variant.stock_quantity})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedVariantId && (
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline" className="font-medium">
            {variants.find((v) => v.id === selectedVariantId)?.variant_name}
          </Badge>
          <span className="text-muted-foreground">
            Stock: {variants.find((v) => v.id === selectedVariantId)?.stock_quantity || 0} unidades
          </span>
        </div>
      )}
    </div>
  );
}
