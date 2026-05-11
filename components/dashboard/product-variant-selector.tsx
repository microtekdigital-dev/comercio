"use client"

import { memo } from "react"
import { Shirt, Ruler, Settings2, Package } from "lucide-react"
import { VARIANT_TYPES, type VariantType } from "@/lib/types/erp"

interface ProductVariantSelectorProps {
  value: VariantType
  onChange: (type: VariantType) => void
  disabled?: boolean
}

const variantOptions = [
  { value: "none" as VariantType,   label: VARIANT_TYPES.none.label,   desc: "Producto simple con un solo stock",                                                                    Icon: Package  },
  { value: "shirts" as VariantType, label: VARIANT_TYPES.shirts.label, desc: `${VARIANT_TYPES.shirts.sizes.length} tallas: ${VARIANT_TYPES.shirts.sizes.join(", ")}`,               Icon: Shirt    },
  { value: "pants" as VariantType,  label: VARIANT_TYPES.pants.label,  desc: `${VARIANT_TYPES.pants.sizes.length} tallas: ${VARIANT_TYPES.pants.sizes.slice(0, 5).join(", ")}...`,  Icon: Ruler    },
  { value: "custom" as VariantType, label: VARIANT_TYPES.custom.label, desc: "Define tus propias tallas o variantes",                                                               Icon: Settings2 },
]

export const ProductVariantSelector = memo(function ProductVariantSelector({
  value,
  onChange,
  disabled = false,
}: ProductVariantSelectorProps) {
  return (
    <div className="space-y-2">
      {variantOptions.map((opt) => {
        const selected = value === opt.value
        return (
          <label
            key={opt.value}
            className={`flex items-start gap-3 p-2 border-2 cursor-pointer transition-none ${
              selected
                ? "border-[#000080] bg-[#e8e8f8]"
                : "border-[#808080] bg-white hover:bg-[#f0f0f0]"
            } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input
              type="radio"
              name="variant-type"
              value={opt.value}
              checked={selected}
              onChange={() => !disabled && onChange(opt.value)}
              className="mt-1 accent-[#000080]"
              disabled={disabled}
            />
            <opt.Icon className={`h-4 w-4 mt-0.5 shrink-0 ${selected ? "text-[#000080]" : "text-gray-500"}`} />
            <div>
              <div className={`text-xs font-bold ${selected ? "text-[#000080]" : "text-black"}`}>{opt.label}</div>
              <div className="text-[10px] text-gray-500">{opt.desc}</div>
            </div>
          </label>
        )
      })}
    </div>
  )
})
