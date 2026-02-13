"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getProductVariants } from "@/lib/actions/product-variants"
import type { ProductVariant } from "@/lib/types/erp"

interface VariantSelectorForQuotesProps {
  productId: string
  selectedVariantId?: string
  onVariantChange: (variantId: string | undefined, variantName: string | undefined, price: number | undefined) => void
}

export function VariantSelectorForQuotes({
  productId,
  selectedVariantId,
  onVariantChange,
}: VariantSelectorForQuotesProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadVariants = async () => {
      try {
        setLoading(true)
        const data = await getProductVariants(productId)
        setVariants(data)
      } catch (error) {
        console.error("Error loading variants:", error)
      } finally {
        setLoading(false)
      }
    }

    loadVariants()
  }, [productId])

  const handleVariantChange = (variantId: string) => {
    const variant = variants.find((v) => v.id === variantId)
    if (variant) {
      onVariantChange(variant.id, variant.variant_name, variant.price || undefined)
    }
  }

  const handleClear = () => {
    onVariantChange(undefined, undefined, undefined)
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>Variante</Label>
        <div className="p-3 border rounded-md bg-muted/50">
          <p className="text-sm text-muted-foreground">Cargando variantes...</p>
        </div>
      </div>
    )
  }

  const activeVariants = variants.filter((v) => v.is_active)

  if (activeVariants.length === 0) {
    return (
      <div className="space-y-2">
        <Label>Variante</Label>
        <div className="p-3 border rounded-md bg-muted/50">
          <p className="text-sm text-muted-foreground">
            No hay variantes disponibles
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`variant-${productId}`}>
        Variante <span className="text-destructive">*</span>
      </Label>
      <Select
        value={selectedVariantId || ""}
        onValueChange={handleVariantChange}
      >
        <SelectTrigger id={`variant-${productId}`}>
          <SelectValue placeholder="Seleccionar variante" />
        </SelectTrigger>
        <SelectContent>
          {activeVariants.map((variant) => (
            <SelectItem key={variant.id} value={variant.id}>
              <div className="flex items-center justify-between gap-4 w-full">
                <span>{variant.variant_name}</span>
                {variant.price && (
                  <Badge variant="secondary" className="ml-2">
                    ${variant.price.toFixed(2)}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedVariantId && (
        <p className="text-xs text-muted-foreground">
          {(() => {
            const variant = variants.find((v) => v.id === selectedVariantId)
            if (!variant) return null
            return (
              <>
                Stock disponible: {variant.stock_quantity} unidades
                {variant.price && ` - Precio: $${variant.price.toFixed(2)}`}
              </>
            )
          })()}
        </p>
      )}
    </div>
  )
}
