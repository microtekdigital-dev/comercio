'use server'

import { createClient } from '@/lib/supabase/server'
import { canAccessRepairs } from '@/lib/utils/plan-limits'
import type { RepairMetrics, RecentRepair } from '@/lib/types/erp'

/**
 * Obtiene métricas de reparaciones para el dashboard
 * Solo para usuarios con plan Pro Reparaciones
 */
export async function getRepairMetrics(companyId: string): Promise<RepairMetrics | null> {
  // Verificar acceso al módulo de reparaciones
  const access = await canAccessRepairs(companyId)
  if (!access.allowed) {
    return null
  }

  const supabase = await createClient()

  try {
    // Obtener reparaciones completadas o entregadas
    const { data: repairs, error } = await supabase
      .from('repair_orders')
      .select(`
        id,
        order_number,
        delivered_date,
        labor_cost,
        device_type,
        brand,
        model,
        customer:customers(name)
      `)
      .eq('company_id', companyId)
      .in('status', ['repaired', 'delivered'])
      .order('delivered_date', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error fetching repair metrics:', error)
      return null
    }

    if (!repairs || repairs.length === 0) {
      return {
        totalRevenue: 0,
        completedCount: 0,
        recentRepairs: [],
        currency: 'ARS'
      }
    }

    // Obtener IDs de reparaciones para calcular totales
    const repairIds = repairs.map(r => r.id)

    // Obtener items (repuestos) de las reparaciones
    const { data: items } = await supabase
      .from('repair_items')
      .select('repair_order_id, subtotal')
      .in('repair_order_id', repairIds)

    // Obtener pagos de las reparaciones
    const { data: payments } = await supabase
      .from('repair_payments')
      .select('repair_order_id, amount')
      .in('repair_order_id', repairIds)

    // Calcular totales por reparación
    const itemsByRepair = (items || []).reduce((acc, item) => {
      if (!acc[item.repair_order_id]) acc[item.repair_order_id] = 0
      acc[item.repair_order_id] += item.subtotal
      return acc
    }, {} as Record<string, number>)

    const paymentsByRepair = (payments || []).reduce((acc, payment) => {
      if (!acc[payment.repair_order_id]) acc[payment.repair_order_id] = 0
      acc[payment.repair_order_id] += payment.amount
      return acc
    }, {} as Record<string, number>)

    // Construir listado de reparaciones recientes
    const recentRepairs: RecentRepair[] = repairs.map(repair => {
      const partsTotal = itemsByRepair[repair.id] || 0
      const laborCost = repair.labor_cost || 0
      const totalAmount = paymentsByRepair[repair.id] || (partsTotal + laborCost)

      return {
        id: repair.id,
        order_number: repair.order_number,
        customer_name: (repair.customer as any)?.name || 'Sin nombre',
        device_type: repair.device_type || '',
        device_brand: repair.brand || '',
        device_model: repair.model || '',
        delivered_date: repair.delivered_date || '',
        total_amount: totalAmount
      }
    })

    // Calcular importe total de todas las reparaciones completadas
    const { data: allCompletedRepairs } = await supabase
      .from('repair_orders')
      .select('id')
      .eq('company_id', companyId)
      .in('status', ['repaired', 'delivered'])

    const allRepairIds = (allCompletedRepairs || []).map(r => r.id)
    
    let totalRevenue = 0
    if (allRepairIds.length > 0) {
      const { data: allPayments } = await supabase
        .from('repair_payments')
        .select('amount')
        .in('repair_order_id', allRepairIds)

      totalRevenue = (allPayments || []).reduce((sum, p) => sum + p.amount, 0)
    }

    return {
      totalRevenue,
      completedCount: allRepairIds.length,
      recentRepairs,
      currency: 'ARS'
    }
  } catch (error) {
    console.error('Error calculating repair metrics:', error)
    return null
  }
}
