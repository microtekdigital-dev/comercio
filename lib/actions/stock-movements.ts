"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { StockMovement, StockMovementFormData } from "@/lib/types/erp"

/**
 * Obtiene los movimientos de stock con filtros opcionales
 * 
 * @param filters - Filtros opcionales para la consulta
 * @param filters.productId - ID del producto para filtrar movimientos
 * @param filters.movementType - Tipo de movimiento (purchase, sale, adjustment_in, adjustment_out, return_in, return_out)
 * @param filters.dateFrom - Fecha inicial para filtrar (formato ISO)
 * @param filters.dateTo - Fecha final para filtrar (formato ISO)
 * @param filters.employeeId - ID del empleado que realizó el movimiento
 * @param filters.purchaseOrderId - ID de la orden de compra asociada
 * 
 * @returns Array de movimientos de stock ordenados por fecha descendente
 * 
 * @example
 * // Obtener todos los movimientos
 * const movements = await getStockMovements()
 * 
 * @example
 * // Obtener movimientos de un producto específico
 * const movements = await getStockMovements({ productId: 'uuid-123' })
 * 
 * @example
 * // Obtener movimientos manuales de un empleado en un rango de fechas
 * const movements = await getStockMovements({
 *   employeeId: 'uuid-456',
 *   movementType: 'adjustment_in',
 *   dateFrom: '2024-01-01',
 *   dateTo: '2024-12-31'
 * })
 */
export async function getStockMovements(filters?: {
  productId?: string;
  movementType?: string;
  dateFrom?: string;
  dateTo?: string;
  employeeId?: string;
  purchaseOrderId?: string;
}): Promise<StockMovement[]> {
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
      .from("stock_movements")
      .select("*, product:products(id, name, sku)")
      .eq("company_id", profile.company_id)

    // Apply filters
    if (filters?.productId) {
      query = query.eq("product_id", filters.productId)
    }

    if (filters?.movementType) {
      query = query.eq("movement_type", filters.movementType)
    }

    if (filters?.dateFrom) {
      query = query.gte("created_at", filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte("created_at", filters.dateTo)
    }

    if (filters?.employeeId) {
      query = query.eq("created_by", filters.employeeId)
    }

    if (filters?.purchaseOrderId) {
      query = query.eq("purchase_order_id", filters.purchaseOrderId)
    }

    query = query.order("created_at", { ascending: false })

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching stock movements:", error)
    return []
  }
}

/**
 * Obtiene el historial completo de movimientos de stock para un producto específico
 * 
 * @param productId - ID del producto
 * @returns Array de movimientos de stock del producto ordenados por fecha descendente
 * 
 * @example
 * const history = await getProductStockHistory('uuid-123')
 * // Retorna todos los movimientos del producto: compras, ventas, ajustes, etc.
 */
export async function getProductStockHistory(productId: string): Promise<StockMovement[]> {
  return getStockMovements({ productId })
}

/**
 * Crea un ajuste manual de stock para un producto
 * 
 * @param formData - Datos del ajuste de stock
 * @param formData.product_id - ID del producto (requerido)
 * @param formData.movement_type - Tipo de ajuste: 'adjustment_in' (ingreso) o 'adjustment_out' (egreso)
 * @param formData.quantity - Cantidad a ajustar (debe ser mayor a 0)
 * @param formData.notes - Notas opcionales sobre el ajuste
 * 
 * @returns Objeto con el movimiento creado o un error
 * 
 * @throws Retorna error si:
 * - El usuario no está autenticado
 * - El producto no existe o no pertenece a la empresa
 * - El producto no tiene track_inventory activado
 * - El ajuste resultaría en stock negativo
 * - Faltan campos requeridos
 * 
 * @example
 * // Aumentar stock manualmente
 * const result = await createStockAdjustment({
 *   product_id: 'uuid-123',
 *   movement_type: 'adjustment_in',
 *   quantity: 50,
 *   notes: 'Inventario físico - encontrados 50 unidades adicionales'
 * })
 * 
 * @example
 * // Disminuir stock por daño
 * const result = await createStockAdjustment({
 *   product_id: 'uuid-123',
 *   movement_type: 'adjustment_out',
 *   quantity: 5,
 *   notes: 'Productos dañados - baja de inventario'
 * })
 */
export async function createStockAdjustment(formData: StockMovementFormData) {
  const supabase = await createClient()
  
  try {
    // Validate required fields
    if (!formData.product_id) {
      return { error: "El ID del producto es requerido" }
    }

    if (!formData.movement_type) {
      return { error: "El tipo de movimiento es requerido. Tipos válidos: adjustment_in, adjustment_out, return_in, return_out" }
    }

    if (!['adjustment_in', 'adjustment_out', 'return_in', 'return_out'].includes(formData.movement_type)) {
      return { error: `Tipo de movimiento inválido: ${formData.movement_type}. Tipos válidos: adjustment_in, adjustment_out, return_in, return_out` }
    }

    if (!formData.quantity || formData.quantity <= 0) {
      return { error: "La cantidad debe ser mayor a 0" }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "No autenticado" }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, full_name, email")
      .eq("id", user.id)
      .single()

    if (!profile?.company_id) {
      return { error: "No se encontró la empresa asociada al usuario" }
    }

    // Validate employee exists
    const { data: employee, error: employeeError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single()

    if (employeeError || !employee) {
      return { error: "El empleado no existe en el sistema" }
    }

    // Get current product stock
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("stock_quantity, track_inventory, name")
      .eq("id", formData.product_id)
      .eq("company_id", profile.company_id)
      .single()

    if (productError || !product) {
      return { error: `Producto no encontrado o no pertenece a su empresa` }
    }

    if (!product.track_inventory) {
      return { error: `El producto "${product.name}" no tiene seguimiento de inventario activado. Active el seguimiento en la configuración del producto para registrar movimientos.` }
    }

    const stockBefore = product.stock_quantity
    const quantity = formData.movement_type === 'adjustment_in'
      ? formData.quantity 
      : -formData.quantity
    const stockAfter = stockBefore + quantity

    if (stockAfter < 0) {
      return { error: `El ajuste resultaría en stock negativo (${stockAfter}). Stock actual: ${stockBefore}, cambio solicitado: ${quantity}` }
    }

    // Create stock movement record
    const { data: movement, error: movementError } = await supabase
      .from("stock_movements")
      .insert({
        company_id: profile.company_id,
        product_id: formData.product_id,
        movement_type: formData.movement_type,
        quantity,
        stock_before: stockBefore,
        stock_after: stockAfter,
        created_by: user.id,
        created_by_name: profile.full_name || profile.email,
        notes: formData.notes || `Ajuste manual de inventario`,
      })
      .select()
      .single()

    if (movementError) {
      console.error("Error creating movement:", movementError)
      return { error: `Error al crear el registro de movimiento: ${movementError.message}` }
    }

    // Update product stock
    const { error: updateError } = await supabase
      .from("products")
      .update({ stock_quantity: stockAfter })
      .eq("id", formData.product_id)

    if (updateError) {
      console.error("Error updating product stock:", updateError)
      return { error: `Error al actualizar el stock del producto: ${updateError.message}` }
    }

    revalidatePath("/dashboard/products")
    revalidatePath(`/dashboard/products/${formData.product_id}`)
    return { data: movement }
  } catch (error: any) {
    console.error("Error creating stock adjustment:", error)
    return { error: error.message || "Error inesperado al crear el ajuste de stock. Por favor, intente nuevamente." }
  }
}

/**
 * Registra un movimiento de stock por venta (uso interno)
 * 
 * Esta función es llamada automáticamente cuando se completa una venta.
 * No debe ser llamada directamente desde el código de la aplicación.
 * 
 * @param saleId - ID de la venta
 * @param productId - ID del producto vendido
 * @param quantity - Cantidad vendida (positiva)
 * @param stockBefore - Stock antes de la venta
 * @param stockAfter - Stock después de la venta
 * 
 * @internal
 */
export async function logSaleStockMovement(
  saleId: string,
  productId: string,
  quantity: number,
  stockBefore: number,
  stockAfter: number
) {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, full_name, email")
      .eq("id", user.id)
      .single()

    if (!profile?.company_id) return

    await supabase
      .from("stock_movements")
      .insert({
        company_id: profile.company_id,
        product_id: productId,
        movement_type: 'sale',
        quantity: -quantity,
        stock_before: stockBefore,
        stock_after: stockAfter,
        sale_id: saleId,
        created_by: user.id,
        created_by_name: profile.full_name || profile.email,
        notes: `Venta registrada`,
      })
  } catch (error) {
    console.error("Error logging sale stock movement:", error)
  }
}

/**
 * Registra un movimiento de stock por orden de compra (uso interno)
 * 
 * Esta función es llamada automáticamente cuando se recibe una orden de compra.
 * No debe ser llamada directamente desde el código de la aplicación.
 * 
 * @param purchaseOrderId - ID de la orden de compra
 * @param productId - ID del producto recibido
 * @param quantity - Cantidad recibida (positiva)
 * @param stockBefore - Stock antes de la recepción
 * @param stockAfter - Stock después de la recepción
 * 
 * @internal
 */
export async function logPurchaseStockMovement(
  purchaseOrderId: string,
  productId: string,
  quantity: number,
  stockBefore: number,
  stockAfter: number
) {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, full_name, email")
      .eq("id", user.id)
      .single()

    if (!profile?.company_id) return

    await supabase
      .from("stock_movements")
      .insert({
        company_id: profile.company_id,
        product_id: productId,
        movement_type: 'purchase',
        quantity: quantity,
        stock_before: stockBefore,
        stock_after: stockAfter,
        purchase_order_id: purchaseOrderId,
        created_by: user.id,
        created_by_name: profile.full_name || profile.email,
        notes: `Recepción de orden de compra`,
      })
  } catch (error) {
    console.error("Error logging purchase stock movement:", error)
  }
}

/**
 * Obtiene estadísticas de movimientos de stock
 * 
 * @param productId - ID del producto (opcional). Si no se proporciona, retorna estadísticas globales
 * @returns Objeto con estadísticas de movimientos o null si hay error
 * 
 * @example
 * // Estadísticas de un producto específico
 * const stats = await getStockMovementStats('uuid-123')
 * // Retorna: {
 * //   totalIn: 150,      // Total de ingresos
 * //   totalOut: 80,      // Total de egresos
 * //   purchases: 100,    // Ingresos por compras
 * //   sales: 60,         // Egresos por ventas
 * //   adjustmentsIn: 50, // Ajustes de ingreso
 * //   adjustmentsOut: 20 // Ajustes de egreso
 * // }
 * 
 * @example
 * // Estadísticas globales de toda la empresa
 * const stats = await getStockMovementStats()
 */
export async function getStockMovementStats(productId?: string) {
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

    let query = supabase
      .from("stock_movements")
      .select("movement_type, quantity")
      .eq("company_id", profile.company_id)

    if (productId) {
      query = query.eq("product_id", productId)
    }

    const { data, error } = await query

    if (error) throw error

    const stats = {
      totalIn: 0,
      totalOut: 0,
      purchases: 0,
      sales: 0,
      adjustmentsIn: 0,
      adjustmentsOut: 0,
    }

    data?.forEach(movement => {
      const qty = Math.abs(movement.quantity)
      
      if (movement.quantity > 0) {
        stats.totalIn += qty
      } else {
        stats.totalOut += qty
      }

      switch (movement.movement_type) {
        case 'purchase':
          stats.purchases += qty
          break
        case 'sale':
          stats.sales += qty
          break
        case 'adjustment_in':
          stats.adjustmentsIn += qty
          break
        case 'adjustment_out':
          stats.adjustmentsOut += qty
          break
      }
    })

    return stats
  } catch (error) {
    console.error("Error fetching stock movement stats:", error)
    return null
  }
}

/**
 * Crea una corrección de stock que revierte un movimiento anterior
 * 
 * Esta función crea un nuevo movimiento compensatorio en lugar de modificar
 * el movimiento original, manteniendo la integridad del historial.
 * 
 * @param originalMovementId - ID del movimiento original a corregir
 * @param reason - Razón de la corrección
 * @returns Objeto con el movimiento de corrección creado o un error
 * 
 * @example
 * const result = await createStockCorrection(
 *   'uuid-original-movement',
 *   'Error en el conteo inicial - corrección de inventario'
 * )
 */
export async function createStockCorrection(
  originalMovementId: string,
  reason: string
) {
  const supabase = await createClient()
  
  try {
    if (!originalMovementId) {
      return { error: "El ID del movimiento original es requerido" }
    }

    if (!reason || reason.trim().length === 0) {
      return { error: "Debe proporcionar una razón para la corrección" }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "No autenticado" }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, full_name, email")
      .eq("id", user.id)
      .single()

    if (!profile?.company_id) {
      return { error: "No se encontró la empresa asociada al usuario" }
    }

    // Get original movement
    const { data: originalMovement, error: movementError } = await supabase
      .from("stock_movements")
      .select("*, product:products(id, name, stock_quantity, track_inventory)")
      .eq("id", originalMovementId)
      .eq("company_id", profile.company_id)
      .single()

    if (movementError || !originalMovement) {
      return { error: "Movimiento original no encontrado o no pertenece a su empresa" }
    }

    if (!originalMovement.product?.track_inventory) {
      return { error: `El producto "${originalMovement.product?.name}" no tiene seguimiento de inventario activado` }
    }

    // Calculate correction movement (reverse of original)
    const correctionQuantity = -originalMovement.quantity
    const stockBefore = originalMovement.product.stock_quantity
    const stockAfter = stockBefore + correctionQuantity

    if (stockAfter < 0) {
      return { error: `La corrección resultaría en stock negativo (${stockAfter}). Stock actual: ${stockBefore}` }
    }

    // Determine correction movement type
    let correctionType: string
    if (correctionQuantity > 0) {
      correctionType = 'adjustment_in'
    } else {
      correctionType = 'adjustment_out'
    }

    // Create correction movement
    const { data: correctionMovement, error: correctionError } = await supabase
      .from("stock_movements")
      .insert({
        company_id: profile.company_id,
        product_id: originalMovement.product_id,
        movement_type: correctionType,
        quantity: correctionQuantity,
        stock_before: stockBefore,
        stock_after: stockAfter,
        created_by: user.id,
        created_by_name: profile.full_name || profile.email,
        notes: `CORRECCIÓN: Revierte movimiento ${originalMovement.movement_type} del ${new Date(originalMovement.created_at).toLocaleDateString()}. Razón: ${reason}`,
      })
      .select()
      .single()

    if (correctionError) {
      console.error("Error creating correction:", correctionError)
      return { error: `Error al crear la corrección: ${correctionError.message}` }
    }

    // Update product stock
    const { error: updateError } = await supabase
      .from("products")
      .update({ stock_quantity: stockAfter })
      .eq("id", originalMovement.product_id)

    if (updateError) {
      console.error("Error updating product stock:", updateError)
      return { error: `Error al actualizar el stock del producto: ${updateError.message}` }
    }

    revalidatePath("/dashboard/products")
    revalidatePath(`/dashboard/products/${originalMovement.product_id}`)
    return { data: correctionMovement }
  } catch (error: any) {
    console.error("Error creating stock correction:", error)
    return { error: error.message || "Error inesperado al crear la corrección de stock" }
  }
}
