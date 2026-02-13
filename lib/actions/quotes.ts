"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Quote, QuoteFormData } from "@/lib/types/erp"

export async function getQuotes() {
  const supabase = await createClient()
  
  const { data: quotes, error } = await supabase
    .from("quotes")
    .select(`
      *,
      customer:customers(id, name, email),
      items:quote_items(*)
    `)
    .order("created_at", { ascending: false })

  if (error) throw error
  return quotes as Quote[]
}

export async function getQuote(id: string) {
  const supabase = await createClient()
  
  const { data: quote, error } = await supabase
    .from("quotes")
    .select(`
      *,
      customer:customers(*),
      items:quote_items(*)
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return quote as Quote
}

export async function createQuote(formData: QuoteFormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single()

  if (!profile?.company_id) throw new Error("Sin empresa")

  const { items, ...quoteData } = formData
  
  const subtotal = items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unit_price
    const discount = itemSubtotal * (item.discount_percent / 100)
    return sum + (itemSubtotal - discount)
  }, 0)

  const tax_amount = items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unit_price
    const discount = itemSubtotal * (item.discount_percent / 100)
    const taxableAmount = itemSubtotal - discount
    return sum + (taxableAmount * (item.tax_rate / 100))
  }, 0)

  const total = subtotal + tax_amount

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .insert({
      ...quoteData,
      company_id: profile.company_id,
      created_by: user.id,
      subtotal,
      tax_amount,
      discount_amount: 0,
      total,
      currency: "ARS",
    })
    .select()
    .single()

  if (quoteError) throw quoteError

  const quoteItems = items.map((item) => {
    const itemSubtotal = item.quantity * item.unit_price
    const discount = itemSubtotal * (item.discount_percent / 100)
    const subtotal = itemSubtotal - discount
    const tax = subtotal * (item.tax_rate / 100)
    
    return {
      quote_id: quote.id,
      ...item,
      variant_id: item.variant_id || null,
      variant_name: item.variant_name || null,
      subtotal,
      tax_amount: tax,
      total: subtotal + tax,
    }
  })

  const { error: itemsError } = await supabase
    .from("quote_items")
    .insert(quoteItems)

  if (itemsError) throw itemsError

  revalidatePath("/dashboard/quotes")
  return quote
}

export async function updateQuote(id: string, formData: QuoteFormData) {
  const supabase = await createClient()
  
  const { items, ...quoteData } = formData
  
  const subtotal = items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unit_price
    const discount = itemSubtotal * (item.discount_percent / 100)
    return sum + (itemSubtotal - discount)
  }, 0)

  const tax_amount = items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unit_price
    const discount = itemSubtotal * (item.discount_percent / 100)
    const taxableAmount = itemSubtotal - discount
    return sum + (taxableAmount * (item.tax_rate / 100))
  }, 0)

  const total = subtotal + tax_amount

  const { error: quoteError } = await supabase
    .from("quotes")
    .update({
      ...quoteData,
      subtotal,
      tax_amount,
      total,
    })
    .eq("id", id)

  if (quoteError) throw quoteError

  await supabase.from("quote_items").delete().eq("quote_id", id)

  const quoteItems = items.map((item) => {
    const itemSubtotal = item.quantity * item.unit_price
    const discount = itemSubtotal * (item.discount_percent / 100)
    const subtotal = itemSubtotal - discount
    const tax = subtotal * (item.tax_rate / 100)
    
    return {
      quote_id: id,
      ...item,
      variant_id: item.variant_id || null,
      variant_name: item.variant_name || null,
      subtotal,
      tax_amount: tax,
      total: subtotal + tax,
    }
  })

  const { error: itemsError } = await supabase
    .from("quote_items")
    .insert(quoteItems)

  if (itemsError) throw itemsError

  revalidatePath("/dashboard/quotes")
  revalidatePath(`/dashboard/quotes/${id}`)
}

export async function deleteQuote(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("quotes")
    .delete()
    .eq("id", id)

  if (error) throw error

  revalidatePath("/dashboard/quotes")
}

export async function sendQuoteByEmail(id: string, email: string, subject: string, message: string) {
  const supabase = await createClient()
  
  // Obtener datos del presupuesto
  const { data: quote } = await supabase
    .from("quotes")
    .select(`
      *,
      customer:customers(*),
      items:quote_items(*)
    `)
    .eq("id", id)
    .single()

  if (!quote) throw new Error("Presupuesto no encontrado")

  // Obtener información de la empresa
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const { data: profile } = await supabase
    .from("profiles")
    .select("company:companies(name)")
    .eq("id", user.id)
    .single()

  const companyName = (profile?.company as any)?.name || "Mi Empresa"

  // Enviar email usando Resend
  const { sendQuoteEmail } = await import("@/lib/email/resend")
  
  const emailResult = await sendQuoteEmail(email, subject, message, {
    quoteNumber: quote.quote_number,
    companyName,
    customerName: quote.customer?.name || "Cliente",
    quoteDate: new Date(quote.quote_date).toLocaleDateString("es-AR"),
    validUntil: new Date(quote.valid_until).toLocaleDateString("es-AR"),
    total: new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: quote.currency,
    }).format(quote.total),
    currency: quote.currency,
    items: quote.items.map((item: any) => ({
      product_name: item.product_name,
      variant_name: item.variant_name || null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
    })),
  })

  if (!emailResult.success) {
    throw new Error(emailResult.error || "Error al enviar email")
  }

  // Actualizar estado y datos de envío
  const { error } = await supabase
    .from("quotes")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      sent_to_email: email,
    })
    .eq("id", id)

  if (error) throw error
  
  revalidatePath("/dashboard/quotes")
  revalidatePath(`/dashboard/quotes/${id}`)
}

export async function convertQuoteToSale(id: string) {
  const supabase = await createClient()
  
  const { data: quote } = await supabase
    .from("quotes")
    .select("*, items:quote_items(*)")
    .eq("id", id)
    .single()

  if (!quote) throw new Error("Presupuesto no encontrado")

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // Validar stock de variantes antes de convertir
  for (const item of quote.items) {
    if (item.variant_id) {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock")
        .eq("id", item.variant_id)
        .single()

      if (!variant) {
        throw new Error(`Variante no encontrada para ${item.product_name}`)
      }

      if (variant.stock < item.quantity) {
        throw new Error(
          `Stock insuficiente para ${item.product_name} - ${item.variant_name}. ` +
          `Disponible: ${variant.stock}, Requerido: ${item.quantity}`
        )
      }
    } else {
      // Validar stock de producto simple
      const { data: product } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .single()

      if (!product) {
        throw new Error(`Producto no encontrado: ${item.product_name}`)
      }

      if (product.stock < item.quantity) {
        throw new Error(
          `Stock insuficiente para ${item.product_name}. ` +
          `Disponible: ${product.stock}, Requerido: ${item.quantity}`
        )
      }
    }
  }

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      company_id: quote.company_id,
      customer_id: quote.customer_id,
      status: "draft",
      sale_date: new Date().toISOString(),
      subtotal: quote.subtotal,
      tax_amount: quote.tax_amount,
      discount_amount: quote.discount_amount,
      total: quote.total,
      currency: quote.currency,
      payment_status: "pending",
      notes: `Convertido desde presupuesto ${quote.quote_number}`,
      created_by: user.id,
    })
    .select()
    .single()

  if (saleError) throw saleError

  const saleItems = quote.items.map((item: any) => ({
    sale_id: sale.id,
    product_id: item.product_id,
    product_name: item.product_name,
    product_sku: item.product_sku,
    quantity: item.quantity,
    unit_price: item.unit_price,
    tax_rate: item.tax_rate,
    discount_percent: item.discount_percent,
    subtotal: item.subtotal,
    tax_amount: item.tax_amount,
    total: item.total,
    variant_id: item.variant_id || null,
    variant_name: item.variant_name || null,
  }))

  const { error: itemsError } = await supabase
    .from("sale_items")
    .insert(saleItems)

  if (itemsError) throw itemsError

  await supabase
    .from("quotes")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      converted_to_sale_id: sale.id,
    })
    .eq("id", id)

  revalidatePath("/dashboard/quotes")
  revalidatePath(`/dashboard/quotes/${id}`)
  revalidatePath("/dashboard/sales")
  
  return sale.id
}
