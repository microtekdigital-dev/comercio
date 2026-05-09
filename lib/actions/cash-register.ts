"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { 
  CashRegisterClosure, 
  CashRegisterClosureFormData,
  CashRegisterOpening,
  CashRegisterOpeningFormData,
  SupplierPayment,
  Sale,
  CashMovement
} from "@/lib/types/erp"
import { logAuditEvent } from "@/lib/actions/audit-log"

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

    void logAuditEvent({
      module: "caja",
      action: "abrir",
      entityType: "cash_register_opening",
      entityId: opening.id,
      metadata: { initial_amount: formData.initial_cash_amount, shift: formData.shift },
    });

    revalidatePath("/dashboard/cash-register")
    revalidatePath("/dashboard") // Refresh financial stats on main dashboard
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
    revalidatePath("/dashboard") // Refresh financial stats on main dashboard
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

    // Find the active opening (one without a closure) — ignore shift filter
    // The shift selected in the closure form is just a label, not used to match the opening
    let opening: CashRegisterOpening | null = null
    
    {
      const [allOpenings, allClosures] = await Promise.all([
        getCashRegisterOpenings(),
        getCashRegisterClosures()
      ])
      
      const closedIds = new Set(allClosures.map(c => c.opening_id).filter(Boolean))
      
      // Get the most recent opening that has no closure
      const activeOpenings = allOpenings
        .filter(op => !closedIds.has(op.id))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      opening = activeOpenings[0] || null
    }

    // Get sales for the specified date
    // Build UTC range directly from YYYY-MM-DD treating it as Argentina local (UTC-3)
    const [cYear, cMonth, cDay] = formData.closure_date.split('-').map(Number)
    const startUTC = new Date(Date.UTC(cYear, cMonth - 1, cDay, 3, 0, 0, 0))
    const endUTC = new Date(Date.UTC(cYear, cMonth - 1, cDay + 1, 2, 59, 59, 999))
    // Keep startOfDay/endOfDay for supplier payments date filter (uses date string)
    const startOfDay = new Date(Date.UTC(cYear, cMonth - 1, cDay, 0, 0, 0, 0))
    const endOfDay = new Date(Date.UTC(cYear, cMonth - 1, cDay, 23, 59, 59, 999))

    // Get existing closures for this date — used only for reference, not for filtering sales
    const { data: existingClosures } = await supabase
      .from("cash_register_closures")
      .select("created_at")
      .eq("company_id", profile.company_id)
      .gte("closure_date", startOfDay.toISOString())
      .lte("closure_date", endOfDay.toISOString())
      .order("created_at", { ascending: false })
      .limit(1)

    // Query ALL sales for the day using UTC-adjusted range
    // We use sale_date (when the sale happened) not created_at to avoid timezone issues
    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("total, payment_method, created_at, discount_amount, payments:sale_payments(amount, payment_method)")
      .eq("company_id", profile.company_id)
      .eq("status", "completed")
      .gte("sale_date", startUTC.toISOString())
      .lte("sale_date", endUTC.toISOString())

    if (salesError) throw salesError

    // Get supplier payments for the specified date
    const { data: supplierPayments, error: paymentsError } = await supabase
      .from("supplier_payments")
      .select("amount, payment_method, created_at")
      .eq("company_id", profile.company_id)
      .gte("payment_date", formData.closure_date)
      .lte("payment_date", formData.closure_date)

    if (paymentsError) throw paymentsError

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

    // Calculate supplier payments in cash
    let supplierPaymentsCash = 0
    let supplierPaymentsCard = 0
    let supplierPaymentsTransfer = 0
    let supplierPaymentsOther = 0
    let supplierPaymentsTotal = 0
    
    if (supplierPayments) {
      for (const payment of supplierPayments) {
        const amount = Number(payment.amount)
        const method = payment.payment_method?.toLowerCase() || ""
        
        supplierPaymentsTotal += amount
        
        if (method.includes("efectivo") || method.includes("cash")) {
          supplierPaymentsCash += amount
        } else if (method.includes("tarjeta") || method.includes("card") || method.includes("débito") || method.includes("crédito")) {
          supplierPaymentsCard += amount
        } else if (method.includes("transferencia") || method.includes("transfer")) {
          supplierPaymentsTransfer += amount
        } else {
          supplierPaymentsOther += amount
        }
      }
    }

    // Calculate cash difference if cash_counted is provided
    let cashDifference = null
    let warningMessage = null
    
    if (formData.cash_counted !== undefined && formData.cash_counted !== null) {
      // Efectivo esperado = Ventas en efectivo + Monto inicial de apertura - Pagos a proveedores en efectivo
      const expectedCash = cashSales + (opening?.initial_cash_amount || 0) - supplierPaymentsCash
      cashDifference = formData.cash_counted - expectedCash
      
      if (!opening && formData.shift) {
        warningMessage = "No se encontró apertura para esta fecha y turno. El cálculo de diferencia no incluye el monto inicial."
      }
    }

    // Calculate total discounts from sales in this period
    let totalDiscounts = 0;
    if (sales) {
      for (const sale of sales as Array<{ discount_amount?: number }>) {
        totalDiscounts += Number(sale.discount_amount ?? 0);
      }
    }

    // Get returns (cash/transfer refunds) for this period
    const { data: returns } = await supabase
      .from("sale_returns")
      .select("total_amount, refund_method, created_at")
      .eq("company_id", profile.company_id)
      .eq("status", "completed")
      .in("refund_method", ["cash", "transfer"])
      .gte("return_date", startUTC.toISOString())
      .lte("return_date", endUTC.toISOString())

    let totalReturnsCash = 0
    let totalReturnsTransfer = 0
    if (returns) {
      for (const ret of returns) {
        if (ret.refund_method === "cash") totalReturnsCash += Number(ret.total_amount)
        else if (ret.refund_method === "transfer") totalReturnsTransfer += Number(ret.total_amount)
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
        supplier_payments_total: supplierPaymentsTotal,
        supplier_payments_cash: supplierPaymentsCash,
        supplier_payments_card: supplierPaymentsCard,
        supplier_payments_transfer: supplierPaymentsTransfer,
        supplier_payments_other: supplierPaymentsOther,
        total_returns_cash: totalReturnsCash,
        total_returns_transfer: totalReturnsTransfer,
        cash_counted: formData.cash_counted || null,
        cash_difference: cashDifference,
        notes: formData.notes || null,
        currency: "ARS",
        opening_id: opening?.id || null,
        total_discounts: totalDiscounts,
      })
      .select()
      .single()

    if (closureError) throw closureError

    void logAuditEvent({
      module: "caja",
      action: "cerrar",
      entityType: "cash_register_closure",
      entityId: closure.id,
      metadata: { total_sales: totalSalesAmount, total_cash: cashSales, shift: formData.shift || null },
    });

    revalidatePath("/dashboard/cash-register")
    revalidatePath("/dashboard") // Refresh financial stats on main dashboard
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
    revalidatePath("/dashboard") // Refresh financial stats on main dashboard
    return { success: true }
  } catch (error) {
    console.error("Error deleting cash register closure:", error)
    return { error: "Error al eliminar el cierre de caja" }
  }
}

// Get supplier payments in cash for a date range
export async function getSupplierPaymentsCash(dateFrom: string, dateTo: string): Promise<number> {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (!profile?.company_id) return 0

    const { data: payments, error } = await supabase
      .from("supplier_payments")
      .select("amount, payment_method")
      .eq("company_id", profile.company_id)
      .gte("payment_date", dateFrom)
      .lte("payment_date", dateTo)

    if (error) throw error

    let cashPayments = 0
    if (payments) {
      for (const payment of payments) {
        const method = payment.payment_method?.toLowerCase() || ""
        if (method.includes("efectivo") || method.includes("cash")) {
          cashPayments += Number(payment.amount)
        }
      }
    }

    return cashPayments
  } catch (error) {
    console.error("Error fetching supplier payments:", error)
    return 0
  }
}

// Get supplier payments with details for filtering
export async function getSupplierPayments(dateFrom: string, dateTo: string): Promise<SupplierPayment[]> {
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

    const { data: payments, error } = await supabase
      .from("supplier_payments")
      .select("*")
      .eq("company_id", profile.company_id)
      .gte("payment_date", dateFrom)
      .lte("payment_date", dateTo)
      .order("created_at", { ascending: false })

    if (error) throw error
    return payments || []
  } catch (error) {
    console.error("Error fetching supplier payments:", error)
    return []
  }
}



// =====================================================
// Cash Register Report Actions
// =====================================================

// Get sales for a closure period
export async function getSalesForClosure(
  companyId: string,
  closureDate: string,
  lastClosureTime?: string | null
): Promise<Sale[]> {
  const supabase = await createClient()
  
  try {
    const [year, month, day] = closureDate.split('T')[0].split('-').map(Number)
    const startUTC = new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0))
    const endUTC = new Date(Date.UTC(year, month - 1, day + 1, 2, 59, 59, 999))

    const { data, error } = await supabase
      .from("sales")
      .select(`
        *,
        customer:customers(*),
        payments:sale_payments(*)
      `)
      .eq("company_id", companyId)
      .eq("status", "completed")
      .gte("sale_date", startUTC.toISOString())
      .lte("sale_date", endUTC.toISOString())
      .order("sale_date", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching sales for closure:", error)
    return []
  }
}

// Get cash movements for an opening
export async function getCashMovementsForOpening(
  openingId: string
): Promise<CashMovement[]> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from("cash_movements")
      .select("*")
      .eq("opening_id", openingId)
      .order("created_at", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching cash movements:", error)
    return []
  }
}

// Get supplier payments for closure date (all payment methods)
export async function getSupplierPaymentsForClosure(
  companyId: string,
  closureDate: string,
  lastClosureTime?: string | null
): Promise<SupplierPayment[]> {
  const supabase = await createClient()
  
  try {
    const date = new Date(closureDate)
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    let query = supabase
      .from("supplier_payments")
      .select(`
        *,
        supplier:suppliers(name)
      `)
      .eq("company_id", companyId)
      .gte("payment_date", closureDate.split('T')[0])
      .lte("payment_date", closureDate.split('T')[0])

    // Only get payments created after the last closure
    if (lastClosureTime) {
      query = query.gt("created_at", lastClosureTime)
    }

    const { data, error } = await query

    if (error) throw error
    
    // Return all payments (not just cash)
    return data || []
  } catch (error) {
    console.error("Error fetching supplier payments for closure:", error)
    return []
  }
}

// Get complete closure report data
export async function getClosureReportData(closureId: string) {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: "No autenticado" }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (!profile?.company_id) {
      return { error: "No se encontró la empresa" }
    }

    // Fetch closure
    const closure = await getCashRegisterClosure(closureId)
    if (!closure) {
      return { error: "Cierre no encontrado" }
    }

    // Fetch opening if linked
    let opening: CashRegisterOpening | null = null
    if (closure.opening_id) {
      opening = await getCashRegisterOpening(closure.opening_id)
    }

    // Get existing closures for this date to find the last closure timestamp
    const closureDate = new Date(closure.closure_date)
    const startOfDay = new Date(closureDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(closureDate)
    endOfDay.setHours(23, 59, 59, 999)

    const { data: existingClosures } = await supabase
      .from("cash_register_closures")
      .select("created_at")
      .eq("company_id", profile.company_id)
      .gte("closure_date", startOfDay.toISOString())
      .lte("closure_date", endOfDay.toISOString())
      .lt("created_at", closure.created_at)
      .order("created_at", { ascending: false })
      .limit(1)

    const lastClosureTime = existingClosures && existingClosures.length > 0 
      ? existingClosures[0].created_at 
      : null

    // Fetch all related data in parallel
    const [sales, cashMovements, supplierPayments, companySettings] = await Promise.all([
      getSalesForClosure(profile.company_id, closure.closure_date, lastClosureTime),
      opening ? getCashMovementsForOpening(opening.id) : Promise.resolve([]),
      getSupplierPaymentsForClosure(profile.company_id, closure.closure_date, lastClosureTime),
      supabase
        .from("company_settings")
        .select("*")
        .eq("company_id", profile.company_id)
        .single()
    ])

    // Get company info
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", profile.company_id)
      .single()

    const companyInfo = {
      name: company?.name || "Mi Empresa",
      address: companySettings.data?.address || undefined,
      phone: companySettings.data?.phone || undefined,
      email: companySettings.data?.email || undefined,
      taxId: companySettings.data?.tax_id || undefined,
      logoUrl: companySettings.data?.logo_url || undefined,
    }

    return {
      closure,
      opening,
      sales,
      cashMovements,
      supplierPayments,
      companyInfo,
    }
  } catch (error: any) {
    console.error("Error fetching closure report data:", error)
    return { error: error.message || "Error al obtener datos del reporte" }
  }
}

// =====================================================
// Preview cierre de caja (server action)
// Usa exactamente la misma lógica que createCashRegisterClosure
// =====================================================

export async function previewCashRegisterClosure(closureDate: string): Promise<{
  totalSalesCount: number
  totalSalesAmount: number
  cashSales: number
  cardSales: number
  transferSales: number
  otherSales: number
  supplierPaymentsTotal: number
  supplierPaymentsCash: number
  supplierPaymentsCount: number
  opening: { id: string; initial_cash_amount: number; opened_by_name: string; shift: string } | null
  error?: string
}> {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "No autenticado", totalSalesCount: 0, totalSalesAmount: 0, cashSales: 0, cardSales: 0, transferSales: 0, otherSales: 0, supplierPaymentsTotal: 0, supplierPaymentsCash: 0, supplierPaymentsCount: 0, opening: null }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (!profile?.company_id) return { error: "Empresa no encontrada", totalSalesCount: 0, totalSalesAmount: 0, cashSales: 0, cardSales: 0, transferSales: 0, otherSales: 0, supplierPaymentsTotal: 0, supplierPaymentsCash: 0, supplierPaymentsCount: 0, opening: null }

    // Date range — build directly in UTC to avoid timezone issues with setHours
    // closureDate is "YYYY-MM-DD", treat it as Argentina local date (UTC-3)
    // So "2026-05-08" local = "2026-05-08T03:00:00Z" start, "2026-05-09T02:59:59Z" end
    const [year, month, day] = closureDate.split('-').map(Number)
    // Argentina is UTC-3, so local midnight = UTC+3h
    const startUTC = new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0))
    const endUTC = new Date(Date.UTC(year, month - 1, day + 1, 2, 59, 59, 999))

    console.log("[previewCashRegisterClosure] closureDate:", closureDate)
    console.log("[previewCashRegisterClosure] startUTC:", startUTC.toISOString())
    console.log("[previewCashRegisterClosure] endUTC:", endUTC.toISOString())
    console.log("[previewCashRegisterClosure] company_id:", profile.company_id)
    console.log("[previewCashRegisterClosure] user_id:", user.id)

    // Get ALL sales for the day
    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("total, payment_method, payments:sale_payments(amount, payment_method)")
      .eq("company_id", profile.company_id)
      .eq("status", "completed")
      .gte("sale_date", startUTC.toISOString())
      .lte("sale_date", endUTC.toISOString())

    console.log("[previewCashRegisterClosure] salesError:", salesError)
    console.log("[previewCashRegisterClosure] sales count:", sales?.length ?? 0)

    // Get supplier payments
    const { data: supplierPayments } = await supabase
      .from("supplier_payments")
      .select("amount, payment_method")
      .eq("company_id", profile.company_id)
      .gte("payment_date", closureDate)
      .lte("payment_date", closureDate)

    // Find active opening
    const { data: allOpenings } = await supabase
      .from("cash_register_openings")
      .select("id, shift, initial_cash_amount, opened_by_name, created_at")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })

    const { data: allClosures } = await supabase
      .from("cash_register_closures")
      .select("opening_id")
      .eq("company_id", profile.company_id)

    const closedIds = new Set((allClosures ?? []).map((c: any) => c.opening_id).filter(Boolean))
    const activeOpening = (allOpenings ?? []).find((o: any) => !closedIds.has(o.id)) ?? null

    // Calculate totals
    let totalSalesCount = 0, totalSalesAmount = 0
    let cashSales = 0, cardSales = 0, transferSales = 0, otherSales = 0

    for (const sale of sales ?? []) {
      totalSalesCount++
      totalSalesAmount += Number(sale.total)
      const payments = (sale as any).payments ?? []
      if (payments.length > 0) {
        for (const p of payments) {
          const amt = Number(p.amount)
          const m = (p.payment_method ?? "").toLowerCase()
          if (m.includes("efectivo")) cashSales += amt
          else if (m.includes("tarjeta") || m.includes("débito") || m.includes("crédito")) cardSales += amt
          else if (m.includes("transferencia")) transferSales += amt
          else otherSales += amt
        }
      } else {
        const m = ((sale as any).payment_method ?? "").toLowerCase()
        const amt = Number(sale.total)
        if (m.includes("efectivo")) cashSales += amt
        else if (m.includes("tarjeta") || m.includes("débito") || m.includes("crédito")) cardSales += amt
        else if (m.includes("transferencia")) transferSales += amt
        else otherSales += amt
      }
    }

    let supplierPaymentsTotal = 0, supplierPaymentsCash = 0
    for (const p of supplierPayments ?? []) {
      supplierPaymentsTotal += Number(p.amount)
      if ((p.payment_method ?? "").toLowerCase().includes("efectivo")) supplierPaymentsCash += Number(p.amount)
    }

    return {
      totalSalesCount,
      totalSalesAmount,
      cashSales,
      cardSales,
      transferSales,
      otherSales,
      supplierPaymentsTotal,
      supplierPaymentsCash,
      supplierPaymentsCount: (supplierPayments ?? []).length,
      opening: activeOpening ? {
        id: activeOpening.id,
        initial_cash_amount: activeOpening.initial_cash_amount,
        opened_by_name: activeOpening.opened_by_name,
        shift: activeOpening.shift,
      } : null,
    }
  } catch (error: any) {
    console.error("Error in previewCashRegisterClosure:", error)
    return { error: error.message, totalSalesCount: 0, totalSalesAmount: 0, cashSales: 0, cardSales: 0, transferSales: 0, otherSales: 0, supplierPaymentsTotal: 0, supplierPaymentsCash: 0, supplierPaymentsCount: 0, opening: null }
  }
}
