"use client";

import { useState } from "react";
import type { CatalogoProduct, CatalogoVariant } from "@/lib/types/catalogo";
import { VarianteSelectorCatalogo } from "./variante-selector";
import { ShoppingCart, Package } from "lucide-react";

interface Props {
  product: CatalogoProduct;
  canAddToCart: boolean;
  onAddToCart: (variant: CatalogoVariant | null) => void;
}

export function ProductoCard({ product, canAddToCart, onAddToCart }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<CatalogoVariant | null>(
    product.has_variants ? null : null
  );

  const effectiveStock = product.has_variants
    ? (selectedVariant?.stock_quantity ?? 0)
    : product.stock_quantity;

  const effectivePrice = product.has_variants
    ? (selectedVariant?.price ?? product.price)
    : product.price;

  const sinStock = effectiveStock === 0;
  const needsVariantSelection = product.has_variants && !selectedVariant;

  function handleAdd() {
    if (sinStock || needsVariantSelection) return;
    onAddToCart(product.has_variants ? selectedVariant : null);
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
      {/* Imagen */}
      <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
            <Package className="h-16 w-16" />
          </div>
        )}
        {sinStock && !needsVariantSelection && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-700 text-sm font-semibold px-3 py-1 rounded-full">
              Sin stock
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight line-clamp-2">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{product.description}</p>
        )}

        <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-auto">
          ${effectivePrice.toLocaleString("es-AR")}
        </p>

        {/* Selector de variantes */}
        {product.has_variants && (
          <VarianteSelectorCatalogo
            variants={product.variants}
            selected={selectedVariant}
            onSelect={setSelectedVariant}
          />
        )}

        {/* Botón agregar */}
        {canAddToCart && (
          <button
            onClick={handleAdd}
            disabled={sinStock || needsVariantSelection}
            className="mt-2 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            {needsVariantSelection
              ? "Seleccioná una variante"
              : sinStock
              ? "Sin stock"
              : "Agregar al carrito"}
          </button>
        )}
      </div>
    </div>
  );
}
