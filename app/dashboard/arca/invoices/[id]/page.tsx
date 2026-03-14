'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { InvoiceStatusBadge } from '@/components/dashboard/arca/invoice-status-badge'
import {
  Receipt,
  Download,
  Ban,
  RotateCcw,
  ArrowLeft,
  FileText,
  Calendar,
  User,
  MapPin,
  Hash,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { InvoiceStatus } from '@/lib/types/arca'

// TODO: Import actual actions when implemented
// import { getElectronicInvoice, retryInvoice, cancelInvoice, downloadInvoicePDF } from '@/lib/actions/arca/invoice-processor'

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string

  const [loading, setLoading] = useState(true)
  const [invoice, setInvoice] = useState<any>(null)
  const [retryHistory, setRetryHistory] = useState<any[]>([])

  useEffect(() => {
    loadInvoice()
  }, [invoiceId])

  const loadInvoice = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const result = await getElectronicInvoice(invoiceId)
      // if (result.success) {
      //   setInvoice(result.invoice)
      //   setRetryHistory(result.retryHistory || [])
      // } else {
      //   toast.error(result.error || 'Error al cargar el comprobante')
      // }
      
      // Mock data for now
      setInvoice(null)
      toast.info('Cargando comprobante...')
    } catch (error) {
      console.error('Error loading invoice:', error)
      toast.error('Error al cargar el comprobante')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      // TODO: Implement PDF download
      // const result = await downloadInvoicePDF(invoiceId)
      // if (result.success && result.pdfUrl) {
      //   window.open(result.pdfUrl, '_blank')
      // } else {
      //   toast.error(result.error || 'Error al descargar PDF')
      // }
      toast.info('Función de descarga de PDF en desarrollo')
    } catch (error) {
      toast.error('Error al descargar el PDF')
    }
  }

  const handleRetry = async () => {
    try {
      // TODO: Implement retry
      // const result = await retryInvoice(invoiceId)
      // if (result.success) {
      //   toast.success('Reintento programado')
      //   loadInvoice()
      // } else {
      //   toast.error(result.error || 'Error al reintentar')
      // }
      toast.info('Función de reintento en desarrollo')
    } catch (error) {
      toast.error('Error al reintentar el comprobante')
    }
  }

  const handleCancel = async () => {
    if (!confirm('¿Está seguro que desea anular este comprobante? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      // TODO: Implement cancel
      // const result = await cancelInvoice(invoiceId, 'Anulación manual')
      // if (result.success) {
      //   toast.success('Comprobante anulado exitosamente')
      //   loadInvoice()
      // } else {
      //   toast.error(result.error || 'Error al anular')
      // }
      toast.info('Función de anulación en desarrollo')
    } catch (error) {
      toast.error('Error al anular el comprobante')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatInvoiceNumber = (pointOfSale: number, invoiceNumber: number) => {
    return `${String(pointOfSale).padStart(5, '0')}-${String(invoiceNumber).padStart(8, '0')}`
  }

  const getInvoiceTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ')
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard/arca/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando comprobante...</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard/arca/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No se encontró el comprobante</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/arca/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {getInvoiceTypeLabel(invoice.invoice_type)}
            </h2>
            <p className="text-muted-foreground">
              {formatInvoiceNumber(invoice.point_of_sale, invoice.invoice_number)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {invoice.pdf_url && (
            <Button onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          )}
          {invoice.status === InvoiceStatus.REJECTED && (
            <Button variant="outline" onClick={handleRetry}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          )}
          {invoice.status === InvoiceStatus.AUTHORIZED && (
            <Button variant="destructive" onClick={handleCancel}>
              <Ban className="mr-2 h-4 w-4" />
              Anular
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceStatusBadge status={invoice.status} />
          </CardContent>
        </Card>

        {/* Issue Date Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fecha de Emisión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{formatDate(invoice.issue_date)}</p>
          </CardContent>
        </Card>

        {/* Total Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(invoice.total)}</p>
          </CardContent>
        </Card>
      </div>

      {/* CAE Information */}
      {invoice.cae && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Información Fiscal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">CAE (Código de Autorización Electrónico)</p>
                <p className="text-lg font-mono font-semibold">{invoice.cae}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Vencimiento del CAE</p>
                <p className="text-lg font-semibold">{formatDate(invoice.cae_expiration_date)}</p>
              </div>
            </div>

            {/* QR Code */}
            {invoice.qr_code && (
              <div className="flex flex-col items-center gap-2 pt-4">
                <p className="text-sm text-muted-foreground">Código QR</p>
                <div className="border rounded-lg p-4 bg-white">
                  {/* TODO: Render actual QR code */}
                  <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">QR Code</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Datos del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Razón Social</p>
              <p className="font-medium">{invoice.customer_business_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Condición Fiscal</p>
              <p className="font-medium">{invoice.customer_fiscal_condition}</p>
            </div>
            {invoice.customer_cuit_cuil && (
              <div>
                <p className="text-sm text-muted-foreground">CUIT/CUIL</p>
                <p className="font-mono font-medium">{invoice.customer_cuit_cuil}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Documento</p>
              <p className="font-medium">
                {invoice.customer_document_type} {invoice.customer_document_number}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Domicilio Fiscal
              </p>
              <p className="font-medium">{invoice.customer_fiscal_address}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ítems del Comprobante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio Unit.</TableHead>
                <TableHead className="text-right">Alícuota IVA</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">IVA</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items?.map((item: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                  <TableCell className="text-right">{item.vat_rate}%</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.vat_amount)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IVA:</span>
              <span className="font-medium">{formatCurrency(invoice.vat_amount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VAT Breakdown (for Factura A) */}
      {invoice.vat_breakdown && invoice.vat_breakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Desglose de IVA por Alícuota</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alícuota</TableHead>
                  <TableHead className="text-right">Base Imponible</TableHead>
                  <TableHead className="text-right">Importe IVA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.vat_breakdown.map((vat: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{vat.vat_rate}%</TableCell>
                    <TableCell className="text-right">{formatCurrency(vat.taxable_base)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(vat.vat_amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Retry History */}
      {retryHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Reintentos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Intento</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Mensaje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retryHistory.map((retry: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>#{retry.attempt_number}</TableCell>
                    <TableCell>{formatDate(retry.scheduled_at)}</TableCell>
                    <TableCell>
                      <Badge variant={retry.success ? 'default' : 'destructive'}>
                        {retry.success ? 'Exitoso' : 'Fallido'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {retry.error_message || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Related Invoice (for credit/debit notes) */}
      {invoice.related_invoice_id && (
        <Card>
          <CardHeader>
            <CardTitle>Comprobante Original</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Esta nota hace referencia al siguiente comprobante:
            </p>
            <Link href={`/dashboard/arca/invoices/${invoice.related_invoice_id}`}>
              <Button variant="outline">
                <Receipt className="mr-2 h-4 w-4" />
                Ver Comprobante Original
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
