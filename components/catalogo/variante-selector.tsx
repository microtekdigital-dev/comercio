"use client";

import type { CatalogoVariant } from "@/lib/types/catalogo";

interface Props {
  variants: CatalogoVariant[];
  selected: CatalogoVariant | null;
  onSelect: (variant: CatalogoVariant | null) => void;
}

export function VarianteSelectorCatalogo({ variants, selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {variants.map((variant) => {
        const sinStock = variant.stock_quantity === 0;
        const isSelected = selected?.id === variant.id;

        return (
          <button
            key={variant.id}
            onClick={() => onSelect(isSelected ? null : variant)}
            disabled={sinStock}
            title={sinStock ? "Sin stock" : `Stock: ${variant.stock_quantity}`}
            className={[
              "px-2.5 py-1 text-xs rounded-md border font-medium transition-colors",
              sinStock
                ? "border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-gray-800 cursor-not-allowed line-through"
                : isSelected
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400",
            ].join(" ")}
          >
            {variant.variant_name}
          </button>
        );
      })}
    </div>
  );
}
