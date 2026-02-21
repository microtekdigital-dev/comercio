'use server'

import { createClient } from '@/lib/supabase/server'
import type { Technician, CreateTechnicianInput, UpdateTechnicianInput, TechnicianStats } from '@/lib/types/erp'

/**
 * Get all technicians for a company
 * @param companyId - Company ID
 * @param activeOnly - If true, return only active technicians
 * @returns Array of technicians
 */
export async function getTechnicians(
  companyId: string,
  activeOnly: boolean = true
): Promise<Technician[]> {
  const supabase = await createClient()

  let query = supabase
    .from('technicians')
    .select(`
      *,
      repair_orders!repair_orders_technician_id_fkey (
        id,
        status
      )
    `)
    .eq('company_id', companyId)
    .order('name', { ascending: true })

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching technicians:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    throw new Error(`Error al obtener técnicos: ${error.message || 'Unknown error'}`)
  }

  // Count active repairs for each technician
  const techniciansWithCount = (data || []).map(tech => {
    const repairOrders = (tech as any).repair_orders || []
    const activeRepairsCount = repairOrders.filter((ro: any) => 
      ro.status !== 'delivered' && ro.status !== 'cancelled'
    ).length

    // Remove repair_orders from the returned object and add the count
    const { repair_orders, ...techData } = tech as any
    return {
      ...techData,
      active_repairs_count: activeRepairsCount
    }
  })

  return techniciansWithCount
}

/**
 * Get a single technician by ID
 * @param id - Technician ID
 * @returns Technician or null if not found
 */
export async function getTechnicianById(id: string): Promise<Technician | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching technician:', error)
    throw new Error('Error al obtener técnico')
  }

  return data
}

/**
 * Create a new technician
 * @param companyId - Company ID
 * @param input - Technician data
 * @returns Created technician
 */
export async function createTechnician(
  companyId: string,
  input: CreateTechnicianInput
): Promise<Technician> {
  const supabase = await createClient()

  // Validate name is not empty
  if (!input.name || input.name.trim().length === 0) {
    throw new Error('El nombre del técnico es requerido')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  const { data, error } = await supabase
    .from('technicians')
    .insert({
      company_id: companyId,
      name: input.name.trim(),
      specialty: input.specialty?.trim() || null,
      is_active: true,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating technician:', error)
    throw new Error('Error al crear técnico')
  }

  return data
}

/**
 * Update a technician
 * @param id - Technician ID
 * @param input - Updated technician data
 * @returns Updated technician
 */
export async function updateTechnician(
  id: string,
  input: UpdateTechnicianInput
): Promise<Technician> {
  const supabase = await createClient()

  // Validate name if provided
  if (input.name !== undefined && input.name.trim().length === 0) {
    throw new Error('El nombre del técnico no puede estar vacío')
  }

  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  if (input.name !== undefined) {
    updateData.name = input.name.trim()
  }
  if (input.specialty !== undefined) {
    updateData.specialty = input.specialty?.trim() || null
  }
  if (input.is_active !== undefined) {
    updateData.is_active = input.is_active
  }

  const { data, error } = await supabase
    .from('technicians')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating technician:', error)
    throw new Error('Error al actualizar técnico')
  }

  return data
}

/**
 * Delete a technician (soft delete by marking as inactive)
 * @param id - Technician ID
 */
export async function deleteTechnician(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('technicians')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error deleting technician:', error)
    throw new Error('Error al eliminar técnico')
  }
}

/**
 * Get statistics for a technician
 * @param technicianId - Technician ID
 * @returns Technician statistics
 */
export async function getTechnicianStats(technicianId: string): Promise<TechnicianStats> {
  const supabase = await createClient()

  // Get technician name
  const { data: technician, error: techError } = await supabase
    .from('technicians')
    .select('name')
    .eq('id', technicianId)
    .single()

  if (techError) {
    console.error('Error fetching technician:', techError)
    throw new Error('Error al obtener técnico')
  }

  // Get active repairs count (not delivered or cancelled)
  const { count: activeCount, error: activeError } = await supabase
    .from('repair_orders')
    .select('*', { count: 'exact', head: true })
    .eq('technician_id', technicianId)
    .not('status', 'in', '("delivered","cancelled")')

  if (activeError) {
    console.error('Error counting active repairs:', activeError)
    throw new Error('Error al contar reparaciones activas')
  }

  // Get completed repairs count
  const { count: completedCount, error: completedError } = await supabase
    .from('repair_orders')
    .select('*', { count: 'exact', head: true })
    .eq('technician_id', technicianId)
    .eq('status', 'delivered')

  if (completedError) {
    console.error('Error counting completed repairs:', completedError)
    throw new Error('Error al contar reparaciones completadas')
  }

  // Get completed repairs with dates for average time calculation
  const { data: completedRepairs, error: repairsError } = await supabase
    .from('repair_orders')
    .select('received_date, delivered_date')
    .eq('technician_id', technicianId)
    .eq('status', 'delivered')
    .not('delivered_date', 'is', null)

  if (repairsError) {
    console.error('Error fetching completed repairs:', repairsError)
    throw new Error('Error al obtener reparaciones completadas')
  }

  // Calculate average repair time in days
  let averageRepairTime = 0
  if (completedRepairs && completedRepairs.length > 0) {
    const totalDays = completedRepairs.reduce((sum, repair) => {
      const received = new Date(repair.received_date)
      const delivered = new Date(repair.delivered_date!)
      const days = Math.ceil((delivered.getTime() - received.getTime()) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0)
    averageRepairTime = totalDays / completedRepairs.length
  }

  // Get total revenue from completed repairs
  const { data: revenueData, error: revenueError } = await supabase
    .from('repair_orders')
    .select(`
      id,
      labor_cost,
      repair_items (
        subtotal
      )
    `)
    .eq('technician_id', technicianId)
    .eq('status', 'delivered')

  if (revenueError) {
    console.error('Error fetching revenue data:', revenueError)
    throw new Error('Error al obtener datos de ingresos')
  }

  let totalRevenue = 0
  if (revenueData) {
    totalRevenue = revenueData.reduce((sum, order) => {
      const laborCost = order.labor_cost || 0
      const itemsTotal = (order.repair_items as any[])?.reduce((itemSum, item) => itemSum + (item.subtotal || 0), 0) || 0
      return sum + laborCost + itemsTotal
    }, 0)
  }

  return {
    technician_id: technicianId,
    technician_name: technician.name,
    active_repairs: activeCount || 0,
    completed_repairs: completedCount || 0,
    average_repair_time: Math.round(averageRepairTime * 10) / 10, // Round to 1 decimal
    total_revenue: totalRevenue
  }
}
