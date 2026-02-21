import { Badge } from '@/components/ui/badge'
import type { RepairStatus } from '@/lib/types/erp'

interface RepairStatusBadgeProps {
  status: RepairStatus
  className?: string
}

const statusConfig: Record<RepairStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  received: {
    label: 'Recibido',
    variant: 'secondary'
  },
  diagnosing: {
    label: 'Diagnosticando',
    variant: 'default'
  },
  waiting_parts: {
    label: 'Esperando repuestos',
    variant: 'outline'
  },
  repairing: {
    label: 'Reparando',
    variant: 'default'
  },
  repaired: {
    label: 'Reparado',
    variant: 'default'
  },
  delivered: {
    label: 'Entregado',
    variant: 'default'
  },
  cancelled: {
    label: 'Cancelado',
    variant: 'destructive'
  }
}

export function RepairStatusBadge({ status, className }: RepairStatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
