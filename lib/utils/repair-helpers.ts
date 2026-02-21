import type { RepairOrder } from '@/lib/types/erp'

/**
 * Check if a repair order is overdue
 * @param order - Repair order
 * @returns True if order is overdue
 */
export function isRepairOrderOverdue(order: RepairOrder): boolean {
  // Order is overdue if:
  // 1. Has an estimated delivery date
  // 2. Is not delivered or cancelled
  // 3. Estimated date is in the past
  if (!order.estimated_delivery_date) {
    return false
  }

  if (order.status === 'delivered' || order.status === 'cancelled') {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const estimatedDate = new Date(order.estimated_delivery_date)
  estimatedDate.setHours(0, 0, 0, 0)

  return estimatedDate < today
}
