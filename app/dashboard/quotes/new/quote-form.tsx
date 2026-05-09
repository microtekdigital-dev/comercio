"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createQuote } from "@/lib/actions/quotes"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Customer, Product, QuoteItemFormData } from "@/lib/types/erp"
import { getProductVariants } from "@/lib/actions/product-variants"
import type { ProductVariant } from "@/lib/types/erp"

// ─── Section fuera del componente para evitar remount en cada render ───────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] p-3 space-y-3">
      <div className="bg-[#c0c0c0] border-b border-[#808080] -mx-3 -mt-3 px-3 py-1 mb-3">
        <span className="text-xs font-bold">{title}</span>
      </div>
      {children}
    </div>
  )
}

const f = "border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]"
const fFull = f + " w-full"
const l = "text-xs font-bold text-black block mb-0.5"

export default function QuoteForm({
  customers,
  products,
}: {
  customers: Customer[]
  products: Product[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [customerId, setCustomerId] = useState("")
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split("T")[0])
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  )
  const [notes, setNotes] = useState("")
  const [terms, setTerms] = useState(
    "Presupuesto válido por 30 días. Precios sujetos a cambios sin previo aviso."
  )
  const [items, setItems] = useState<QuoteItemFormData[]>([
    { product_name: "", quantity: 1, unit_price: 0, tax_rate: 21, discount_percent: 0 },
  ])
  const [variants, setVariants] = useState<Record<string, ProductVariant[]>>({})

  // Load variants when a product with has_variants is selected
  useEffect(() => {
    items.forEach((item) => {
      if (item.product_id && !variants[item.product_id]) {
        const prod = products.find((p) => p.id === item.product_id)
        if (prod?.has_variants) {
          getProductVariants(item.product_id).then((v) =>
            setVariants((prev) => ({ ...prev, [item.product_id!]: v }))
          )
        }
      }
    })
  }, [items, products])

  // ─── Stable handlers ──────────────────────────────────────────────────────────
  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value)
  }, [])

  const handleTermsChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTerms(e.target.value)
  }, [])

  const handleCustomerChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCustomerId(e.target.value)
  }, [])

  const handleQuoteDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuoteDate(e.target.value)
  }, [])

  const handleValidUntilChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValidUntil(e.target.value)
  }, [])

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { product_name: "", quantity: 1, unit_price: 0, tax_rate: 21, discount_percent: 0 },
    ])
  }, [])

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateItem = useCallback(
    (index: number, field: keyof QuoteItemFormData, value: any) => {
      setItems((prev) =>
        prev.map((item, i) => {
          if (i !== index) return item
          const updated = { ...item, [field]: value }
          if (field === "product_id" && value) {
            const prod = products.find((p) => p.id === value)
            if (prod) {
              updated.product_name = prod.name
              updated.product_sku = prod.sku || ""
              updated.unit_price = prod.price
              updated.tax_rate = prod.tax_rate
              updated.variant_id = undefined
              updated.variant_name = undefined
            }
          }
          return updated
        })
      )
    },
    [products]
  )

  const handleVariantSelect = useCallback(
    (index: number, variantId: string, variantName: string, price?: number) => {
      setItems((prev) =>
        prev.map((item, i) => {
          if (i !== index) return item
          return {
            ...item,
            variant_id: variantId,
            variant_name: variantName,
            unit_price: price !== undefined ? price : item.unit_price,
          }
        })
      )
    },
    []
  )

  const calcItemTotal = (item: QuoteItemFormData) => {
    const sub = item.quantity * item.unit_price
    const disc = sub * (item.discount_percent / 100)
    const taxable = sub - disc
    return taxable + taxable * (item.tax_rate / 100)
  }

  const totals = items.reduce(
    (acc, item) => {
      const sub = item.quantity * item.unit_price * (1 - item.discount_percent / 100)
      const tax = sub * (item.tax_rate / 100)
      return { subtotal: acc.subtotal + sub, tax: acc.tax + tax, total: acc.total + sub + tax }
    },
    { subtotal: 0, tax: 0, total: 0 }
  )

  const fmt = (n: number) =>
    n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) { toast.error("Agregá al menos un producto"); return }
    setLoading(true)
    try {
      await createQuote({
        customer_id: customerId || undefined,
        status: "draft",
        quote_date: quoteDate,
        valid_until: validUntil,
        notes,
        terms,
        items,
      })
      toast.success("Presupuesto creado")
      router.push("/dashboard/quotes")
    } catch {
      toast.error("Error al crear presupuesto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* ── Información General ── */}
      <Section title="Información General">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className={l}>Cliente</label>
            <select value={customerId} onChange={handleCustomerChange} className={fFull}>
              <option value="">Sin cliente / Consumidor Final</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={l}>Fecha</label>
            <input type="date" value={quoteDate} onChange={handleQuoteDateChange} className={fFull} />
          </div>
          <div>
            <label className={l}>Válido hasta</label>
            <input type="date" value={validUntil} onChange={handleValidUntilChange} className={fFull} />
          </div>
        </div>
      </Section>

      {/* ── Productos ── */}
      <Section title="Productos">
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={addItem}
            className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Agregar Producto
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-500">
            Sin productos — hacé click en "Agregar Producto"
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => {
              const prod = products.find((p) => p.id === item.product_id)
              const vars = item.product_id ? (variants[item.product_id] || []).filter((v) => v.is_active) : []

              return (
                <div key={idx} className="border border-[#808080] bg-[#f5f5f5] p-2 space-y-2">
                  {/* Row 1: producto, cant, precio, iva, desc, eliminar */}
                  <div className="grid grid-cols-12 gap-1 items-end">
                    <div className="col-span-4">
                      <label className={l}>Producto</label>
                      <select
                        value={item.product_id || ""}
                        onChange={(e) => updateItem(idx, "product_id", e.target.value)}
                        className={fFull}
                      >
                        <option value="">Manual</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      {!item.product_id && (
                        <input
                          placeholder="Nombre del producto"
                          value={item.product_name}
                          onChange={(e) => updateItem(idx, "product_name", e.target.value)}
                          className={fFull + " mt-1"}
                        />
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className={l}>Cantidad</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                        className={fFull}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={l}>Precio</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)}
                        className={fFull}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className={l}>IVA%</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.tax_rate}
                        onChange={(e) => updateItem(idx, "tax_rate", parseFloat(e.target.value) || 0)}
                        className={fFull}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className={l}>Desc%</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount_percent}
                        onChange={(e) => updateItem(idx, "discount_percent", parseFloat(e.target.value) || 0)}
                        className={fFull}
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      <label className={l}>Total</label>
                      <div className="text-xs font-mono font-bold py-0.5">${fmt(calcItemTotal(item))}</div>
                    </div>
                    <div className="col-span-1 flex items-end justify-center pb-0.5">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Variantes */}
                  {prod?.has_variants && vars.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={l}>Variante</label>
                        <select
                          value={item.variant_id || ""}
                          onChange={(e) => {
                            const v = vars.find((v) => v.id === e.target.value)
                            if (v) handleVariantSelect(idx, v.id, v.variant_name, v.price || undefined)
                          }}
                          className={fFull}
                        >
                          <option value="">Seleccionar variante...</option>
                          {vars.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.variant_name}{v.price ? ` - $${v.price.toFixed(2)}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      {item.variant_id && (() => {
                        const v = vars.find((v) => v.id === item.variant_id)
                        return v ? (
                          <div className="flex items-end">
                            <span className="text-xs text-gray-600">
                              Stock: {v.stock_quantity} u.
                            </span>
                          </div>
                        ) : null
                      })()}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* ── Totales ── */}
      <Section title="Totales">
        <div className="space-y-1 text-sm max-w-xs ml-auto">
          <div className="flex justify-between text-xs">
            <span>Subtotal:</span>
            <span className="font-mono">${fmt(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>IVA:</span>
            <span className="font-mono">${fmt(totals.tax)}</span>
          </div>
          <div className="flex justify-between font-bold border-t border-[#808080] pt-1">
            <span>Total:</span>
            <span className="font-mono">${fmt(totals.total)}</span>
          </div>
        </div>
      </Section>

      {/* ── Notas y Términos ── */}
      <Section title="Notas y Términos">
        <div>
          <label className={l}>Notas</label>
          <textarea
            value={notes}
            onChange={handleNotesChange}
            rows={2}
            placeholder="Notas adicionales..."
            className={fFull + " resize-none"}
          />
        </div>
        <div>
          <label className={l}>Términos y Condiciones</label>
          <textarea
            value={terms}
            onChange={handleTermsChange}
            rows={3}
            className={fFull + " resize-none"}
          />
        </div>
      </Section>

      {/* ── Botones ── */}
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? (
            <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</>
          ) : (
            "✔ Crear Presupuesto"
          )}
        </button>
      </div>
    </form>
  )
}
