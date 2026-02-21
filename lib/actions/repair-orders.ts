'use server'

import { createClient } from '@/lib/supabase/server'
import { sendRepairReadyNotification } from './repair-notifications'
import { canAccessRepairs } from '@/lib/utils/plan-limits'
import { getCurrentUser } from './users'
import type { 
  RepairOrder, 
  RepairOrderWithDetails,
  CreateRepairOrderInput, 
  UpdateRepairOrderInput,
  RepairOrderFilters,
  RepairStatus 
} from '@/lib/types/erp'

/**
 * Helper function to check repairs module access
 * @throws Error if access is denied
 */
async function checkRepairsAccess(companyId: string): Promise<void> {
  const access = await canAccessRepairs(companyId)
  if (!access.allowed) {
    throw new Error(access.message || 'No tienes acceso al módulo de reparaciones')
  }
}

/**
 * Get all repair orders for a company with optional filters and pagination
 * @param filters - Filter options including pagination
 * @returns Object with repair orders array and pagination info
 */
export async function getRepairOrders(filters: RepairOrderFilters): Promise<{
  orders: (RepairOrder & { total_cost: number; total_paid: number })[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  // Check plan access
  await checkRepairsAccess(filters.companyId)
  
  const supabase = await createClient()

  // Default pagination values
  const page = filters.page || 1
  const pageSize = filters.pageSize || 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('repair_orders')
    .select('*', { count: 'exact' })
    .eq('company_id', filters.companyId)
    .order('received_date', { ascending: false })
    .range(from, to)

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.technicianId) {
    query = query.eq('technician_id', filters.technicianId)
  }

  if (filters.dateFrom) {
    query = query.gte('received_date', filters.dateFrom)
  }

  if (filters.dateTo) {
    query = query.lte('received_date', filters.dateTo)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching repair orders:', error)
    throw new Error('Error al obtener órdenes de reparación')
  }

  // Apply search filter in memory if provided
  let results = data || []
  let total = count || 0
  
  if (filters.search && results.length > 0) {
    const searchLower = filters.search.toLowerCase()
    results = results.filter(order => 
      order.order_number.toString().includes(searchLower) ||
      order.device_type.toLowerCase().includes(searchLower) ||
      order.brand.toLowerCase().includes(searchLower) ||
      order.model.toLowerCase().includes(searchLower)
    )
    total = results.length
  }

  // Get payment information for each repair
  const repairIds = results.map(r => r.id)
  
  // Get repair items totals
  const { data: items } = await supabase
    .from('repair_items')
    .select('repair_order_id, subtotal')
    .in('repair_order_id', repairIds)

  // Get payments totals
  const { data: payments } = await supabase
    .from('repair_payments')
    .select('repair_order_id, amount')
    .in('repair_order_id', repairIds)

  // Calculate totals for each repair
  const itemsByRepair = (items || []).reduce((acc, item) => {
    if (!acc[item.repair_order_id]) {
      acc[item.repair_order_id] = 0
    }
    acc[item.repair_order_id] += item.subtotal
    return acc
  }, {} as Record<string, number>)

  const paymentsByRepair = (payments || []).reduce((acc, payment) => {
    if (!acc[payment.repair_order_id]) {
      acc[payment.repair_order_id] = 0
    }
    acc[payment.repair_order_id] += payment.amount
    return acc
  }, {} as Record<string, number>)

  // Add totals to each repair order
  const ordersWithTotals = results.map(order => ({
    ...order,
    total_cost: (itemsByRepair[order.id] || 0) + (order.labor_cost || 0),
    total_paid: paymentsByRepair[order.id] || 0
  }))

  const totalPages = Math.ceil(total / pageSize)

  return {
    orders: ordersWithTotals,
    total,
    page,
    pageSize,
    totalPages
  }
}

/**
 * Get a single repair order by ID with all related data
 * @param id - Repair order ID
 * @returns Repair order with details or null if not found
 */
export async function getRepairOrderById(id: string): Promise<RepairOrderWithDetails | null> {
  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('repair_orders')
    .select(`
      *,
      customer:customers(*),
      technician:technicians(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching repair order:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
    throw new Error(`Error al obtener orden de reparación: ${error.message}`)
  }

  // Check plan access
  await checkRepairsAccess(order.company_id)

  // Get repair items with products
  const { data: items, error: itemsError } = await supabase
    .from('repair_items')
    .select(`
      *,
      product:products(*)
    `)
    .eq('repair_order_id', id)

  if (itemsError) {
    console.error('Error fetching repair items:', itemsError)
    throw new Error('Error al obtener repuestos')
  }

  // Get payments
  const { data: payments, error: paymentsError } = await supabase
    .from('repair_payments')
    .select('*')
    .eq('repair_order_id', id)
    .order('payment_date', { ascending: false })

  if (paymentsError) {
    console.error('Error fetching repair payments:', paymentsError)
    throw new Error('Error al obtener pagos')
  }

  // Get notes
  const { data: notes, error: notesError } = await supabase
    .from('repair_notes')
    .select('*')
    .eq('repair_order_id', id)
    .order('created_at', { ascending: true })

  if (notesError) {
    console.error('Error fetching repair notes:', notesError)
    throw new Error('Error al obtener notas')
  }

  // Calculate totals
  const total_parts = (items || []).reduce((sum, item) => sum + item.subtotal, 0)
  const total_cost = total_parts + (order.labor_cost || 0)
  const total_paid = (payments || []).reduce((sum, payment) => sum + payment.amount, 0)
  const balance = total_cost - total_paid

  return {
    ...order,
    items: items || [],
    payments: payments || [],
    notes: notes || [],
    total_parts,
    total_cost,
    total_paid,
    balance
  }
}

/**
 * Create a new repair order
 * @param companyId - Company ID
 * @param input - Repair order data
 * @returns Created repair order
 */
export async function createRepairOrder(
  companyId: string,
  input: CreateRepairOrderInput
): Promise<RepairOrder> {
  // Check plan access
  await checkRepairsAccess(companyId)
  
  const supabase = await createClient()

  // Validate required fields
  if (!input.customer_id) {
    throw new Error('El cliente es requerido')
  }
  if (!input.device_type || !input.device_type.trim()) {
    throw new Error('El tipo de dispositivo es requerido')
  }
  if (!input.brand || !input.brand.trim()) {
    throw new Error('La marca es requerida')
  }
  if (!input.model || !input.model.trim()) {
    throw new Error('El modelo es requerido')
  }
  if (!input.reported_problem || !input.reported_problem.trim()) {
    throw new Error('El problema reportado es requerido')
  }

  // Validate estimated delivery date if provided
  if (input.estimated_delivery_date) {
    const receivedDate = new Date()
    const estimatedDate = new Date(input.estimated_delivery_date)
    
    // Reset time to compare only dates
    receivedDate.setHours(0, 0, 0, 0)
    estimatedDate.setHours(0, 0, 0, 0)
    
    if (estimatedDate < receivedDate) {
      throw new Error('La fecha estimada de entrega no puede ser anterior a la fecha de ingreso')
    }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  // Get next order number
  const { data: nextNumber, error: numberError } = await supabase
    .rpc('get_next_repair_order_number', { p_company_id: companyId })

  if (numberError) {
    console.error('Error getting next order number:', numberError)
    throw new Error('Error al generar número de orden')
  }

  const { data, error } = await supabase
    .from('repair_orders')
    .insert({
      company_id: companyId,
      order_number: nextNumber,
      customer_id: input.customer_id,
      technician_id: input.technician_id || null,
      device_type: input.device_type.trim(),
      brand: input.brand.trim(),
      model: input.model.trim(),
      serial_number: input.serial_number?.trim() || null,
      accessories: input.accessories?.trim() || null,
      reported_problem: input.reported_problem.trim(),
      estimated_delivery_date: input.estimated_delivery_date || null,
      photos: input.photos || null,
      status: 'received',
      labor_cost: 0,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating repair order:', error)
    throw new Error('Error al crear orden de reparación')
  }

  return data
}

/**
 * Update a repair order
 * @param id - Repair order ID
 * @param input - Updated repair order data
 * @returns Updated repair order
 */
export async function updateRepairOrder(
  id: string,
  input: UpdateRepairOrderInput
): Promise<RepairOrder> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  // Get the order to check company_id for plan access
  const { data: existingOrder } = await supabase
    .from('repair_orders')
    .select('company_id')
    .eq('id', id)
    .single()

  if (!existingOrder) {
    throw new Error('Orden de reparación no encontrada')
  }

  // Check plan access
  await checkRepairsAccess(existingOrder.company_id)

  const updateData: any = {
    updated_at: new Date().toISOString(),
    updated_by: user.id
  }

  // Only update provided fields with validation
  if (input.technician_id !== undefined) updateData.technician_id = input.technician_id
  
  if (input.device_type !== undefined) {
    if (!input.device_type || !input.device_type.trim()) {
      throw new Error('El tipo de dispositivo no puede estar vacío')
    }
    updateData.device_type = input.device_type.trim()
  }
  
  if (input.brand !== undefined) {
    if (!input.brand || !input.brand.trim()) {
      throw new Error('La marca no puede estar vacía')
    }
    updateData.brand = input.brand.trim()
  }
  
  if (input.model !== undefined) {
    if (!input.model || !input.model.trim()) {
      throw new Error('El modelo no puede estar vacío')
    }
    updateData.model = input.model.trim()
  }
  
  if (input.serial_number !== undefined) updateData.serial_number = input.serial_number?.trim() || null
  if (input.accessories !== undefined) updateData.accessories = input.accessories?.trim() || null
  
  if (input.reported_problem !== undefined) {
    if (!input.reported_problem || !input.reported_problem.trim()) {
      throw new Error('El problema reportado no puede estar vacío')
    }
    updateData.reported_problem = input.reported_problem.trim()
  }
  
  if (input.diagnosis !== undefined) {
    updateData.diagnosis = input.diagnosis?.trim() || null
    if (input.diagnosis) {
      updateData.diagnosis_date = new Date().toISOString()
    }
  }
  
  if (input.estimated_delivery_date !== undefined) {
    if (input.estimated_delivery_date) {
      // Validate estimated delivery date is not before received date
      const { data: currentOrder } = await supabase
        .from('repair_orders')
        .select('received_date')
        .eq('id', id)
        .single()
      
      if (currentOrder) {
        const receivedDate = new Date(currentOrder.received_date)
        const estimatedDate = new Date(input.estimated_delivery_date)
        
        // Reset time to compare only dates
        receivedDate.setHours(0, 0, 0, 0)
        estimatedDate.setHours(0, 0, 0, 0)
        
        if (estimatedDate < receivedDate) {
          throw new Error('La fecha estimada de entrega no puede ser anterior a la fecha de ingreso')
        }
      }
    }
    updateData.estimated_delivery_date = input.estimated_delivery_date
  }
  
  if (input.labor_cost !== undefined) {
    if (input.labor_cost < 0) {
      throw new Error('El costo de mano de obra no puede ser negativo')
    }
    updateData.labor_cost = input.labor_cost
  }
  
  if (input.budget_approved !== undefined) {
    updateData.budget_approved = input.budget_approved
    if (input.budget_approved !== null) {
      updateData.approval_date = new Date().toISOString()
    }
  }
  
  if (input.approval_notes !== undefined) updateData.approval_notes = input.approval_notes?.trim() || null
  if (input.photos !== undefined) updateData.photos = input.photos
  if (input.internal_notes !== undefined) updateData.internal_notes = input.internal_notes?.trim() || null

  const { data, error } = await supabase
    .from('repair_orders')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating repair order:', error)
    throw new Error('Error al actualizar orden de reparación')
  }

  return data
}

/**
 * Update repair order status
 * @param id - Repair order ID
 * @param status - New status
 * @param notes - Optional notes about the status change
 * @returns Updated repair order
 */
export async function updateRepairStatus(
  id: string,
  status: RepairStatus,
  notes?: string
): Promise<RepairOrder> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  // Get the order to check company_id for plan access
  const { data: existingOrder } = await supabase
    .from('repair_orders')
    .select('company_id')
    .eq('id', id)
    .single()

  if (!existingOrder) {
    throw new Error('Orden de reparación no encontrada')
  }

  // Check plan access
  await checkRepairsAccess(existingOrder.company_id)

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
    updated_by: user.id
  }

  // Set automatic timestamps based on status
  if (status === 'repaired' && !updateData.repair_completed_date) {
    updateData.repair_completed_date = new Date().toISOString()
  }

  if (status === 'delivered' && !updateData.delivered_date) {
    updateData.delivered_date = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('repair_orders')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating repair status:', error)
    throw new Error('Error al actualizar estado de reparación')
  }

  // Add note if provided
  if (notes && notes.trim()) {
    await supabase
      .from('repair_notes')
      .insert({
        repair_order_id: id,
        note: `Estado cambiado a: ${status}. ${notes.trim()}`,
        created_by: user.id
      })
  }

  // Send notification automatically when status changes to "repaired"
  if (status === 'repaired') {
    try {
      // Get company info for notification
      const { data: companySettings } = await supabase
        .from('company_settings')
        .select('company_name, phone, email, address')
        .eq('company_id', data.company_id)
        .single()

      const companyInfo = companySettings ? {
        name: companySettings.company_name || 'Servicio Técnico',
        phone: companySettings.phone || undefined,
        email: companySettings.email || undefined,
        address: companySettings.address || undefined
      } : undefined

      // Send notification (don't block on failure)
      const result = await sendRepairReadyNotification(id, companyInfo)
      
      if (result.success) {
        // Add note about notification sent
        await supabase
          .from('repair_notes')
          .insert({
            repair_order_id: id,
            note: '✅ Notificación de reparación lista enviada al cliente',
            created_by: user.id
          })
      } else {
        // Log failure but don't throw error
        console.warn('Failed to send repair ready notification:', result.error)
        await supabase
          .from('repair_notes')
          .insert({
            repair_order_id: id,
            note: `⚠️ Error al enviar notificación: ${result.error}`,
            created_by: user.id
          })
      }
    } catch (notificationError) {
      // Log error but don't fail the status update
      console.error('Error sending repair ready notification:', notificationError)
    }
  }

  return data
}

/**
 * Delete a repair order
 * @param id - Repair order ID
 */
export async function deleteRepairOrder(id: string): Promise<void> {
  const supabase = await createClient()

  // Get the order to check company_id for plan access
  const { data: existingOrder } = await supabase
    .from('repair_orders')
    .select('company_id')
    .eq('id', id)
    .single()

  if (!existingOrder) {
    throw new Error('Orden de reparación no encontrada')
  }

  // Check plan access
  await checkRepairsAccess(existingOrder.company_id)

  const { error } = await supabase
    .from('repair_orders')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting repair order:', error)
    throw new Error('Error al eliminar orden de reparación')
  }
}

/**
 * Search repair orders by query
 * @param query - Search query
 * @param companyId - Company ID
 * @returns Array of matching repair orders
 */
export async function searchRepairOrders(
  query: string,
  companyId: string
): Promise<RepairOrder[]> {
  // Check plan access
  await checkRepairsAccess(companyId)
  
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('repair_orders')
    .select('*')
    .eq('company_id', companyId)
    .order('received_date', { ascending: false })

  if (error) {
    console.error('Error searching repair orders:', error)
    throw new Error('Error al buscar órdenes de reparación')
  }

  // Filter in memory
  const searchLower = query.toLowerCase()
  return (data || []).filter(order => 
    order.order_number.toString().includes(searchLower) ||
    order.device_type.toLowerCase().includes(searchLower) ||
    order.brand.toLowerCase().includes(searchLower) ||
    order.model.toLowerCase().includes(searchLower)
  )
}

/**
 * Update diagnosis for a repair order
 * @param id - Repair order ID
 * @param diagnosis - Diagnosis text
 * @returns Updated repair order
 */
export async function updateDiagnosis(
  id: string,
  diagnosis: string
): Promise<RepairOrder> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  // Get the order to check company_id for plan access
  const { data: existingOrder } = await supabase
    .from('repair_orders')
    .select('company_id')
    .eq('id', id)
    .single()

  if (!existingOrder) {
    throw new Error('Orden de reparación no encontrada')
  }

  // Check plan access
  await checkRepairsAccess(existingOrder.company_id)

  if (!diagnosis || !diagnosis.trim()) {
    throw new Error('El diagnóstico no puede estar vacío')
  }

  const { data, error } = await supabase
    .from('repair_orders')
    .update({
      diagnosis: diagnosis.trim(),
      diagnosis_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: user.id
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating diagnosis:', error)
    throw new Error('Error al actualizar diagnóstico')
  }

  return data
}

/**
 * Approve budget for a repair order
 * @param id - Repair order ID
 * @param approvalNotes - Optional approval notes
 * @returns Updated repair order
 */
export async function approveBudget(
  id: string,
  approvalNotes?: string
): Promise<RepairOrder> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  // Get the order to check company_id for plan access
  const { data: existingOrder } = await supabase
    .from('repair_orders')
    .select('company_id')
    .eq('id', id)
    .single()

  if (!existingOrder) {
    throw new Error('Orden de reparación no encontrada')
  }

  // Check plan access
  await checkRepairsAccess(existingOrder.company_id)

  const { data, error } = await supabase
    .from('repair_orders')
    .update({
      budget_approved: true,
      approval_date: new Date().toISOString(),
      approval_notes: approvalNotes?.trim() || null,
      updated_at: new Date().toISOString(),
      updated_by: user.id
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error approving budget:', error)
    throw new Error('Error al aprobar presupuesto')
  }

  // Add note about approval
  await supabase
    .from('repair_notes')
    .insert({
      repair_order_id: id,
      note: `Presupuesto aprobado${approvalNotes ? ': ' + approvalNotes.trim() : ''}`,
      created_by: user.id
    })

  return data
}

/**
 * Reject budget for a repair order
 * @param id - Repair order ID
 * @param rejectionNotes - Optional rejection notes
 * @param cancelOrder - Whether to cancel the order
 * @returns Updated repair order
 */
export async function rejectBudget(
  id: string,
  rejectionNotes?: string,
  cancelOrder: boolean = false
): Promise<RepairOrder> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  // Get the order to check company_id for plan access
  const { data: existingOrder } = await supabase
    .from('repair_orders')
    .select('company_id')
    .eq('id', id)
    .single()

  if (!existingOrder) {
    throw new Error('Orden de reparación no encontrada')
  }

  // Check plan access
  await checkRepairsAccess(existingOrder.company_id)

  const updateData: any = {
    budget_approved: false,
    approval_date: new Date().toISOString(),
    approval_notes: rejectionNotes?.trim() || null,
    updated_at: new Date().toISOString(),
    updated_by: user.id
  }

  // If canceling, update status
  if (cancelOrder) {
    updateData.status = 'cancelled'
  }

  const { data, error } = await supabase
    .from('repair_orders')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error rejecting budget:', error)
    throw new Error('Error al rechazar presupuesto')
  }

  // Add note about rejection
  const noteText = cancelOrder 
    ? `Presupuesto rechazado y orden cancelada${rejectionNotes ? ': ' + rejectionNotes.trim() : ''}`
    : `Presupuesto rechazado${rejectionNotes ? ': ' + rejectionNotes.trim() : ''}`

  await supabase
    .from('repair_notes')
    .insert({
      repair_order_id: id,
      note: noteText,
      created_by: user.id
    })

  return data
}

/**
 * Get repair history for a customer
 * @param customerId - Customer ID
 * @returns Array of repair orders with totals
 */
export async function getCustomerRepairHistory(customerId: string): Promise<{
  repairs: RepairOrder[]
  stats: {
    totalRepairs: number
    totalAmount: number
    activeRepairs: number
  }
}> {
  const supabase = await createClient()

  // Get all repairs for customer
  const { data: repairs, error } = await supabase
    .from('repair_orders')
    .select('*')
    .eq('customer_id', customerId)
    .order('received_date', { ascending: false })

  if (error) {
    console.error('Error fetching customer repair history:', error)
    throw new Error('Error al obtener historial de reparaciones')
  }

  // Check plan access if there are repairs
  if (repairs && repairs.length > 0) {
    await checkRepairsAccess(repairs[0].company_id)
  }

  // Get repair items to calculate totals
  const repairIds = (repairs || []).map(r => r.id)
  let totalAmount = 0

  if (repairIds.length > 0) {
    const { data: items } = await supabase
      .from('repair_items')
      .select('repair_order_id, subtotal')
      .in('repair_order_id', repairIds)

    // Calculate total for each repair
    const itemsByRepair = (items || []).reduce((acc, item) => {
      if (!acc[item.repair_order_id]) {
        acc[item.repair_order_id] = 0
      }
      acc[item.repair_order_id] += item.subtotal
      return acc
    }, {} as Record<string, number>)

    // Add labor cost and calculate total amount
    totalAmount = (repairs || []).reduce((sum, repair) => {
      const partsTotal = itemsByRepair[repair.id] || 0
      return sum + partsTotal + (repair.labor_cost || 0)
    }, 0)
  }

  const activeRepairs = (repairs || []).filter(
    r => r.status !== 'delivered' && r.status !== 'cancelled'
  ).length

  return {
    repairs: repairs || [],
    stats: {
      totalRepairs: (repairs || []).length,
      totalAmount,
      activeRepairs
    }
  }
}

/**
 * Get overdue repair orders for a company
 * @param companyId - Company ID
 * @returns Array of overdue repair orders
 */
export async function getOverdueRepairOrders(companyId: string): Promise<RepairOrder[]> {
  // Check plan access
  await checkRepairsAccess(companyId)
  
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('repair_orders')
    .select('*')
    .eq('company_id', companyId)
    .not('status', 'in', '(delivered,cancelled)')
    .not('estimated_delivery_date', 'is', null)
    .lt('estimated_delivery_date', today)
    .order('estimated_delivery_date', { ascending: true })

  if (error) {
    console.error('Error fetching overdue repair orders:', error)
    throw new Error('Error al obtener órdenes vencidas')
  }

  return data || []
}

/**
 * Get repair orders summary with overdue count
 * @param companyId - Company ID
 * @returns Summary statistics
 */
export async function getRepairOrdersSummary(companyId: string): Promise<{
  total: number
  active: number
  overdue: number
  byStatus: Record<RepairStatus, number>
}> {
  // Check plan access
  await checkRepairsAccess(companyId)
  
  const supabase = await createClient()

  const { data: orders, error } = await supabase
    .from('repair_orders')
    .select('status, estimated_delivery_date')
    .eq('company_id', companyId)

  if (error) {
    console.error('Error fetching repair orders summary:', error)
    throw new Error('Error al obtener resumen de órdenes')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const summary = {
    total: orders?.length || 0,
    active: 0,
    overdue: 0,
    byStatus: {
      received: 0,
      diagnosing: 0,
      waiting_parts: 0,
      repairing: 0,
      repaired: 0,
      delivered: 0,
      cancelled: 0
    } as Record<RepairStatus, number>
  }

  orders?.forEach(order => {
    // Count by status
    const status = order.status as RepairStatus
    summary.byStatus[status] = (summary.byStatus[status] || 0) + 1

    // Count active (not delivered or cancelled)
    if (status !== 'delivered' && status !== 'cancelled') {
      summary.active++

      // Count overdue
      if (order.estimated_delivery_date) {
        const estimatedDate = new Date(order.estimated_delivery_date)
        estimatedDate.setHours(0, 0, 0, 0)
        if (estimatedDate < today) {
          summary.overdue++
        }
      }
    }
  })

  return summary
}

/**
 * Send repair order estimate by email
 * @param id - Repair order ID
 * @param email - Recipient email
 * @param subject - Email subject
 * @param message - Custom message
 * @returns Success result
 */
export async function sendRepairOrderByEmail(
  id: string,
  email: string,
  subject: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get repair order with details
  const orderData = await getRepairOrderById(id)
  if (!orderData) {
    return { success: false, error: 'Orden de reparación no encontrada' }
  }

  // Check plan access
  await checkRepairsAccess(orderData.company_id)

  // Get company info
  const { data: companyData } = await supabase
    .from('companies')
    .select('name')
    .eq('id', orderData.company_id)
    .single()

  const companyName = companyData?.name || 'Servicio Técnico'

  // Send email using Resend
  const { sendRepairOrderEmail } = await import('@/lib/email/resend')

  const emailResult = await sendRepairOrderEmail(email, subject, message, {
    orderNumber: orderData.order_number.toString(),
    customerName: orderData.customer.name,
    deviceType: orderData.device_type,
    deviceBrand: orderData.brand,
    deviceModel: orderData.model,
    estimatedCost: orderData.total_cost,
    companyName
  })

  if (!emailResult.success) {
    return { success: false, error: emailResult.error }
  }

  // Add note about email sent
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase
      .from('repair_notes')
      .insert({
        repair_order_id: id,
        note: `📧 Presupuesto enviado por email a: ${email}`,
        created_by: user.id
      })
  }

  return { success: true }
}
