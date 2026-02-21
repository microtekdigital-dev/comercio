'use server'

import { createClient } from '@/lib/supabase/server'
import type { RepairOrder } from '@/lib/types/erp'

export interface DateRange {
  from: string
  to: string
}

export interface TechnicianRepairStats {
  technician_id: string
  technician_name: string
  total_repairs: number
  completed_repairs: number
  in_progress_repairs: number
  cancelled_repairs: number
  average_repair_days: number
  total_revenue: number
}

export interface StatusDistribution {
  status: string
  count: number
  percentage: number
}

export interface RepairProfitability {
  repair_order_id: string
  order_number: number
  customer_name: string
  device_type: string
  parts_cost: number
  labor_cost: number
  total_cost: number
  total_paid: number
  profit: number
  profit_margin: number
}

export interface ReportFilters {
  companyId: string
  dateRange?: DateRange
  technicianId?: string
  status?: string
}

/**
 * Get all pending repairs (not delivered or cancelled)
 * @param companyId - Company ID
 * @returns Array of pending repair orders
 */
export async function getPendingRepairs(companyId: string): Promise<RepairOrder[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('repair_orders')
    .select('*')
    .eq('company_id', companyId)
    .not('status', 'in', '(delivered,cancelled)')
    .order('received_date', { ascending: true })

  if (error) {
    console.error('Error fetching pending repairs:', error)
    throw new Error('Error al obtener reparaciones pendientes')
  }

  return data || []
}

/**
 * Get repair statistics by technician
 * @param companyId - Company ID
 * @param dateRange - Optional date range filter
 * @returns Array of technician statistics
 */
export async function getRepairsByTechnician(
  companyId: string,
  dateRange?: DateRange
): Promise<TechnicianRepairStats[]> {
  const supabase = await createClient()

  // Get ALL repairs with technicians first (no date filter in query)
  const { data: allRepairs, error } = await supabase
    .from('repair_orders')
    .select(`
      id,
      technician_id,
      status,
      received_date,
      delivered_date,
      labor_cost,
      technician:technicians(name)
    `)
    .eq('company_id', companyId)
    .not('technician_id', 'is', null)

  if (error) {
    console.error('Error fetching repairs by technician:', error)
    throw new Error('Error al obtener reparaciones por técnico')
  }

  if (!allRepairs || allRepairs.length === 0) {
    return []
  }

  // Filter by date range in memory if provided
  let repairs = allRepairs
  if (dateRange) {
    const fromDate = new Date(dateRange.from)
    const toDate = new Date(dateRange.to)
    toDate.setHours(23, 59, 59, 999)

    repairs = allRepairs.filter(repair => {
      const repairDate = new Date(repair.received_date)
      return repairDate >= fromDate && repairDate <= toDate
    })
  }

  if (repairs.length === 0) {
    return []
  }

  // Get repair items to calculate revenue
  const repairIds = repairs.map(r => r.id)
  const { data: items } = await supabase
    .from('repair_items')
    .select('repair_order_id, subtotal')
    .in('repair_order_id', repairIds)

  const itemsByRepair = (items || []).reduce((acc, item) => {
    if (!acc[item.repair_order_id]) {
      acc[item.repair_order_id] = 0
    }
    acc[item.repair_order_id] += item.subtotal
    return acc
  }, {} as Record<string, number>)

  // Group by technician
  const technicianMap = new Map<string, TechnicianRepairStats>()

  for (const repair of repairs) {
    if (!repair.technician_id) continue

    const techId = repair.technician_id
    const techName = (repair.technician as any)?.name || 'Sin nombre'

    if (!technicianMap.has(techId)) {
      technicianMap.set(techId, {
        technician_id: techId,
        technician_name: techName,
        total_repairs: 0,
        completed_repairs: 0,
        in_progress_repairs: 0,
        cancelled_repairs: 0,
        average_repair_days: 0,
        total_revenue: 0
      })
    }

    const stats = technicianMap.get(techId)!
    stats.total_repairs++

    if (repair.status === 'delivered') {
      stats.completed_repairs++
    } else if (repair.status === 'cancelled') {
      stats.cancelled_repairs++
    } else {
      stats.in_progress_repairs++
    }

    // Calculate revenue
    const partsTotal = itemsByRepair[repair.id] || 0
    stats.total_revenue += partsTotal + (repair.labor_cost || 0)
  }

  // Calculate average repair days for completed repairs
  const result = Array.from(technicianMap.values())

  for (const stats of result) {
    const completedRepairs = repairs.filter(
      r => r.technician_id === stats.technician_id && 
           r.status === 'delivered' && 
           r.delivered_date
    )

    if (completedRepairs.length > 0) {
      const totalDays = completedRepairs.reduce((sum, repair) => {
        const received = new Date(repair.received_date)
        const delivered = new Date(repair.delivered_date!)
        const days = Math.ceil((delivered.getTime() - received.getTime()) / (1000 * 60 * 60 * 24))
        return sum + days
      }, 0)

      stats.average_repair_days = Math.round(totalDays / completedRepairs.length)
    }
  }

  return result.sort((a, b) => b.total_repairs - a.total_repairs)
}

/**
 * Get repair distribution by status
 * @param companyId - Company ID
 * @returns Array of status distribution
 */
export async function getRepairsByStatus(companyId: string): Promise<StatusDistribution[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('repair_orders')
    .select('status')
    .eq('company_id', companyId)

  if (error) {
    console.error('Error fetching repairs by status:', error)
    throw new Error('Error al obtener distribución por estado')
  }

  if (!data || data.length === 0) {
    return []
  }

  // Count by status
  const statusCounts = data.reduce((acc, repair) => {
    acc[repair.status] = (acc[repair.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const total = data.length

  return Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    percentage: Math.round((count / total) * 100)
  })).sort((a, b) => b.count - a.count)
}

/**
 * Get repair profitability analysis
 * @param companyId - Company ID
 * @param dateRange - Optional date range filter
 * @returns Array of repair profitability data
 */
export async function getRepairProfitability(
  companyId: string,
  dateRange?: DateRange
): Promise<RepairProfitability[]> {
  const supabase = await createClient()

  // Get ALL repaired or delivered repairs first (no date filter in query)
  const { data: allRepairs, error } = await supabase
    .from('repair_orders')
    .select(`
      id,
      order_number,
      customer_id,
      labor_cost,
      received_date,
      delivered_date,
      repair_completed_date,
      customer:customers(name)
    `)
    .eq('company_id', companyId)
    .in('status', ['repaired', 'delivered'])

  if (error) {
    console.error('Error fetching repair profitability:', error)
    throw new Error('Error al obtener rentabilidad de reparaciones')
  }

  if (!allRepairs || allRepairs.length === 0) {
    return []
  }

  // Filter by date range in memory if provided
  let repairs = allRepairs
  if (dateRange) {
    const fromDate = new Date(dateRange.from)
    const toDate = new Date(dateRange.to)
    toDate.setHours(23, 59, 59, 999)

    repairs = allRepairs.filter(repair => {
      // Use delivered_date if available, otherwise repair_completed_date, otherwise received_date
      const repairDate = repair.delivered_date 
        ? new Date(repair.delivered_date)
        : repair.repair_completed_date
          ? new Date(repair.repair_completed_date)
          : new Date(repair.received_date)
      return repairDate >= fromDate && repairDate <= toDate
    })
  }

  if (repairs.length === 0) {
    return []
  }

  const repairIds = repairs.map(r => r.id)

  // Get repair items (parts cost)
  const { data: items } = await supabase
    .from('repair_items')
    .select('repair_order_id, subtotal')
    .in('repair_order_id', repairIds)

  const itemsByRepair = (items || []).reduce((acc, item) => {
    if (!acc[item.repair_order_id]) {
      acc[item.repair_order_id] = 0
    }
    acc[item.repair_order_id] += item.subtotal
    return acc
  }, {} as Record<string, number>)

  // Get payments
  const { data: payments } = await supabase
    .from('repair_payments')
    .select('repair_order_id, amount')
    .in('repair_order_id', repairIds)

  const paymentsByRepair = (payments || []).reduce((acc, payment) => {
    if (!acc[payment.repair_order_id]) {
      acc[payment.repair_order_id] = 0
    }
    acc[payment.repair_order_id] += payment.amount
    return acc
  }, {} as Record<string, number>)

  // Calculate profitability
  const result: RepairProfitability[] = repairs.map(repair => {
    const parts_cost = itemsByRepair[repair.id] || 0
    const labor_cost = repair.labor_cost || 0
    const total_cost = parts_cost + labor_cost
    const total_paid = paymentsByRepair[repair.id] || 0
    const profit = total_paid - total_cost
    const profit_margin = total_paid > 0 ? (profit / total_paid) * 100 : 0

    return {
      repair_order_id: repair.id,
      order_number: repair.order_number,
      customer_name: (repair.customer as any)?.name || 'Sin nombre',
      device_type: '',
      parts_cost,
      labor_cost,
      total_cost,
      total_paid,
      profit,
      profit_margin: Math.round(profit_margin * 100) / 100
    }
  })

  return result.sort((a, b) => b.profit - a.profit)
}

/**
 * Calculate average repair time in days
 * @param companyId - Company ID
 * @param dateRange - Optional date range filter
 * @returns Average repair time in days
 */
export async function getAverageRepairTime(
  companyId: string,
  dateRange?: DateRange
): Promise<number> {
  const supabase = await createClient()

  // Get ALL delivered repairs with dates first
  const { data: allRepairs, error } = await supabase
    .from('repair_orders')
    .select('received_date, delivered_date')
    .eq('company_id', companyId)
    .eq('status', 'delivered')
    .not('delivered_date', 'is', null)

  if (error) {
    console.error('Error calculating average repair time:', error)
    throw new Error('Error al calcular tiempo promedio de reparación')
  }

  if (!allRepairs || allRepairs.length === 0) {
    return 0
  }

  // Filter by date range in memory if provided
  let repairs = allRepairs
  if (dateRange) {
    const fromDate = new Date(dateRange.from)
    const toDate = new Date(dateRange.to)
    toDate.setHours(23, 59, 59, 999)

    repairs = allRepairs.filter(repair => {
      const repairDate = new Date(repair.delivered_date!)
      return repairDate >= fromDate && repairDate <= toDate
    })
  }

  if (repairs.length === 0) {
    return 0
  }

  const totalDays = repairs.reduce((sum, repair) => {
    const received = new Date(repair.received_date)
    const delivered = new Date(repair.delivered_date!)
    const days = Math.ceil((delivered.getTime() - received.getTime()) / (1000 * 60 * 60 * 24))
    return sum + days
  }, 0)

  return Math.round(totalDays / repairs.length)
}

/**
 * Get completed repairs for export
 * @param companyId - Company ID
 * @param dateRange - Optional date range filter
 * @returns Array of completed repairs with full details
 */
export async function getCompletedRepairsForExport(
  companyId: string,
  dateRange?: DateRange
): Promise<any[]> {
  const supabase = await createClient()

  // Get all completed repairs without date filter first
  let query = supabase
    .from('repair_orders')
    .select(`
      id,
      order_number,
      received_date,
      delivered_date,
      repair_completed_date,
      device_type,
      brand,
      model,
      status,
      labor_cost,
      customer:customers(name, phone, email),
      technician:technicians(name)
    `)
    .eq('company_id', companyId)
    .in('status', ['repaired', 'delivered'])

  const { data: allRepairs, error } = await query.order('received_date', { ascending: false })

  if (error) {
    console.error('Error fetching repairs for export:', error)
    throw new Error('Error al obtener reparaciones para exportar')
  }

  if (!allRepairs || allRepairs.length === 0) {
    return []
  }

  // Filter by date range in memory to handle NULL delivered_date
  let repairs = allRepairs
  if (dateRange) {
    const fromDate = new Date(dateRange.from)
    const toDate = new Date(dateRange.to)
    toDate.setHours(23, 59, 59, 999) // Include the entire end date

    repairs = allRepairs.filter(repair => {
      // Use delivered_date if available, otherwise use repair_completed_date, otherwise use received_date
      const completionDate = repair.delivered_date 
        ? new Date(repair.delivered_date)
        : repair.repair_completed_date
          ? new Date(repair.repair_completed_date)
          : new Date(repair.received_date)
      
      return completionDate >= fromDate && completionDate <= toDate
    })
  }

  if (repairs.length === 0) {
    return []
  }

  const repairIds = repairs.map(r => r.id)

  // Get repair items
  const { data: items } = await supabase
    .from('repair_items')
    .select('repair_order_id, product_name, quantity, unit_price, subtotal')
    .in('repair_order_id', repairIds)

  const itemsByRepair = (items || []).reduce((acc, item) => {
    if (!acc[item.repair_order_id]) {
      acc[item.repair_order_id] = []
    }
    acc[item.repair_order_id].push(item)
    return acc
  }, {} as Record<string, any[]>)

  // Get payments
  const { data: payments } = await supabase
    .from('repair_payments')
    .select('repair_order_id, amount, payment_method, payment_date')
    .in('repair_order_id', repairIds)

  const paymentsByRepair = (payments || []).reduce((acc, payment) => {
    if (!acc[payment.repair_order_id]) {
      acc[payment.repair_order_id] = []
    }
    acc[payment.repair_order_id].push(payment)
    return acc
  }, {} as Record<string, any[]>)

  // Build export data
  return repairs.map(repair => {
    const repairItems = itemsByRepair[repair.id] || []
    const repairPayments = paymentsByRepair[repair.id] || []
    
    const parts_cost = repairItems.reduce((sum, item) => sum + item.subtotal, 0)
    const total_cost = parts_cost + (repair.labor_cost || 0)
    const total_paid = repairPayments.reduce((sum, p) => sum + p.amount, 0)
    
    const receivedDate = new Date(repair.received_date)
    const completedDate = repair.delivered_date 
      ? new Date(repair.delivered_date)
      : repair.repair_completed_date 
        ? new Date(repair.repair_completed_date)
        : null
    
    const repairDays = completedDate
      ? Math.ceil((completedDate.getTime() - receivedDate.getTime()) / (1000 * 60 * 60 * 24))
      : null

    return {
      repair,
      items: repairItems,
      payments: repairPayments,
      parts_cost,
      total_cost,
      total_paid,
      balance: total_cost - total_paid,
      repair_days: repairDays
    }
  })
}
