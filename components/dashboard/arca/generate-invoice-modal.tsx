'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Receipt, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { generateInvoiceFromSale } from '@/lib/actions/arca/invoice-generator'
import { processInvoice } from '@/lib/actions/arca/invoice-processor'
import { InvoiceType, FiscalCondition, InvoiceStatus } from '@/lib/types/arca'
import type { Sale } from '@/lib/types/erp'

interface GenerateInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale: Sale
  onSuccess?: () => void
}

export function GenerateInvoiceModal({
  open,
  onOpenChange,
  sale,
  onSuccess
}: GenerateInvoiceModalProps) {
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [invoiceType, setInvoiceType] = useState<InvoiceType | null>(null)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [status, setStatus] = useState<InvoiceStatus>(InvoiceStatus.DRAFT)
  const [cae, setCAE] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (open && sale.customer) {
      // Determine invoice type based on customer fiscal condition
      const fiscalCondition = sale.customer.fiscal_condition as FiscalCondition
      const type = determineInvoiceType(fiscalCondition)
      setInvoiceType(type)
    }
  }, [open, sale])

  const determineInvoiceType = (fiscalCondition: FiscalCondition): InvoiceType => {
    switch (fiscalCondition) {
      case FiscalCondition.RESPONSABLE_INSCRIPTO:
        return InvoiceType.FACTURA_A
      case FiscalCondition.CONSUMIDOR_FINAL:
        return InvoiceType.FACTURA_B
      case FiscalCondition.MONOTRIBUTISTA:
        return InvoiceType.FACTURA_C
      case FiscalCondition.EXENTO:
        return InvoiceType.FACTURA_A
      default:
        return InvoiceType.FACTURA_B
    }
  }

  const getInvoiceTypeLabel = (type: InvoiceType): string => {
    return type.replace(/_/g, ' ')
  }

  const getFiscalConditionLabel = (condition: string): string => {
    const labels: Record<string, string> = {
      'RESPONSABLE_INSCRIPTO': 'Responsable Inscripto',
      'CONSUMIDOR_FINAL': 'Consumidor Final',
      'MONOTRIBUTISTA': 'Monotributista',
      'EXENTO': 'Exento'
    }
    return labels[condition] || condition
  }

  const handleGenerate = async () => {
    setLoading(true)
    setErrors([])

    try {
      // Step 1: Generate invoice record
      const generateResult = await generateInvoiceFromSale(sale.id, sale.created_by)

      if (!generateResult.success || !generateResult.invoice) {
        setErrors([generateResult.error || 'Error al generar el comprobante'])
        setLoading(false)
        return
      }

      const invoice = generateResult.invoice
      setInvoiceId(invoice.id!)
      setStatus(InvoiceStatus.PENDING)

      // Step 2: Process invoice (send to ARCA)
      setProcessing(true)
      const processResult = await processInvoice(invoice.id!)

      if (processResult.success && processResult.cae) {
        setStatus(InvoiceStatus.AUTHORIZED)
        setCAE(processResult.cae)
        toast.success('Factura electrónica generada y autorizada exitosamente')
        
        // Wait a moment to show success state
        setTimeout(() => {
          onSuccess?.()
          onOpenChange(false)
        }, 2000)
      } else {
        setStatus(InvoiceStatus.REJECTED)
        setErrors(processResult.errors || ['Error al procesar el comprobante con ARCA'])
        
        if (processResult.retryable) {
          toast.warning('El comprobante se reintentará automáticamente')
        } else {
          toast.error('Error al autorizar el comprobante')
        }
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
      setErrors([error instanceof Error ? error.message : 'Error desconocido'])
      toast.error('Error al generar la factura electrónica')
    } finally {
      setLoading(false)
      setProcessing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Generar Factura Electrónica
          </DialogTitle>
          <DialogDescription>
            Generar comprobante electrónico para la venta #{sale.sale_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Type */}
          {invoiceType && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Tipo de Comprobante</h4>
              <Badge variant="outline" className="text-base px-3 py-1">
                {getInvoiceTypeLabel(invoiceType)}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Determinado automáticamente según la condición fiscal del cliente
              </p>
            </div>
          )}

          {/* Customer Fiscal Data */}
          {sale.customer && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Datos Fiscales del Cliente</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Razón Social:</span>
                  <span className="font-medium">{sale.customer.business_name || sale.customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Condición Fiscal:</span>
                  <span className="font-medium">
                    {getFiscalConditionLabel(sale.customer.fiscal_condition || '')}
                  </span>
                </div>
                {sale.customer.cuit_cuil && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CUIT/CUIL:</span>
                    <span className="font-medium font-mono">{sale.customer.cuit_cuil}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Documento:</span>
                  <span className="font-medium">
                    {sale.customer.document_type} {sale.customer.document_number}
                  </span>
                </div>
                {sale.customer.fiscal_address && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Domicilio Fiscal:</span>
                    <span className="font-medium text-right">{sale.customer.fiscal_address}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Items Summary */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Ítems del Comprobante</h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {sale.items?.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.quantity}x {item.product_name}
                    {item.variant_name && ` (${item.variant_name})`}
                  </span>
                  <span className="font-medium">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IVA:</span>
              <span className="font-medium">{formatCurrency(sale.tax_amount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
          </div>

          {/* Status */}
          {status !== InvoiceStatus.DRAFT && (
            <Alert>
              {status === InvoiceStatus.PENDING && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Enviando comprobante a ARCA...
                  </AlertDescription>
                </>
              )}
              {status === InvoiceStatus.AUTHORIZED && cae && (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium text-green-600">Comprobante autorizado exitosamente</p>
                      <p className="text-sm">CAE: <span className="font-mono">{cae}</span></p>
                    </div>
                  </AlertDescription>
                </>
              )}
              {status === InvoiceStatus.REJECTED && (
                <>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription>
                    <p className="font-medium text-destructive">Error al autorizar el comprobante</p>
                  </AlertDescription>
                </>
              )}
            </Alert>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || processing}
            >
              {status === InvoiceStatus.AUTHORIZED ? 'Cerrar' : 'Cancelar'}
            </Button>
            {status === InvoiceStatus.DRAFT && (
              <Button
                onClick={handleGenerate}
                disabled={loading || processing || !invoiceType}
              >
                {loading || processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {processing ? 'Procesando...' : 'Generando...'}
                  </>
                ) : (
                  <>
                    <Receipt className="mr-2 h-4 w-4" />
                    Generar y Enviar a ARCA
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
