import { Badge } from '@/components/ui/badge'
import { InvoiceStatus } from '@/lib/types/arca'
import { FileText, Clock, CheckCircle2, XCircle, Ban } from 'lucide-react'

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
  className?: string
}

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const getStatusConfig = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.DRAFT:
        return {
          label: 'Borrador',
          variant: 'secondary' as const,
          icon: FileText,
          className: 'bg-gray-100 text-gray-700 hover:bg-gray-100'
        }
      case InvoiceStatus.PENDING:
        return {
          label: 'Pendiente',
          variant: 'outline' as const,
          icon: Clock,
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50'
        }
      case InvoiceStatus.AUTHORIZED:
        return {
          label: 'Autorizado',
          variant: 'default' as const,
          icon: CheckCircle2,
          className: 'bg-green-100 text-green-700 hover:bg-green-100'
        }
      case InvoiceStatus.REJECTED:
        return {
          label: 'Rechazado',
          variant: 'destructive' as const,
          icon: XCircle,
          className: 'bg-red-100 text-red-700 hover:bg-red-100'
        }
      case InvoiceStatus.CANCELLED:
        return {
          label: 'Anulado',
          variant: 'outline' as const,
          icon: Ban,
          className: 'bg-gray-900 text-white hover:bg-gray-900'
        }
      default:
        return {
          label: status,
          variant: 'secondary' as const,
          icon: FileText,
          className: ''
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className || ''}`}
    >
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  )
}
