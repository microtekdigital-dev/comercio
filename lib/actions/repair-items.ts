'use server'

import { createClient } from '@/lib/supabase/server'
import { canAccessRepairs } from '@/lib/utils/plan-limits'
import type { 
  RepairItem,
  RepairItemWithProduct,
  AddRepairItemInput,
  UpdateRepairItemInput,
  RepairTotal
} from '@/lib/types/erp'

/**
 * Helper function to check repairs module access for a repair order
 * @throws Error if access is denied
 */
async function checkRepairsAccessForOrder(repairOrderId: string): Promise<void> {
  const supabase = await createClient()
  const { data: order } = await supabase
    .from('repair_orders')
    .select('company_id')
    .eq('id', repairOrderId)
    .single()
  
  if (!order) {
    throw new Error('Orden de reparación no encontrada')
  }
  
  const access = await canAccessRepairs(order.company_id)
  if (!access.allowed) {
    throw new Error(access.message || 'No tienes acceso al módulo de reparaciones')
  }
}

/**
 * Get all repair items for a repair order with product details
 * @param repairOrderId - Repair order ID
 * @returns Array of repair items with product information
 */
export async function getRepairItems(repairOrderId: string): Promise<RepairItemWithProduct[]> {
  await checkRepairsAccessForOrder(repairOrderId)
  
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('repair_items')
    .select(`
      *,
      product:products(*)
    `)
    .eq('repair_order_id', repairOrderId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching repair items:', error)
    throw new Error('Error al obtener repuestos de la reparación')
  }

  return data || []
}

/**
 * Add a repair item (part) to a repair order
 * @param input - Repair item data
 * @returns Created repair item
 */
export async function addRepairItem(input: AddRepairItemInput): Promise<RepairItem> {
  await checkRepairsAccessForOrder(input.repair_order_id)
  
  const supabase = await createClient()

  // Validate required fields
  if (!input.repair_order_id) {
    throw new Error('La orden de reparación es requerida')
  }
  
  if (!input.product_id) {
    throw new Error('El producto es requerido')
  }

  if (input.quantity === undefined || input.quantity === null) {
    throw new Error('La cantidad es requerida')
  }

  if (input.quantity <= 0) {
    throw new Error('La cantidad debe ser mayor a cero')
  }

  if (input.unit_price === undefined || input.unit_price === null) {
    throw new Error('El precio unitario es requerido')
  }

  if (input.unit_price < 0) {
    throw new Error('El precio unitario no puede ser negativo')
  }

  // Verify product exists and get stock info
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, stock_quantity')
    .eq('id', input.product_id)
    .single()

  if (productError || !product) {
    throw new Error('El producto especificado no existe')
  }

  // Check stock availability and warn if insufficient (but allow operation)
  let stockWarning: string | undefined
  if (product.stock_quantity < input.quantity) {
    stockWarning = `Advertencia: Stock insuficiente. Disponible: ${product.stock_quantity}, Solicitado: ${input.quantity}`
    console.warn(stockWarning)
  }

  // Create repair item
  const { data, error } = await supabase
    .from('repair_items')
    .insert({
      repair_order_id: input.repair_order_id,
      product_id: input.product_id,
      quantity: input.quantity,
      unit_price: input.unit_price,
      is_used: false
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding repair item:', error)
    throw new Error('Error al agregar repuesto a la reparación')
  }

  // Return data with stock warning if applicable
  return {
    ...data,
    _stockWarning: stockWarning
  } as any
}

/**
 * Update a repair item
 * @param id - Repair item ID
 * @param input - Updated repair item data
 * @returns Updated repair item
 */
export async function updateRepairItem(
  id: string,
  input: UpdateRepairItemInput
): Promise<RepairItem> {
  const supabase = await createClient()

  // Get the item to check repair_order_id for plan access
  const { data: existingItem } = await supabase
    .from('repair_items')
    .select('repair_order_id')
    .eq('id', id)
    .single()

  if (!existingItem) {
    throw new Error('Repuesto no encontrado')
  }

  await checkRepairsAccessForOrder(existingItem.repair_order_id)

  const updateData: any = {}

  if (input.quantity !== undefined) {
    if (input.quantity === null) {
      throw new Error('La cantidad no puede ser nula')
    }
    if (input.quantity <= 0) {
      throw new Error('La cantidad debe ser mayor a cero')
    }
    updateData.quantity = input.quantity
  }

  if (input.unit_price !== undefined) {
    if (input.unit_price === null) {
      throw new Error('El precio unitario no puede ser nulo')
    }
    if (input.unit_price < 0) {
      throw new Error('El precio unitario no puede ser negativo')
    }
    updateData.unit_price = input.unit_price
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error('No hay campos para actualizar')
  }

  const { data, error } = await supabase
    .from('repair_items')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating repair item:', error)
    throw new Error('Error al actualizar repuesto')
  }

  return data
}

/**
 * Delete a repair item
 * @param id - Repair item ID
 */
export async function deleteRepairItem(id: string): Promise<void> {
  const supabase = await createClient()

  // Check if item is already used and get repair_order_id for plan access
  const { data: item, error: fetchError } = await supabase
    .from('repair_items')
    .select('is_used, repair_order_id')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('Error fetching repair item:', fetchError)
    throw new Error('Error al obtener repuesto')
  }

  await checkRepairsAccessForOrder(item.repair_order_id)

  if (item.is_used) {
    throw new Error('No se puede eliminar un repuesto que ya fue utilizado')
  }

  const { error } = await supabase
    .from('repair_items')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting repair item:', error)
    throw new Error('Error al eliminar repuesto')
  }
}

/**
 * Mark a repair item as used and deduct from inventory
 * @param id - Repair item ID
 */
export async function markItemAsUsed(id: string): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  // Get repair item with product and repair order details
  const { data: item, error: itemError } = await supabase
    .from('repair_items')
    .select(`
      *,
      product:products(*),
      repair_order:repair_orders(company_id, order_number)
    `)
    .eq('id', id)
    .single()

  if (itemError || !item) {
    console.error('Error fetching repair item:', itemError)
    throw new Error('Error al obtener repuesto')
  }

  await checkRepairsAccessForOrder(item.repair_order_id)

  if (item.is_used) {
    throw new Error('Este repuesto ya fue marcado como utilizado')
  }

  // Check if product has sufficient stock
  if (item.product.stock_quantity < item.quantity) {
    throw new Error(`Stock insuficiente. Disponible: ${item.product.stock_quantity}, Requerido: ${item.quantity}`)
  }

  // Start transaction: mark as used, update stock, create stock movement
  // Mark item as used
  const { error: updateError } = await supabase
    .from('repair_items')
    .update({ is_used: true })
    .eq('id', id)

  if (updateError) {
    console.error('Error marking item as used:', updateError)
    throw new Error('Error al marcar repuesto como utilizado')
  }

  // Update product stock
  const newStock = item.product.stock_quantity - item.quantity
  const { error: stockError } = await supabase
    .from('products')
    .update({ stock_quantity: newStock })
    .eq('id', item.product_id)

  if (stockError) {
    console.error('Error updating product stock:', stockError)
    throw new Error('Error al actualizar stock del producto')
  }

  // Get user profile for created_by_name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  const userName = profile?.full_name || profile?.email || 'Usuario'

  // Create stock movement record
  const { error: movementError } = await supabase
    .from('stock_movements')
    .insert({
      company_id: item.repair_order.company_id,
      product_id: item.product_id,
      variant_id: null,
      movement_type: 'adjustment_out',
      quantity: item.quantity,
      stock_before: item.product.stock_quantity,
      stock_after: newStock,
      created_by: user.id,
      created_by_name: userName,
      notes: `Repuesto utilizado en reparación #${item.repair_order.order_number}`
    })

  if (movementError) {
    console.error('Error creating stock movement:', movementError)
    // Don't throw here - the main operation succeeded
    console.warn('Stock movement record could not be created, but stock was updated')
  }
}

/**
 * Calculate total cost for a repair order
 * @param repairOrderId - Repair order ID
 * @returns Repair total breakdown
 */
export async function calculateRepairTotal(repairOrderId: string): Promise<RepairTotal> {
  await checkRepairsAccessForOrder(repairOrderId)
  
  const supabase = await createClient()

  // Get all repair items
  const { data: items, error: itemsError } = await supabase
    .from('repair_items')
    .select('subtotal')
    .eq('repair_order_id', repairOrderId)

  if (itemsError) {
    console.error('Error fetching repair items:', itemsError)
    throw new Error('Error al calcular total de repuestos')
  }

  // Get labor cost from repair order
  const { data: order, error: orderError } = await supabase
    .from('repair_orders')
    .select('labor_cost')
    .eq('id', repairOrderId)
    .single()

  if (orderError) {
    console.error('Error fetching repair order:', orderError)
    throw new Error('Error al obtener costo de mano de obra')
  }

  const parts_total = (items || []).reduce((sum, item) => sum + item.subtotal, 0)
  const labor_cost = order.labor_cost || 0
  const total = parts_total + labor_cost

  return {
    parts_total,
    labor_cost,
    total
  }
}

/**
 * Revert stock movements for a cancelled repair order
 * Restores inventory for all used repair items
 * @param repairOrderId - Repair order ID
 */
export async function revertStockMovements(repairOrderId: string): Promise<void> {
  await checkRepairsAccessForOrder(repairOrderId)
  
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  // Get repair order with company info and verify it's cancelled
  const { data: order, error: orderError } = await supabase
    .from('repair_orders')
    .select('id, company_id, order_number, status')
    .eq('id', repairOrderId)
    .single()

  if (orderError || !order) {
    console.error('Error fetching repair order:', orderError)
    throw new Error('Error al obtener orden de reparación')
  }

  if (order.status !== 'cancelled') {
    throw new Error('Solo se puede revertir stock de órdenes canceladas')
  }

  // Get all used repair items for this order
  const { data: usedItems, error: itemsError } = await supabase
    .from('repair_items')
    .select(`
      id,
      product_id,
      quantity,
      is_used,
      product:products(id, name, stock_quantity)
    `)
    .eq('repair_order_id', repairOrderId)
    .eq('is_used', true)

  if (itemsError) {
    console.error('Error fetching used repair items:', itemsError)
    throw new Error('Error al obtener repuestos utilizados')
  }

  if (!usedItems || usedItems.length === 0) {
    throw new Error('No hay repuestos utilizados para revertir')
  }

  // Get user profile for created_by_name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  const userName = profile?.full_name || profile?.email || 'Usuario'

  // Process each used item: restore stock and create reversal movement
  for (const item of usedItems) {
    const product = item.product as any
    const newStock = product.stock_quantity + item.quantity

    // Update product stock
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock_quantity: newStock })
      .eq('id', item.product_id)

    if (stockError) {
      console.error('Error updating product stock:', stockError)
      throw new Error(`Error al restaurar stock del producto ${product.name}`)
    }

    // Create stock movement record for reversal
    const { error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        company_id: order.company_id,
        product_id: item.product_id,
        variant_id: null,
        movement_type: 'adjustment_in',
        quantity: item.quantity,
        stock_before: product.stock_quantity,
        stock_after: newStock,
        created_by: user.id,
        created_by_name: userName,
        notes: `Reversión de stock por cancelación de reparación #${order.order_number}`
      })

    if (movementError) {
      console.error('Error creating stock movement:', movementError)
      // Don't throw here - the main operation succeeded
      console.warn('Stock movement record could not be created, but stock was restored')
    }

    // Mark item as not used
    const { error: itemError } = await supabase
      .from('repair_items')
      .update({ is_used: false })
      .eq('id', item.id)

    if (itemError) {
      console.error('Error updating repair item:', itemError)
      console.warn('Could not mark item as unused, but stock was restored')
    }
  }
}

/**
 * Check stock availability for a product
 * @param productId - Product ID
 * @param quantity - Requested quantity
 * @returns Stock availability info
 */
export async function checkStockAvailability(
  productId: string,
  quantity: number
): Promise<{
  available: boolean
  currentStock: number
  requested: number
  warning?: string
}> {
  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', productId)
    .single()

  if (error || !product) {
    throw new Error('Producto no encontrado')
  }

  const available = product.stock_quantity >= quantity
  const warning = !available 
    ? `Stock insuficiente. Disponible: ${product.stock_quantity}, Solicitado: ${quantity}`
    : undefined

  return {
    available,
    currentStock: product.stock_quantity,
    requested: quantity,
    warning
  }
}
