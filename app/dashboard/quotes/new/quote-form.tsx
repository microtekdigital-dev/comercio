"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createQuote } from "@/lib/actions/quotes"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Customer, Product, QuoteItemFormData } from "@/lib/types/erp"
import { VariantSelectorForQuotes } from "@/components/dashboard/variant-selector-for-quotes"

export default function QuoteForm({ customers, products: initialProducts }: { customers: Customer[], products: Product[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [customerId, setCustomerId] = useState("")
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split("T")[0])
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  )
  const [notes, setNotes] = useState("")
  const [terms, setTerms] = useState("Presupuesto válido por 30 días. Precios sujetos a cambios sin previo aviso.")
  const [items, setItems] = useState<QuoteItemFormData[]>([
    { product_name: "", quantity: 1, unit_price: 0, tax_rate: 21, discount_percent: 0 },
  ])

  const addItem = () => {
    setItems([...items, { product_name: "", quantity: 1, unit_price: 0, tax_rate: 21, discount_percent: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof QuoteItemFormData, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const selectProduct = async (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product) {
      const newItems = [...items]
      newItems[index] = {
        ...newItems[index],
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku || "",
        unit_price: product.price,
        tax_rate: product.tax_rate,
        variant_id: undefined,
        variant_name: undefined,
      }
      setItems(newItems)
    }
  }

  const handleVariantSelect = (index: number, variantId: string | undefined, variantName: string | undefined, price?: number) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      variant_id: variantId,
      variant_name: variantName,
      unit_price: price !== undefined ? price : newItems[index].unit_price,
    }
    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const subtotal = item.quantity * item.unit_price
      const discount = subtotal * (item.discount_percent / 100)
      const taxable = subtotal - discount
      const tax = taxable * (item.tax_rate / 100)
      return sum + taxable + tax
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
    } catch (error) {
      toast.error("Error al crear presupuesto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Cliente</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fecha</Label>
            <Input type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} />
          </div>
          <div>
            <Label>Válido hasta</Label>
            <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h3 className="font-semibold">Productos</h3>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Agregar
          </Button>
        </div>
        {items.map((item, index) => (
          <div key={index} className="space-y-2 p-4 border rounded-lg">
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4">
                <Label>Producto</Label>
                <Select value={item.product_id} onValueChange={(v) => selectProduct(index, v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Cantidad</Label>
                <Input type="number" value={item.quantity} onChange={(e) => updateItem(index, "quantity", Number(e.target.value))} />
              </div>
              <div className="col-span-2">
                <Label>Precio</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={item.unit_price} 
                  onChange={(e) => updateItem(index, "unit_price", Number(e.target.value))} 
                />
              </div>
              <div className="col-span-2">
                <Label>IVA %</Label>
                <Input type="number" value={item.tax_rate} onChange={(e) => updateItem(index, "tax_rate", Number(e.target.value))} />
              </div>
              <div className="col-span-1">
                <Label>Desc %</Label>
                <Input type="number" value={item.discount_percent} onChange={(e) => updateItem(index, "discount_percent", Number(e.target.value))} />
              </div>
              <div className="col-span-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Show variant selector if product has variants */}
            {item.product_id && (() => {
              const product = products.find((p) => p.id === item.product_id)
              if (!product?.has_variants) return null
              
              return (
                <div className="mt-2">
                  <VariantSelectorForQuotes
                    productId={product.id}
                    selectedVariantId={item.variant_id}
                    onVariantChange={(variantId, variantName, price) => {
                      handleVariantSelect(index, variantId, variantName, price)
                    }}
                  />
                </div>
              )
            })()}
          </div>
        ))}
      </Card>

      <Card className="p-6 space-y-4">
        <div>
          <Label>Notas</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div>
          <Label>Términos y Condiciones</Label>
          <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} />
        </div>
      </Card>

      <div className="flex justify-between items-center">
        <div className="text-2xl font-bold">
          Total: ${calculateTotal().toLocaleString()}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Crear Presupuesto"}
          </Button>
        </div>
      </div>
    </form>
  )
}
