'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle2, Circle, Clock } from 'lucide-react'
import type { RepairOrder } from '@/lib/types/erp'

interface RepairTimelineProps {
  order: RepairOrder
}

interface TimelineEvent {
  label: string
  date?: string
  completed: boolean
  current: boolean
}

export function RepairTimeline({ order }: RepairTimelineProps) {
  const events: TimelineEvent[] = [
    {
      label: 'Recibido',
      date: order.received_date,
      completed: true,
      current: order.status === 'received'
    },
    {
      label: 'Diagnóstico',
      date: order.diagnosis_date,
      completed: !!order.diagnosis_date,
      current: order.status === 'diagnosing'
    },
    {
      label: 'Presupuesto aprobado',
      date: order.approval_date,
      completed: order.budget_approved === true,
      current: false
    },
    {
      label: 'En reparación',
      date: undefined,
      completed: ['repairing', 'repaired', 'delivered'].includes(order.status),
      current: order.status === 'repairing' || order.status === 'waiting_parts'
    },
    {
      label: 'Reparación completada',
      date: order.repair_completed_date,
      completed: !!order.repair_completed_date,
      current: order.status === 'repaired'
    },
    {
      label: 'Entregado',
      date: order.delivered_date,
      completed: !!order.delivered_date,
      current: order.status === 'delivered'
    }
  ]

  // Filter out cancelled status from timeline
  if (order.status === 'cancelled') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-red-600">
          <Circle className="h-5 w-5" />
          <div>
            <p className="font-medium">Orden cancelada</p>
            {order.approval_notes && (
              <p className="text-sm text-muted-foreground">{order.approval_notes}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className="mt-1">
            {event.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : event.current ? (
              <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
            ) : (
              <Circle className="h-5 w-5 text-gray-300" />
            )}
          </div>
          <div className="flex-1">
            <p className={`font-medium ${event.completed ? 'text-foreground' : event.current ? 'text-blue-600' : 'text-muted-foreground'}`}>
              {event.label}
            </p>
            {event.date && (
              <p className="text-sm text-muted-foreground">
                {format(new Date(event.date), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
