'use client'

import { useState, useEffect } from 'react'
import { DollarSign, CreditCard, Smartphone, Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { RepairOrderWithDetails, CompanySettings } from '@/lib/types/erp'
import { processRepairPayment } from '@/lib/actions/repair-payments'
import { getCompanySettings } from '@/lib/actions/company-settings'
import { formatCompanyCurrency } from '@/lib/utils/currency'
import { toast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'

interface RepairPaymentModalProps {
  order: RepairOrderWithDetails
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaymentComplete: () => void
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo', icon: Banknote },
  { value: 'card', label: 'Tarjeta', icon: CreditCard },
  { value: 'transfer', label: 'Transferencia', icon: Smartphone },
  { value: 'other', label: 'Otro', icon: DollarSign },
]

export function RepairPaymentModal({
  order,
  open,
  onOpenChange,
  onPaymentComplete
}: RepairPaymentModalProps) {
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [notes, setNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [settings, setSettings] = useState<CompanySettings | null>(null)

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      const data = await getCompanySettings()
      setSettings(data)
    }
    loadSettings()
  }, [])

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setAmount(order.balance > 0 ? order.balance.toString() : '')
      setPaymentMethod('')
      setNotes('')
    }
  }, [open, order.balance])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: 'Error',
        description: 'Ingrese un monto válido mayor a cero',
        variant: 'destructive'
      })
      return
    }

    if (!paymentMethod) {
      toast({
        title: 'Error',
        description: 'Seleccione un método de pago',
        variant: 'destructive'
      })
      return
    }

    if (amountNum > order.balance) {
      const formattedAmount = settings ? formatCompanyCurrency(amountNum, settings) : `$${amountNum.toFixed(2)}`
      const formattedBalance = settings ? formatCompanyCurrency(order.balance, settings) : `$${order.balance.toFixed(2)}`
      if (!confirm(`El monto ingresado (${formattedAmount}) es mayor al saldo pendiente (${formattedBalance}). ¿Desea continuar?`)) {
        return
      }
    }

    setProcessing(true)
    try {
      await processRepairPayment(
        order.company_id,
        {
          repair_order_id: order.id,
          amount: amountNum,
          payment_method: paymentMethod,
          notes: notes.trim() || undefined
        },
        true // Link to cash register
      )

      toast({
        title: 'Pago registrado',
        description: 'El pago ha sido registrado correctamente'
      })

      onOpenChange(false)
      onPaymentComplete()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al registrar pago',
        variant: 'destructive'
      })
    } finally {
      setProcessing(false)
    }
  }

  const getPaymentStatus = () => {
    if (order.total_paid === 0) return { label: 'Pendiente', variant: 'destructive' as const }
    if (order.balance > 0) return { label: 'Pagado Parcial', variant: 'secondary' as const }
    return { label: 'Pagado Completo', variant: 'default' as const }
  }

  const paymentStatus = getPaymentStatus()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Pago - Orden #{order.order_number}</DialogTitle>
          <DialogDescription>
            Cliente: {order.customer.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Payment Summary */}
          <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total de la Reparación:</span>
              <span className="font-medium">{settings ? formatCompanyCurrency(order.total_cost, settings) : `$${order.total_cost.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Pagado:</span>
              <span className="font-medium">{settings ? formatCompanyCurrency(order.total_paid, settings) : `$${order.total_paid.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Saldo Pendiente:</span>
              <span className={order.balance > 0 ? 'text-destructive' : 'text-green-600'}>
                {settings ? formatCompanyCurrency(order.balance, settings) : `$${order.balance.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-muted-foreground">Estado:</span>
              <Badge variant={paymentStatus.variant}>{paymentStatus.label}</Badge>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto a Pagar *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Método de Pago *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Seleccione método" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon
                      return (
                        <SelectItem key={method.value} value={method.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {method.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observaciones (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ingrese observaciones sobre el pago..."
                rows={2}
              />
            </div>
          </form>

          {/* Payment History */}
          {order.payments.length > 0 && (
            <div className="space-y-2">
              <Label>Historial de Pagos</Label>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-sm">
                          {formatDate(payment.payment_date)}
                        </TableCell>
                        <TableCell className="text-sm capitalize">
                          {PAYMENT_METHODS.find(m => m.value === payment.payment_method)?.label || payment.payment_method}
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium">
                          {settings ? formatCompanyCurrency(payment.amount, settings) : `$${payment.amount.toFixed(2)}`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processing}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={processing || !amount || !paymentMethod}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Registrar Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
