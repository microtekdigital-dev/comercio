"use client"

import { useState, useEffect, memo, useRef, useCallback } from "react"
import { Plus, Trash2, Save, AlertCircle, Loader2 } from "lucide-react"
import { VARIANT_TYPES, type VariantType, type ProductVariantFormData, type VariantTemplate } from "@/lib/types/erp"
import { getVariantTemplates, createVariantTemplate } from "@/lib/actions/variant-templates"
import { toast } from "sonner"

interface VariantStockTableProps {
  variants: ProductVariantFormData[]
  onChange: (variants: ProductVariantFormData[]) => void
  variantType: VariantType
  readOnly?: boolean
  currencySymbol?: string
  currencyPosition?: "before" | "after"
}

const f = "border border-[#808080] bg-white text-black text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full disabled:bg-[#e0e0e0]"

export const VariantStockTable = memo(function VariantStockTable({
  variants,
  onChange,
  variantType,
  readOnly = false,
}: VariantStockTableProps) {
  const [localVariants, setLocalVariants] = useState<ProductVariantFormData[]>(variants)
  const [errors, setErrors] = useState<string[]>([])
  const previousVariantTypeRef = useRef<VariantType | null>(null)
  const [templates, setTemplates] = useState<VariantTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [savingTemplate, setSavingTemplate] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (variantType === "custom") loadTemplates()
  }, [variantType])

  useEffect(() => {
    if (variants.length > 0 && localVariants.length === 0) setLocalVariants(variants)
  }, [variants])

  const loadTemplates = async () => {
    const data = await getVariantTemplates()
    setTemplates(data)
  }

  useEffect(() => {
    if (previousVariantTypeRef.current === variantType) return
    const previousType = previousVariantTypeRef.current
    previousVariantTypeRef.current = variantType

    if (variantType === "none") { setLocalVariants([]); onChange([]); return }

    if (variantType === "shirts" || variantType === "pants") {
      const shouldRegenerate = (previousType !== null && previousType !== variantType) || variants.length === 0
      if (shouldRegenerate) {
        const newVariants = VARIANT_TYPES[variantType].sizes.map((size, i) => ({
          variant_name: size, sku: "", stock_quantity: 0, min_stock_level: 0, sort_order: i,
        }))
        setLocalVariants(newVariants); onChange(newVariants)
      }
      return
    }

    if (variantType === "custom") {
      if (previousType === "shirts" || previousType === "pants") {
        setLocalVariants([]); onChange([]); setSelectedTemplateId("")
      } else if (previousType === null && variants.length === 0) {
        setLocalVariants([]); onChange([]); setSelectedTemplateId("")
      }
    }
  }, [variantType, onChange])

  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId)
    if (templateId === "new") { setLocalVariants([]); onChange([]); return }
    const template = templates.find(t => t.id === templateId)
    if (template) {
      const newVariants = template.sizes.map((size, i) => ({
        variant_name: size, sku: "", stock_quantity: 0, min_stock_level: 0, sort_order: i,
      }))
      setLocalVariants(newVariants); onChange(newVariants)
    }
  }, [templates, onChange])

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) { toast.error("El nombre es requerido"); return }
    if (localVariants.length === 0) { toast.error("Necesitás al menos una variante"); return }
    setSavingTemplate(true)
    const sizes = localVariants.map(v => v.variant_name).filter(n => n.trim())
    const result = await createVariantTemplate(newTemplateName, sizes)
    if (result.error) { toast.error(result.error) }
    else { toast.success("Plantilla guardada"); setShowSaveDialog(false); setNewTemplateName(""); await loadTemplates() }
    setSavingTemplate(false)
  }

  useEffect(() => {
    const errs: string[] = []
    const names = localVariants.map(v => v.variant_name.toLowerCase().trim())
    if (names.filter((n, i) => names.indexOf(n) !== i).length > 0) errs.push("Hay nombres de variantes duplicados")
    if (localVariants.some(v => v.stock_quantity < 0 || v.min_stock_level < 0)) errs.push("El stock no puede ser negativo")
    if (localVariants.some(v => !v.variant_name.trim())) errs.push("Todas las variantes deben tener un nombre")
    setErrors(errs)
  }, [localVariants])

  const handleVariantChange = useCallback((index: number, field: keyof ProductVariantFormData, value: string | number) => {
    setLocalVariants(prev => {
      const updated = prev.map((v, i) => i === index ? { ...v, [field]: value } : v)
      onChange(updated)
      return updated
    })
  }, [onChange])

  const handleAddVariant = useCallback(() => {
    setLocalVariants(prev => {
      const updated = [...prev, { variant_name: "", sku: "", stock_quantity: 0, min_stock_level: 0, sort_order: prev.length }]
      onChange(updated)
      return updated
    })
  }, [onChange])

  const handleRemoveVariant = useCallback((index: number) => {
    setLocalVariants(prev => {
      const updated = prev.filter((_, i) => i !== index).map((v, i) => ({ ...v, sort_order: i }))
      onChange(updated)
      return updated
    })
  }, [onChange])

  const totalStock = localVariants.reduce((s, v) => s + (v.stock_quantity || 0), 0)
  const isPredefined = variantType === "shirts" || variantType === "pants"

  if (variantType === "none") return null

  return (
    <>
      {/* Save template dialog */}
      {showSaveDialog && (
        <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-80 border-2 border-[#808080] shadow-[4px_4px_0px_#000]">
            <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
              <span className="text-white text-sm font-bold">💾 Guardar Plantilla</span>
              <button onClick={() => { setShowSaveDialog(false); setNewTemplateName("") }}
                className="text-white hover:bg-[#cc0000] px-2 py-0.5 text-xs font-bold border border-[#6060a0]">✕</button>
            </div>
            <div className="bg-[#d4d0c8] p-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-black block mb-0.5">Nombre de la Plantilla</label>
                <input
                  value={newTemplateName}
                  onChange={e => setNewTemplateName(e.target.value)}
                  placeholder="Ej: Ropa Estándar, Calzado..."
                  className={f + " text-sm py-1"}
                  autoFocus
                />
              </div>
              <div>
                <div className="text-xs font-bold text-black mb-0.5">Tallas a guardar:</div>
                <div className="text-xs text-gray-600 bg-white border border-[#808080] px-2 py-1">
                  {localVariants.map(v => v.variant_name).join(", ")}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1 border-t border-[#808080]">
                <button onClick={() => { setShowSaveDialog(false); setNewTemplateName("") }} disabled={savingTemplate}
                  className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={handleSaveTemplate} disabled={savingTemplate}
                  className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
                  {savingTemplate ? <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</> : "✔ Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {/* Template selector for custom */}
        {variantType === "custom" && !readOnly && (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs font-bold text-black block mb-0.5">Plantilla</label>
              <select value={selectedTemplateId} onChange={e => handleTemplateSelect(e.target.value)}
                className={f + " text-sm py-1"}>
                <option value="new">Nueva configuración</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.template_name} ({t.sizes.length} tallas)</option>
                ))}
              </select>
            </div>
            {localVariants.length > 0 && (
              <button type="button" onClick={() => setShowSaveDialog(true)}
                title="Guardar como plantilla"
                className="border border-[#808080] bg-[#d4d0c8] px-2 py-1 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 mt-4">
                <Save className="h-3 w-3" /> Guardar
              </button>
            )}
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="border-2 border-[#cc0000] bg-[#fff0f0] p-2 flex items-start gap-2">
            <AlertCircle className="h-3 w-3 text-red-700 mt-0.5 shrink-0" />
            <ul className="text-xs text-red-700 space-y-0.5">
              {errors.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          </div>
        )}

        {/* Table */}
        <div className="border-2 border-[#808080] overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#d4d0c8] border-b-2 border-[#808080]">
                <th className="px-2 py-1 font-bold text-left border-r border-[#808080]">
                  {isPredefined ? "Talla" : "Nombre de Variante"}
                </th>
                <th className="px-2 py-1 font-bold text-left border-r border-[#808080]">SKU</th>
                <th className="px-2 py-1 font-bold text-right border-r border-[#808080]">Stock</th>
                <th className={`px-2 py-1 font-bold text-right ${!isPredefined && !readOnly ? "border-r border-[#808080]" : ""}`}>Stock Mín.</th>
                {!isPredefined && !readOnly && <th className="px-2 py-1 w-8"></th>}
              </tr>
            </thead>
            <tbody>
              {localVariants.length === 0 ? (
                <tr>
                  <td colSpan={isPredefined ? 4 : 5} className="text-center py-6 text-gray-500">
                    Sin variantes — agregá una abajo
                  </td>
                </tr>
              ) : localVariants.map((v, idx) => (
                <tr key={idx} className={`border-b border-[#e0e0e0] ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
                  <td className="px-1 py-1 border-r border-[#e0e0e0]">
                    {isPredefined
                      ? <span className="font-bold px-1">{v.variant_name}</span>
                      : <input value={v.variant_name}
                          onChange={e => handleVariantChange(idx, "variant_name", e.target.value)}
                          placeholder="Ej: Mediano, Grande..."
                          disabled={readOnly} className={f} />}
                  </td>
                  <td className="px-1 py-1 border-r border-[#e0e0e0]">
                    <input value={v.sku || ""} onChange={e => handleVariantChange(idx, "sku", e.target.value)}
                      placeholder="SKU" disabled={readOnly} className={f} />
                  </td>
                  <td className="px-1 py-1 border-r border-[#e0e0e0]">
                    <input type="number" min="0" value={v.stock_quantity}
                      onChange={e => handleVariantChange(idx, "stock_quantity", parseInt(e.target.value) || 0)}
                      disabled={readOnly} className={f + " text-right font-mono"} />
                  </td>
                  <td className={`px-1 py-1 ${!isPredefined && !readOnly ? "border-r border-[#e0e0e0]" : ""}`}>
                    <input type="number" min="0" value={v.min_stock_level}
                      onChange={e => handleVariantChange(idx, "min_stock_level", parseInt(e.target.value) || 0)}
                      disabled={readOnly} className={f + " text-right font-mono"} />
                  </td>
                  {!isPredefined && !readOnly && (
                    <td className="px-1 py-1 text-center">
                      <button type="button" onClick={() => handleRemoveVariant(idx)}
                        className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add variant button */}
        {!isPredefined && !readOnly && (
          <button type="button" onClick={handleAddVariant}
            className="w-full border border-[#808080] bg-[#d4d0c8] py-1.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center justify-center gap-1">
            <Plus className="h-3 w-3" /> Agregar Variante
          </button>
        )}

        {/* Total */}
        <div className="flex items-center justify-between border-t-2 border-[#808080] pt-2">
          <span className="text-xs font-bold">Stock Total:</span>
          <span className="text-base font-bold font-mono">{totalStock} unidades</span>
        </div>
      </div>
    </>
  )
})
