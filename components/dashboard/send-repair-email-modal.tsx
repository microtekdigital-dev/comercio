'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'
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
import { sendRepairOrderByEmail } from '@/lib/actions/repair-orders'
import { useToast } from '@/hooks/use-toast'

interface SendRepairEmailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  repairOrderId: string
  customerEmail?: string
  customerName: string
  orderNumber: number
  onSuccess?: () => void
}

export function SendRepairEmailModal({
  open,
  onOpenChange,
  repairOrderId,
  customerEmail,
  customerName,
  orderNumber,
  onSuccess
}: SendRepairEmailModalProps) {
  const { toast } = useToast()
  const [email, setEmail] = useState(customerEmail || '')
  const [subject, setSubject] = useState(`Presupuesto de Reparación - Orden #${orderNumber}`)
  const [message, setMessage] = useState(
    `Estimado/a ${customerName},\n\nAdjuntamos el presupuesto para la reparación de su dispositivo.\n\nPor favor, revise los detalles y confirme si desea proceder con la reparación.\n\nQuedamos a su disposición para cualquier consulta.`
  )
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email || !email.trim()) {
      toast({
        title: 'Error',
        description: 'El email es requerido',
        variant: 'destructive'
      })
      return
    }

    if (!subject || !subject.trim()) {
      toast({
        title: 'Error',
        description: 'El asunto es requerido',
        variant: 'destructive'
      })
      return
    }

    setSending(true)
    try {
      const result = await sendRepairOrderByEmail(
        repairOrderId,
        email.trim(),
        subject.trim(),
        message.trim()
      )

      if (result.success) {
        toast({
          title: 'Email enviado',
          description: 'El presupuesto ha sido enviado correctamente'
        })
        onSuccess?.()
        handleClose()
      } else {
        // Check if it's a Resend domain verification error
        const isResendDomainError = result.error?.includes('verify a domain') || 
                                    result.error?.includes('testing emails') ||
                                    result.error?.includes('API key not configured')

        if (isResendDomainError) {
          toast({
            title: 'Configuración requerida',
            description: 'Para enviar emails, debes configurar RESEND_API_KEY y verificar un dominio en resend.com',
            variant: 'destructive'
          })
        } else {
          toast({
            title: 'Error al enviar email',
            description: result.error || 'No se pudo enviar el email',
            variant: 'destructive'
          })
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al enviar email',
        variant: 'destructive'
      })
    } finally {
      setSending(false)
    }
  }

  function handleClose() {
    setEmail(customerEmail || '')
    setSubject(`Presupuesto de Reparación - Orden #${orderNumber}`)
    setMessage(
      `Estimado/a ${customerName},\n\nAdjuntamos el presupuesto para la reparación de su dispositivo.\n\nPor favor, revise los detalles y confirme si desea proceder con la reparación.\n\nQuedamos a su disposición para cualquier consulta.`
    )
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Enviar Presupuesto por Email
            </DialogTitle>
            <DialogDescription>
              Envía el presupuesto de la orden #{orderNumber} al cliente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email del Cliente *</Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Asunto *</Label>
              <Input
                id="subject"
                type="text"
                placeholder="Asunto del email"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Mensaje</Label>
              <Textarea
                id="message"
                placeholder="Mensaje personalizado para el cliente..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Este mensaje aparecerá al inicio del email junto con los detalles de la reparación
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={sending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? 'Enviando...' : 'Enviar Email'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
