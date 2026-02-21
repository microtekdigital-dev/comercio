'use server'

import { createClient } from '@/lib/supabase/server'
import type { 
  RepairPayment,
  CreateRepairPaymentInput,
  PaymentBalance
} from '@/lib/types/erp'

/**
 * Get all payments for a repair order
 * @param repairOrderId - Repair order ID
 * @returns Array of repair payments
 */
export async function getRepairPayments(repairOrderId: string): Promise<RepairPayment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('repair_payments')
    .select('*')
    .eq('repair_order_id', repairOrderId)
    .order('payment_date', { ascending: false })

  if (error) {
    console.error('Error fetching repair payments:', error)
    throw new Error('Error al obtener pagos de la reparación')
  }

  return data || []
}

/**
 * Create a repair payment
 * @param companyId - Company ID
 * @param input - Payment data
 * @returns Created payment
 */
export async function createRepairPayment(
  companyId: string,
  input: CreateRepairPaymentInput
): Promise<RepairPayment> {
  const supabase = await createClient()

  // Validate required fields
  if (!input.repair_order_id) {
    throw new Error('La orden de reparación es requerida')
  }
  
  if (!input.payment_method || !input.payment_method.trim()) {
    throw new Error('El método de pago es requerido')
  }

  if (input.amount === undefined || input.amount === null) {
    throw new Error('El monto es requerido')
  }

  if (input.amount <= 0) {
    throw new Error('El monto debe ser mayor a cero')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  const { data, error } = await supabase
    .from('repair_payments')
    .insert({
      repair_order_id: input.repair_order_id,
      company_id: companyId,
      amount: input.amount,
      payment_method: input.payment_method,
      notes: input.notes?.trim() || null,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating repair payment:', error)
    throw new Error('Error al registrar pago de reparación')
  }

  return data
}

/**
 * Get payment balance for a repair order
 * @param repairOrderId - Repair order ID
 * @returns Payment balance information
 */
export async function getRepairPaymentBalance(repairOrderId: string): Promise<PaymentBalance> {
  const supabase = await createClient()

  // Get repair order with items
  const { data: order, error: orderError } = await supabase
    .from('repair_orders')
    .select('labor_cost')
    .eq('id', repairOrderId)
    .single()

  if (orderError) {
    console.error('Error fetching repair order:', orderError)
    throw new Error('Error al obtener orden de reparación')
  }

  // Get repair items total
  const { data: items, error: itemsError } = await supabase
    .from('repair_items')
    .select('subtotal')
    .eq('repair_order_id', repairOrderId)

  if (itemsError) {
    console.error('Error fetching repair items:', itemsError)
    throw new Error('Error al obtener repuestos')
  }

  // Get payments total
  const { data: payments, error: paymentsError } = await supabase
    .from('repair_payments')
    .select('amount')
    .eq('repair_order_id', repairOrderId)

  if (paymentsError) {
    console.error('Error fetching payments:', paymentsError)
    throw new Error('Error al obtener pagos')
  }

  const parts_total = (items || []).reduce((sum, item) => sum + item.subtotal, 0)
  const total = parts_total + (order.labor_cost || 0)
  const paid = (payments || []).reduce((sum, payment) => sum + payment.amount, 0)
  const balance = total - paid

  return {
    total,
    paid,
    balance
  }
}

/**
 * Process a repair payment and link to cash register
 * @param companyId - Company ID
 * @param input - Payment data
 * @param linkToCashRegister - Whether to link to cash register closure
 * @returns Created payment
 */
export async function processRepairPayment(
  companyId: string,
  input: CreateRepairPaymentInput,
  linkToCashRegister: boolean = false
): Promise<RepairPayment> {
  const supabase = await createClient()

  // Validate required fields
  if (!input.repair_order_id) {
    throw new Error('La orden de reparación es requerida')
  }
  
  if (!input.payment_method || !input.payment_method.trim()) {
    throw new Error('El método de pago es requerido')
  }

  if (input.amount === undefined || input.amount === null) {
    throw new Error('El monto es requerido')
  }

  if (input.amount <= 0) {
    throw new Error('El monto debe ser mayor a cero')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  // Get repair order details
  const { data: order, error: orderError } = await supabase
    .from('repair_orders')
    .select('order_number, customer_id')
    .eq('id', input.repair_order_id)
    .single()

  if (orderError || !order) {
    throw new Error('Orden de reparación no encontrada')
  }

  let cashRegisterClosureId: string | null = null

  // Link to cash register if payment is cash/card
  if (linkToCashRegister && (input.payment_method === 'cash' || input.payment_method === 'card')) {
    // Get current open cash register
    const { data: opening } = await supabase
      .from('cash_register_openings')
      .select('id')
      .eq('company_id', companyId)
      .order('opening_date', { ascending: false })
      .limit(1)
      .single()

    if (opening) {
      // Note: In a real implementation, we would create a cash_register_closure entry
      // For now, we just store the reference
      cashRegisterClosureId = opening.id
    }
  }

  // Create payment record
  const { data, error } = await supabase
    .from('repair_payments')
    .insert({
      repair_order_id: input.repair_order_id,
      company_id: companyId,
      amount: input.amount,
      payment_method: input.payment_method,
      cash_register_closure_id: cashRegisterClosureId,
      notes: input.notes?.trim() || null,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating repair payment:', error)
    throw new Error('Error al procesar pago de reparación')
  }

  return data
}
