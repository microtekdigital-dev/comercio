"use client"

import { memo } from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shirt, Ruler, Settings2, Package } from "lucide-react"
import { VARIANT_TYPES, type VariantType } from "@/lib/types/erp"

interface ProductVariantSelectorProps {
  value: VariantType
  onChange: (type: VariantType) => void
  disabled?: boolean
}

export const ProductVariantSelector = memo(function ProductVariantSelector({ 
  value, 
  onChange, 
  disabled = false 
}: ProductVariantSelectorProps) {
  const variantOptions = [
    {
      value: 'none' as VariantType,
      label: VARIANT_TYPES.none.label,
      description: 'Producto simple con un solo stock',
      icon: Package,
    },
    {
      value: 'shirts' as VariantType,
      label: VARIANT_TYPES.shirts.label,
      description: `${VARIANT_TYPES.shirts.sizes.length} tallas: ${VARIANT_TYPES.shirts.sizes.join(', ')}`,
      icon: Shirt,
    },
    {
      value: 'pants' as VariantType,
      label: VARIANT_TYPES.pants.label,
      description: `${VARIANT_TYPES.pants.sizes.length} tallas: ${VARIANT_TYPES.pants.sizes.slice(0, 5).join(', ')}...`,
      icon: Ruler,
    },
    {
      value: 'custom' as VariantType,
      label: VARIANT_TYPES.custom.label,
      description: 'Define tus propias tallas o variantes',
      icon: Settings2,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Variantes</CardTitle>
        <CardDescription>
          Selecciona cómo deseas gestionar el stock de este producto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={value}
          onValueChange={(val) => onChange(val as VariantType)}
          disabled={disabled}
          className="grid gap-4"
        >
          {variantOptions.map((option) => {
            const Icon = option.icon
            return (
              <div key={option.value} className="flex items-start space-x-3">
                <RadioGroupItem
                  value={option.value}
                  id={`variant-${option.value}`}
                  className="mt-1"
                />
                <Label
                  htmlFor={`variant-${option.value}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            )
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  )
})
