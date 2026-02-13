"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getQuote, updateQuote, deleteQuote, sendQuoteByEmail, convertQuoteToSale } from "@/lib/actions/quotes"
import { getCustomers } from "@/lib/actions/customers"
import { getProducts } from "@/lib/actions/products"
import { getProductVariants } from "@/lib/actions/product-variants"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, User, FileText, Save, Mail, Trash2, ShoppingCart, Plus, Trash } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type { Quote, Customer, Product, QuoteItemFormData } from "@/lib/types/erp"
import { VariantSelectorForQuotes } from "@/components/dashboard/variant-selector-for-quotes"

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteId, setQuoteId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  
  // Edit form state
  const [customerId, setCustomerId] = useState("")
  const [quoteDate, setQuoteDate] = useState("")
  const [validUntil, setValidUntil] = useState("")
  const [notes, setNotes] = useState("")
  const [terms, setTerms] = useState("")
  const [status, setStatus] = useState<string>("")
  const [items, setItems] = useState<QuoteItemFormData[]>([])
  
  // Email dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailTo, setEmailTo] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [sendingEmail, setSendingEmail] = useState(false)
  
  // Data for editing
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productVariants, setProductVariants] = useState<Record<string, any[]>>({})

  useEffect(() => {
    params.then((resolvedParams) => {
      setQuoteId(resolvedParams.id)
      loadQuote(resolvedParams.id)
      loadCustomers()
      loadProducts()
    })
  }, [])

  const loadQuote = async (id: string) => {
    try {
      const data = await getQuote(id)
      setQuote(data)
      setCustomerId(data.customer_id || "")
      setQuoteDate(data.quote_date.split("T")[0])
      setValidUntil(data.valid_until.split("T")[0])
      setNotes(data.notes || "")
      setTerms(data.terms || "")
      setStatus(data.status)
      setItems(data.items?.map(item => ({
        product_id: item.product_id || undefined,
        product_name: item.product_name,
        product_sku: item.product_sku || undefined,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        discount_percent: item.discount_percent,
      })) || [])
      
      // Set email defaults
      setEmailTo(data.customer?.email || "")
      setEmailSubject(`Presupuesto ${data.quote_number} - ${data.customer?.name || ""}`)
      setEmailMessage(`Estimado/a cliente,\n\nAdjunto encontrará el presupuesto ${data.quote_number} solicitado.\n\nEste presupuesto es válido hasta el ${new Date(data.valid_until).toLocaleDateString("es-AR")}.\n\nQuedamos a su disposición para cualquier consulta.\n\nSaludos cordiales.`)
    } catch (error) {
      toast.error("Error al cargar presupuesto")
    }
  }

  const loadCustomers = async () => {
    try {
      const data = await getCustomers()
      setCustomers(data)
    } catch (error) {
      console.error("Error loading customers:", error)
    }
  }

  const loadProducts = async () => {
    try {
      const data = await getProducts()
      setProducts(data)
    } catch (error) {
      console.error("Error loading products:", error)
    }
  }

  const loadProductVariants = async (productId: string) => {
    if (productVariants[productId]) return
    
    try {
      const variants = await getProductVariants(productId)
      setProductVariants(prev => ({ ...prev, [productId]: variants }))
    } catch (error) {
      console.error("Error loading variants:", error)
    }
  }

  const handleSave = async () => {
    if (!quoteId) return
    
    setLoading(true)
    try {
      await updateQuote(quoteId, {
        customer_id: customerId || undefined,
        status: status as any,
        quote_date: quoteDate,
        valid_until: validUntil,
        notes,
        terms,
        items,
      })
      toast.success("Presupuesto actualizado")
      setEditing(false)
      loadQuote(quoteId)
    } catch (error) {
      toast.error("Error al actualizar presupuesto")
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = async () => {
    if (!emailTo || !quoteId) {
      toast.error("Por favor ingresa un email válido")
      return
    }

    setSendingEmail(true)
    try {
      await sendQuoteByEmail(quoteId, emailTo, emailSubject, emailMessage)
      toast.success(`Presupuesto enviado a ${emailTo}`)
      setEmailDialogOpen(false)
      loadQuote(quoteId)
    } catch (error) {
      toast.error("Error al enviar email")
    } finally {
      setSendingEmail(false)
    }
  }

  const handleConvertToSale = async () => {
    if (!quoteId) return
    
    setLoading(true)
    try {
      const saleId = await convertQuoteToSale(quoteId)
      toast.success("Presupuesto convertido a venta")
      router.push(`/dashboard/sales/${saleId}`)
    } catch (error) {
      toast.error("Error al convertir a venta")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!quoteId) return
    
    setLoading(true)
    try {
      await deleteQuote(quoteId)
      toast.success("Presupuesto eliminado")
      router.push("/dashboard/quotes")
    } catch (error) {
      toast.error("Error al eliminar presupuesto")
    } finally {
      setLoading(false)
    }
  }

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

  const updateItemVariant = (
    index: number, 
    variantId: string | undefined, 
    variantName: string | undefined,
    price?: number
  ) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      variant_id: variantId,
      variant_name: variantName,
      unit_price: price !== undefined ? price : newItems[index].unit_price,
    }
    setItems(newItems)
  }

  const selectProduct = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product) {
      // Cargar variantes si el producto las tiene
      if (product.has_variants) {
        loadProductVariants(productId)
      }
      
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

  const productHasVariants = (productId: string | undefined) => {
    if (!productId) return false
    const product = products.find(p => p.id === productId)
    return product?.has_variants || false
  }

  if (!quote) {
    return (
      <div className="flex-1 p-8">
        <p>Cargando...</p>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: quote.currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      sent: "outline",
      accepted: "default",
      rejected: "destructive",
      expired: "destructive",
    }
    
    const labels: Record<string, string> = {
      draft: "Borrador",
      sent: "Enviado",
      accepted: "Aceptado",
      rejected: "Rechazado",
      expired: "Expirado",
    }

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    )
  }

  const isExpired = new Date(quote.valid_until) < new Date()
  const canConvert = quote.status === "accepted" && !quote.converted_to_sale_id

  const handleQuickStatusChange = async (newStatus: string) => {
    if (!quoteId) return
    
    setLoading(true)
    try {
      await updateQuote(quoteId, {
        customer_id: customerId || undefined,
        status: newStatus as any,
        quote_date: quoteDate,
        valid_until: validUntil,
        notes,
        terms,
        items,
      })
      toast.success("Estado actualizado")
      loadQuote(quoteId)
    } catch (error) {
      toast.error("Error al actualizar estado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/quotes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Presupuesto {quote.quote_number}
            </h2>
            <p className="text-muted-foreground">
              {editing ? "Editando presupuesto" : "Detalles del presupuesto"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <>
              <Select value={quote.status} onValueChange={handleQuickStatusChange} disabled={loading}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="accepted">Aceptado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                </SelectContent>
              </Select>

              <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Email
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Enviar Presupuesto por Email</DialogTitle>
                    <DialogDescription>
                      Completa los datos para enviar el presupuesto al cliente
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email del Cliente</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="cliente@ejemplo.com"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Asunto</Label>
                      <Input
                        id="subject"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Mensaje</Label>
                      <Textarea
                        id="message"
                        rows={6}
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEmailDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleSendEmail} disabled={sendingEmail}>
                      {sendingEmail ? "Enviando..." : "Enviar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {canConvert && (
                <Button onClick={handleConvertToSale} disabled={loading}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Convertir a Venta
                </Button>
              )}

              <Button onClick={() => setEditing(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Editar
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" disabled={loading}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará permanentemente el presupuesto.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {editing && (
            <>
              <Button variant="outline" onClick={() => {
                setEditing(false)
                loadQuote(quoteId)
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <Label>Estado</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="sent">Enviado</SelectItem>
                      <SelectItem value="accepted">Aceptado</SelectItem>
                      <SelectItem value="rejected">Rechazado</SelectItem>
                      <SelectItem value="expired">Expirado</SelectItem>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Productos</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="space-y-2">
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
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Selector de variantes */}
                  {item.product_id && productHasVariants(item.product_id) && (
                    <div className="ml-0">
                      <VariantSelectorForQuotes
                        productId={item.product_id}
                        selectedVariantId={item.variant_id}
                        onVariantChange={(variantId, variantName, price) => {
                          updateItemVariant(index, variantId, variantName, price)
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas y Términos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Notas</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div>
                <Label>Términos y Condiciones</Label>
                <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha</p>
                      <p className="font-medium">{formatDate(quote.quote_date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Válido hasta</p>
                      <p className="font-medium">{formatDate(quote.valid_until)}</p>
                    </div>
                  </div>

                  {quote.customer && (
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Cliente</p>
                        <p className="font-medium">{quote.customer.name}</p>
                      </div>
                    </div>
                  )}

                  {quote.sent_at && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Enviado</p>
                        <p className="font-medium">{formatDate(quote.sent_at)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {quote.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Notas</p>
                    <p className="text-sm">{quote.notes}</p>
                  </div>
                )}

                {quote.terms && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Términos y Condiciones</p>
                    <p className="text-sm">{quote.terms}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(quote.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Impuestos:</span>
                  <span className="font-medium">{formatCurrency(quote.tax_amount)}</span>
                </div>
                {quote.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuento:</span>
                    <span className="font-medium text-red-500">
                      -{formatCurrency(quote.discount_amount)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(quote.total)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Items del Presupuesto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quote.items && quote.items.length > 0 ? (
                  <>
                    <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                      <div className="col-span-4">Producto</div>
                      <div className="col-span-2 text-right">Cantidad</div>
                      <div className="col-span-2 text-right">Precio Unit.</div>
                      <div className="col-span-2 text-right">Desc.</div>
                      <div className="col-span-2 text-right">Total</div>
                    </div>
                    {quote.items.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 md:p-0 border md:border-0 rounded-lg md:rounded-none"
                      >
                        <div className="md:col-span-4">
                          <p className="font-medium">{item.product_name}</p>
                          {item.variant_name && (
                            <Badge variant="outline" className="mt-1">
                              {item.variant_name}
                            </Badge>
                          )}
                          {item.product_sku && (
                            <p className="text-xs text-muted-foreground">
                              SKU: {item.product_sku}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-2 md:text-right">
                          <span className="md:hidden text-sm text-muted-foreground">Cantidad: </span>
                          {item.quantity}
                        </div>
                        <div className="md:col-span-2 md:text-right">
                          <span className="md:hidden text-sm text-muted-foreground">Precio: </span>
                          {formatCurrency(item.unit_price)}
                        </div>
                        <div className="md:col-span-2 md:text-right">
                          <span className="md:hidden text-sm text-muted-foreground">Descuento: </span>
                          {item.discount_percent}%
                        </div>
                        <div className="md:col-span-2 md:text-right font-semibold">
                          <span className="md:hidden text-sm text-muted-foreground">Total: </span>
                          {formatCurrency(item.total)}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No hay items en este presupuesto
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
