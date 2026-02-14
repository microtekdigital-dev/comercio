"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { 
  CashRegisterClosure, 
  CashRegisterClosureFormData,
  CashRegisterOpening,
  CashRegisterOpeningFormData
} from "@/lib/types/erp"

// =====================================================
// Cash Register Openings (Aperturas de Caja)
// =====================================================

// Get all cash register openings for a company
export async function getCashRegisterOpenings(filters?: {
  dateFrom?: string;
  dateTo?: string;
  shift?: string;
}): Promise<CashRegisterOpening[]> {
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
      .from("cash_register_openings")
      .select("*")
      .eq("company_id", profile.company_id)

    // Apply filters
    if (filters?.dateFrom) {
      query = query.gte("opening_date", filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte("opening_date", filters.dateTo)
    }

    if (filters?.shift) {
      query = query.eq("shift", filters.shift)
    }

    query = query.order("created_at", { ascending: false })

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching cash register openings:", error)
    return []
  }
}

// Get single cash register opening
export async function getCashRegisterOpening(id: string): Promise<CashRegisterOpening | null> {
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
      .from("cash_register_openings")
      .select("*")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching cash register opening:", error)
    return null
  }
}

// Create cash register opening
export async function createCashRegisterOpening(formData: CashRegisterOpeningFormData) {
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

    // Validate initial_cash_amount
    if (formData.initial_cash_amount <= 0) {
      return { error: "El monto inicial debe ser mayor a cero" }
    }

    // Validate shift
    const validShifts = ['Mañana', 'Tarde', 'Noche']
    if (!validShifts.includes(formData.shift)) {
      return { error: "El turno debe ser Mañana, Tarde o Noche" }
    }

    // Create opening
    const { data: opening, error: openingError } = await supabase
      .from("cash_register_openings")
      .insert({
        company_id: profile.company_id,
        opening_date: formData.opening_date,
        shift: formData.shift,
        opened_by: user.id,
        opened_by_name: profile.full_name || profile.email,
        initial_cash_amount: formData.initial_cash_amount,
        notes: formData.notes || null,
      })
      .select()
      .single()

    if (openingError) throw openingError

    revalidatePath("/dashboard/cash-register")
    return { data: opening }
  } catch (error: any) {
    console.error("Error creating cash register opening:", error)
    return { error: error.message || "Error al crear la apertura de caja" }
  }
}

// Delete cash register opening
export async function deleteCashRegisterOpening(id: string) {
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
      .from("cash_register_openings")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) throw error

    revalidatePath("/dashboard/cash-register")
    return { success: true }
  } catch (error) {
    console.error("Error deleting cash register opening:", error)
    return { error: "Error al eliminar la apertura de caja" }
  }
}

// Find opening for a closure
export async function findOpeningForClosure(
  companyId: string,
  closureDate: string,
  shift?: string
): Promise<CashRegisterOpening | null> {
  const supabase = await createClient()
  
  try {
    // Parse the closure date to get the day
    const date = new Date(closureDate)
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    let query = supabase
      .from("cash_register_openings")
      .select("*")
      .eq("company_id", companyId)
      .gte("opening_date", startOfDay.toISOString())
      .lte("opening_date", endOfDay.toISOString())

    // If shift is provided, filter by shift
    if (shift) {
      query = query.eq("shift", shift)
    }

    query = query.order("opening_date", { ascending: false }).limit(1)

    const { data, error } = await query

    if (error) throw error
    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    console.error("Error finding opening for closure:", error)
    return null
  }
}

// =====================================================
// Cash Register Closures (Cierres de Caja)
// =====================================================

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

    // Find corresponding opening
    const opening = await findOpeningForClosure(
      profile.company_id,
      formData.closure_date,
      formData.shift
    )

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
    let warningMessage = null
    
    if (formData.cash_counted !== undefined && formData.cash_counted !== null) {
      if (opening) {
        // Con apertura: Diferencia = Contado - (Esperado + Monto Inicial)
        cashDifference = formData.cash_counted - (cashSales + opening.initial_cash_amount)
      } else {
        // Sin apertura: Diferencia = Contado - Esperado (comportamiento actual)
        cashDifference = formData.cash_counted - cashSales
        warningMessage = "No se encontró apertura para esta fecha y turno. El cálculo de diferencia no incluye el monto inicial."
      }
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
        opening_id: opening?.id || null,
      })
      .select()
      .single()

    if (closureError) throw closureError

    revalidatePath("/dashboard/cash-register")
    return { 
      data: closure,
      warning: warningMessage,
      opening: opening
    }
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
