"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { PriceChange, PriceChangeFilters, PriceChangeFormData } from "@/lib/types/erp"

/**
 * Obtiene los cambios de precio con filtros opcionales
 * 
 * @param filters - Filtros opcionales para la consulta
 * @param filters.productId - ID del producto para filtrar cambios
 * @param filters.priceType - Tipo de precio (sale_price o cost_price)
 * @param filters.dateFrom - Fecha inicial para filtrar (formato ISO)
 * @param filters.dateTo - Fecha final para filtrar (formato ISO)
 * @param filters.employeeId - ID del empleado que realizó el cambio
 * 
 * @returns Array de cambios de precio ordenados por fecha descendente
 * 
 * @example
 * // Obtener todos los cambios de precio
 * const changes = await getPriceChanges()
 * 
 * @example
 * // Obtener cambios de precio de venta de un producto específico
 * const changes = await getPriceChanges({ 
 *   productId: 'uuid-123',
 *   priceType: 'sale_price'
 * })
 * 
 * @example
 * // Obtener cambios realizados por un empleado en un rango de fechas
 * const changes = await getPriceChanges({
 *   employeeId: 'uuid-456',
 *   dateFrom: '2024-01-01',
 *   dateTo: '2024-12-31'
 * })
 */
export async function getPriceChanges(filters?: PriceChangeFilters): Promise<PriceChange[]> {
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
      .from("price_changes")
      .select("*, product:products(id, name, sku)")
      .eq("company_id", profile.company_id)

    // Apply filters
    if (filters?.productId) {
      query = query.eq("product_id", filters.productId)
    }

    if (filters?.priceType) {
      query = query.eq("price_type", filters.priceType)
    }

    if (filters?.dateFrom) {
      query = query.gte("created_at", filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte("created_at", filters.dateTo)
    }

    if (filters?.employeeId) {
      query = query.eq("changed_by", filters.employeeId)
    }

    query = query.order("created_at", { ascending: false })

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching price changes:", error)
    return []
  }
}

/**
 * Obtiene el historial completo de cambios de precio para un producto específico
 * 
 * Incluye tanto cambios de precio de venta como de costo, ordenados cronológicamente.
 * 
 * @param productId - ID del producto
 * @returns Array de cambios de precio del producto ordenados por fecha descendente
 * 
 * @example
 * const history = await getProductPriceHistory('uuid-123')
 * // Retorna todos los cambios: sale_price y cost_price
 */
export async function getProductPriceHistory(productId: string): Promise<PriceChange[]> {
  return getPriceChanges({ productId })
}

/**
 * Actualiza el precio de un producto
 * 
 * Esta función actualiza el precio de venta o costo de un producto.
 * El trigger de base de datos registrará automáticamente el cambio en price_changes.
 * 
 * @param productId - ID del producto a actualizar
 * @param formData - Datos del cambio de precio
 * @param formData.price_type - Tipo de precio: 'sale_price' o 'cost_price'
 * @param formData.new_value - Nuevo valor del precio (debe ser >= 0)
 * @param formData.reason - Razón opcional del cambio
 * 
 * @returns Objeto con el producto actualizado o un error
 * 
 * @throws Retorna error si:
 * - El usuario no está autenticado
 * - El producto no existe o no pertenece a la empresa
 * - El nuevo precio es negativo
 * - El nuevo precio es igual al precio actual (sin cambio)
 * - Faltan campos requeridos
 * 
 * @example
 * // Actualizar precio de venta
 * const result = await updateProductPrice('uuid-123', {
 *   product_id: 'uuid-123',
 *   price_type: 'sale_price',
 *   new_value: 150.00,
 *   reason: 'Ajuste por inflación'
 * })
 * 
 * @example
 * // Actualizar precio de costo sin razón
 * const result = await updateProductPrice('uuid-123', {
 *   product_id: 'uuid-123',
 *   price_type: 'cost_price',
 *   new_value: 80.00
 * })
 */
export async function updateProductPrice(
  productId: string,
  formData: PriceChangeFormData
) {
  const supabase = await createClient()
  
  try {
    // Validate required fields
    if (!productId) {
      return { error: "El ID del producto es requerido" }
    }

    if (!formData.price_type) {
      return { error: "El tipo de precio es requerido. Tipos válidos: sale_price, cost_price" }
    }

    if (!['sale_price', 'cost_price'].includes(formData.price_type)) {
      return { error: `Tipo de precio inválido: ${formData.price_type}. Tipos válidos: sale_price, cost_price` }
    }

    if (formData.new_value === undefined || formData.new_value === null) {
      return { error: "El nuevo valor del precio es requerido" }
    }

    if (formData.new_value < 0) {
      return { error: "El precio no puede ser negativo" }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "No autenticado" }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (!profile?.company_id) {
      return { error: "No se encontró la empresa asociada al usuario" }
    }

    // Get current product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, price, cost")
      .eq("id", productId)
      .eq("company_id", profile.company_id)
      .single()

    if (productError || !product) {
      return { error: `Producto no encontrado o no pertenece a su empresa` }
    }

    // Check if price actually changed
    const currentValue = formData.price_type === 'sale_price' ? product.price : product.cost
    if (currentValue === formData.new_value) {
      return { error: `El nuevo precio es igual al precio actual (${currentValue}). No hay cambio para registrar.` }
    }

    // Prepare update data
    const updateData: any = {}
    if (formData.price_type === 'sale_price') {
      updateData.price = formData.new_value
    } else {
      updateData.cost = formData.new_value
    }

    // Update product
    // Note: The database trigger will automatically log the price change
    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", productId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating product price:", updateError)
      return { error: `Error al actualizar el precio del producto: ${updateError.message}` }
    }

    revalidatePath("/dashboard/products")
    revalidatePath(`/dashboard/products/${productId}`)
    revalidatePath("/dashboard/price-history")
    
    return { data: updatedProduct }
  } catch (error: any) {
    console.error("Error updating product price:", error)
    return { error: error.message || "Error inesperado al actualizar el precio. Por favor, intente nuevamente." }
  }
}

/**
 * Exporta los cambios de precio a formato CSV
 * 
 * @param filters - Filtros opcionales (mismos que getPriceChanges)
 * @returns String con el contenido CSV o error
 * 
 * @example
 * // Exportar todos los cambios
 * const csv = await exportPriceChangesToCSV()
 * 
 * @example
 * // Exportar cambios filtrados
 * const csv = await exportPriceChangesToCSV({
 *   priceType: 'sale_price',
 *   dateFrom: '2024-01-01'
 * })
 */
export async function exportPriceChangesToCSV(filters?: PriceChangeFilters): Promise<string> {
  try {
    const changes = await getPriceChanges(filters)
    
    if (changes.length === 0) {
      return "No hay cambios de precio para exportar"
    }

    // CSV headers
    const headers = [
      "Fecha",
      "Producto",
      "SKU",
      "Tipo de Precio",
      "Precio Anterior",
      "Precio Nuevo",
      "Diferencia",
      "Empleado",
      "Rol",
      "Razón"
    ]

    // CSV rows
    const rows = changes.map(change => {
      const date = new Date(change.created_at).toLocaleString('es-ES')
      const productName = change.product?.name || 'Producto eliminado'
      const sku = change.product?.sku || '-'
      const priceType = change.price_type === 'sale_price' ? 'Precio de Venta' : 'Precio de Costo'
      const oldValue = change.old_value.toFixed(2)
      const newValue = change.new_value.toFixed(2)
      const difference = (change.new_value - change.old_value).toFixed(2)
      const employee = change.changed_by_name
      const role = change.changed_by_role
      const reason = change.reason || '-'

      return [
        date,
        escapeCSV(productName),
        escapeCSV(sku),
        priceType,
        oldValue,
        newValue,
        difference,
        escapeCSV(employee),
        role,
        escapeCSV(reason)
      ]
    })

    // Build CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    return csvContent
  } catch (error) {
    console.error("Error exporting price changes to CSV:", error)
    return "Error al exportar los cambios de precio"
  }
}

/**
 * Escapa caracteres especiales para formato CSV
 * @internal
 */
function escapeCSV(value: string): string {
  if (!value) return ''
  
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  
  return value
}

/**
 * Obtiene estadísticas de cambios de precio
 * 
 * @param productId - ID del producto (opcional). Si no se proporciona, retorna estadísticas globales
 * @returns Objeto con estadísticas de cambios o null si hay error
 * 
 * @example
 * // Estadísticas de un producto específico
 * const stats = await getPriceChangeStats('uuid-123')
 * // Retorna: {
 * //   totalChanges: 15,
 * //   salePriceChanges: 10,
 * //   costPriceChanges: 5,
 * //   averageIncrease: 5.5,
 * //   averageDecrease: -3.2
 * // }
 * 
 * @example
 * // Estadísticas globales de toda la empresa
 * const stats = await getPriceChangeStats()
 */
export async function getPriceChangeStats(productId?: string) {
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
      .from("price_changes")
      .select("price_type, old_value, new_value")
      .eq("company_id", profile.company_id)

    if (productId) {
      query = query.eq("product_id", productId)
    }

    const { data, error } = await query

    if (error) throw error

    const stats = {
      totalChanges: 0,
      salePriceChanges: 0,
      costPriceChanges: 0,
      averageIncrease: 0,
      averageDecrease: 0,
    }

    let totalIncrease = 0
    let totalDecrease = 0
    let increaseCount = 0
    let decreaseCount = 0

    data?.forEach(change => {
      stats.totalChanges++
      
      if (change.price_type === 'sale_price') {
        stats.salePriceChanges++
      } else {
        stats.costPriceChanges++
      }

      const difference = change.new_value - change.old_value
      if (difference > 0) {
        totalIncrease += difference
        increaseCount++
      } else if (difference < 0) {
        totalDecrease += difference
        decreaseCount++
      }
    })

    if (increaseCount > 0) {
      stats.averageIncrease = totalIncrease / increaseCount
    }

    if (decreaseCount > 0) {
      stats.averageDecrease = totalDecrease / decreaseCount
    }

    return stats
  } catch (error) {
    console.error("Error fetching price change stats:", error)
    return null
  }
}
