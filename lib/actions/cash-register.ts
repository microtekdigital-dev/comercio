"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { CashRegisterClosure, CashRegisterClosureFormData } from "@/lib/types/erp"

// Get all cash register closures for a company
export async function getCashRegisterClosures(filters?: {
  dateFrom?: string;
  dateTo?: string;
  shift?: string;
}): Promise<CashRegisterClosure[]> {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (!profile?.company_id) return []

    let query = supabase
      .from("cash_register_closures")
      .select("*")
      .eq("company_id", profile.company_id)

    // Apply filters
    if (filters?.dateFrom) {
      query = query.gte("closure_date", filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte("closure_date", filters.dateTo)
    }

    if (filters?.shift) {
      query = query.eq("shift", filters.shift)
    }

    query = query.order("closure_date", { ascending: false })

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching cash register closures:", error)
    return []
  }
}

// Get single cash register closure
export async function getCashRegisterClosure(id: string): Promise<CashRegisterClosure | null> {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (!profile?.company_id) return null

    const { data, error } = await supabase
      .from("cash_register_closures")
      .select("*")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching cash register closure:", error)
    return null
  }
}

// Create cash register closure
export async function createCashRegisterClosure(formData: CashRegisterClosureFormData) {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "No autenticado" }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, full_name, email")
      .eq("id", user.id)
      .single()

    if (!profile?.company_id) {
      return { error: "No se encontró la empresa" }
    }

    // Get sales for the specified date
    const closureDate = new Date(formData.closure_date)
    const startOfDay = new Date(closureDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(closureDate)
    endOfDay.setHours(23, 59, 59, 999)

    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("total, payment_method, payments:sale_payments(amount, payment_method)")
      .eq("company_id", profile.company_id)
      .eq("status", "completed")
      .gte("sale_date", startOfDay.toISOString())
      .lte("sale_date", endOfDay.toISOString())

    if (salesError) throw salesError

    // Calculate totals
    let totalSalesCount = 0
    let totalSalesAmount = 0
    let cashSales = 0
    let cardSales = 0
    let transferSales = 0
    let otherSales = 0

    if (sales) {
      totalSalesCount = sales.length
      
      for (const sale of sales) {
        totalSalesAmount += Number(sale.total)
        
        // Si la venta tiene pagos registrados, usar esos
        if (sale.payments && sale.payments.length > 0) {
          for (const payment of sale.payments) {
            const amount = Number(payment.amount)
            const method = payment.payment_method?.toLowerCase() || ""
            
            if (method.includes("efectivo") || method.includes("cash")) {
              cashSales += amount
            } else if (method.includes("tarjeta") || method.includes("card") || method.includes("débito") || method.includes("crédito")) {
              cardSales += amount
            } else if (method.includes("transferencia") || method.includes("transfer")) {
              transferSales += amount
            } else {
              otherSales += amount
            }
          }
        } else {
          // Si no hay pagos registrados, usar el payment_method de la venta
          const amount = Number(sale.total)
          const method = sale.payment_method?.toLowerCase() || ""
          
          if (method.includes("efectivo") || method.includes("cash")) {
            cashSales += amount
          } else if (method.includes("tarjeta") || method.includes("card") || method.includes("débito") || method.includes("crédito")) {
            cardSales += amount
          } else if (method.includes("transferencia") || method.includes("transfer")) {
            transferSales += amount
          } else {
            otherSales += amount
          }
        }
      }
    }

    // Calculate cash difference if cash_counted is provided
    let cashDifference = null
    if (formData.cash_counted !== undefined && formData.cash_counted !== null) {
      cashDifference = formData.cash_counted - cashSales
    }

    // Create closure
    const { data: closure, error: closureError } = await supabase
      .from("cash_register_closures")
      .insert({
        company_id: profile.company_id,
        closure_date: formData.closure_date,
        shift: formData.shift || null,
        closed_by: user.id,
        closed_by_name: profile.full_name || profile.email,
        total_sales_count: totalSalesCount,
        total_sales_amount: totalSalesAmount,
        cash_sales: cashSales,
        card_sales: cardSales,
        transfer_sales: transferSales,
        other_sales: otherSales,
        cash_counted: formData.cash_counted || null,
        cash_difference: cashDifference,
        notes: formData.notes || null,
        currency: "ARS",
      })
      .select()
      .single()

    if (closureError) throw closureError

    revalidatePath("/dashboard/cash-register")
    return { data: closure }
  } catch (error: any) {
    console.error("Error creating cash register closure:", error)
    return { error: error.message || "Error al crear el cierre de caja" }
  }
}

// Delete cash register closure
export async function deleteCashRegisterClosure(id: string) {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "No autenticado" }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (!profile?.company_id) {
      return { error: "No se encontró la empresa" }
    }

    const { error } = await supabase
      .from("cash_register_closures")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) throw error

    revalidatePath("/dashboard/cash-register")
    return { success: true }
  } catch (error) {
    console.error("Error deleting cash register closure:", error)
    return { error: "Error al eliminar el cierre de caja" }
  }
}
