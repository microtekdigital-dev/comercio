"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { 
  CashMovement, 
  CashMovementFormData,
  CashMovementFilters,
  CashMovementsSummary
} from "@/lib/types/erp"

/**
 * Get all cash movements for a company with optional filters
 */
export async function getCashMovements(
  filters?: CashMovementFilters
): Promise<CashMovement[]> {
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
      .from("cash_movements")
      .select("*")
      .eq("company_id", profile.company_id)

    // Apply filters
    if (filters?.dateFrom) {
      query = query.gte("created_at", filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte("created_at", filters.dateTo)
    }

    if (filters?.movementType && filters.movementType !== 'all') {
      query = query.eq("movement_type", filters.movementType)
    }

    if (filters?.openingId) {
      query = query.eq("opening_id", filters.openingId)
    }

    query = query.order("created_at", { ascending: false })

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching cash movements:", error)
    return []
  }
}

/**
 * Get single cash movement by ID
 */
export async function getCashMovement(id: string): Promise<CashMovement | null> {
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
      .from("cash_movements")
      .select("*")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching cash movement:", error)
    return null
  }
}

/**
 * Create a new cash movement
 */
export async function createCashMovement(
  formData: CashMovementFormData
): Promise<{ data?: CashMovement; error?: string }> {
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

    // Validate amount
    if (formData.amount <= 0) {
      return { error: "El monto debe ser mayor a cero" }
    }

    // Validate description
    if (!formData.description || formData.description.trim() === '') {
      return { error: "La descripción es requerida" }
    }

    // Validate movement type
    if (formData.movement_type !== 'income' && formData.movement_type !== 'withdrawal') {
      return { error: "Tipo de movimiento inválido" }
    }

    // Find active opening (opening without closure)
    const { data: allOpenings } = await supabase
      .from("cash_register_openings")
      .select("id")
      .eq("company_id", profile.company_id)
      .order("opening_date", { ascending: false })

    const { data: allClosures } = await supabase
      .from("cash_register_closures")
      .select("opening_id")
      .eq("company_id", profile.company_id)

    // Find openings without closures (active openings)
    const closedOpeningIds = new Set((allClosures || []).map(c => c.opening_id).filter(Boolean))
    const activeOpening = (allOpenings || []).find(op => !closedOpeningIds.has(op.id))

    if (!activeOpening) {
      return { error: "No hay una apertura de caja activa. Debe abrir la caja antes de registrar movimientos" }
    }

    // Create movement
    const { data: movement, error: movementError } = await supabase
      .from("cash_movements")
      .insert({
        company_id: profile.company_id,
        opening_id: activeOpening.id,
        movement_type: formData.movement_type,
        amount: formData.amount,
        description: formData.description.trim(),
        created_by: user.id,
        created_by_name: profile.full_name || profile.email,
      })
      .select()
      .single()

    if (movementError) throw movementError

    revalidatePath("/dashboard/cash-register")
    revalidatePath("/dashboard") // Refresh financial stats on main dashboard
    return { data: movement }
  } catch (error: any) {
    console.error("Error creating cash movement:", error)
    return { error: error.message || "Error al crear el movimiento de caja" }
  }
}

/**
 * Delete a cash movement
 */
export async function deleteCashMovement(id: string): Promise<{ success?: boolean; error?: string }> {
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
      .from("cash_movements")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) throw error

    revalidatePath("/dashboard/cash-register")
    revalidatePath("/dashboard") // Refresh financial stats on main dashboard
    return { success: true }
  } catch (error) {
    console.error("Error deleting cash movement:", error)
    return { error: "Error al eliminar el movimiento de caja" }
  }
}

/**
 * Get movements for a specific opening
 */
export async function getCashMovementsByOpening(
  openingId: string
): Promise<CashMovement[]> {
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

    const { data, error } = await supabase
      .from("cash_movements")
      .select("*")
      .eq("company_id", profile.company_id)
      .eq("opening_id", openingId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching cash movements by opening:", error)
    return []
  }
}

/**
 * Get movements summary for an opening
 */
export async function getCashMovementsSummary(
  openingId: string
): Promise<CashMovementsSummary> {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { totalIncome: 0, totalWithdrawals: 0, netMovement: 0 }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (!profile?.company_id) return { totalIncome: 0, totalWithdrawals: 0, netMovement: 0 }

    const { data: movements, error } = await supabase
      .from("cash_movements")
      .select("movement_type, amount")
      .eq("company_id", profile.company_id)
      .eq("opening_id", openingId)

    if (error) throw error

    let totalIncome = 0
    let totalWithdrawals = 0

    if (movements) {
      for (const movement of movements) {
        if (movement.movement_type === 'income') {
          totalIncome += Number(movement.amount)
        } else if (movement.movement_type === 'withdrawal') {
          totalWithdrawals += Number(movement.amount)
        }
      }
    }

    const netMovement = totalIncome - totalWithdrawals

    return {
      totalIncome,
      totalWithdrawals,
      netMovement
    }
  } catch (error) {
    console.error("Error calculating cash movements summary:", error)
    return { totalIncome: 0, totalWithdrawals: 0, netMovement: 0 }
  }
}
