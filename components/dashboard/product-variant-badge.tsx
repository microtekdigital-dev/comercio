"use client"

import { Badge } from "@/components/ui/badge"
import { Layers } from "lucide-react"

interface ProductVariantBadgeProps {
  hasVariants: boolean
  variantCount?: number
}

export function ProductVariantBadge({ hasVariants, variantCount }: ProductVariantBadgeProps) {
  if (!hasVariants) {
    return null
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <Layers className="h-3 w-3" />
      <span>
        {variantCount !== undefined && variantCount > 0
          ? `${variantCount} variante${variantCount !== 1 ? 's' : ''}`
          : 'Variantes'}
      </span>
    </Badge>
  )
}
