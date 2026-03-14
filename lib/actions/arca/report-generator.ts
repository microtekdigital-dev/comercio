'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  ReportFilters,
  IssuedInvoicesReport,
  ByTypeReport,
  CancelledReport,
  ErrorReport,
  ExportFormat,
  ElectronicInvoice,
  VATBreakdown,
  InvoiceType,
  VATRate
} from '@/lib/types/arca'

/**
 * Genera reporte de comprobantes emitidos
 */
export async function generateIssuedInvoicesReport(
  filters: ReportFilters
): Promise<IssuedInvoicesReport> {
  const supabase = await createClient()

  let query = supabase
    .from('electronic_invoices')
    .select('*')
    .eq('company_id', filters.companyId)
    .gte('issue_date', filters.startDate.toISOString().split('T')[0])
    .lte('issue_date', filters.endDate.toISOString().split('T')[0])

  if (filters.invoiceType) {
    query = query.eq('invoice_type', filters.invoiceType)
  }

  if (filters.pointOfSale) {
    query = query.eq('point_of_sale', filters.pointOfSale)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error generating issued invoices report:', error)
    throw new Error(`Failed to generate report: ${error.message}`)
  }

  const invoices = (data || []).map(mapDatabaseToInvoice)
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const vatBreakdown = calculateVATBreakdownFromInvoices(invoices)

  // Calcular tasa de éxito
  const authorizedCount = invoices.filter(inv => inv.status === 'AUTHORIZED').length
  const successRate = invoices.length > 0 ? (authorizedCount / invoices.length) * 100 : 0

  return {
    filters,
    invoices,
    totalCount: invoices.length,
    totalAmount,
    vatBreakdown,
    successRate
  }
}

/**
 * Genera reporte por tipo de comprobante
 */
export async function generateByTypeReport(
  filters: ReportFilters
): Promise<ByTypeReport> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('electronic_invoices')
    .select('invoice_type, total')
    .eq('company_id', filters.companyId)
    .gte('issue_date', filters.startDate.toISOString().split('T')[0])
    .lte('issue_date', filters.endDate.toISOString().split('T')[0])

  if (error) {
    console.error('Error generating by type report:', error)
    throw new Error(`Failed to generate report: ${error.message}`)
  }

  // Agrupar por tipo
  const breakdown = new Map<InvoiceType, { count: number; totalAmount: number }>()

  for (const row of data || []) {
    const type = row.invoice_type as InvoiceType
    const existing = breakdown.get(type) || { count: 0, totalAmount: 0 }
    
    breakdown.set(type, {
      count: existing.count + 1,
      totalAmount: existing.totalAmount + (row.total || 0)
    })
  }

  const breakdownArray = Array.from(breakdown.entries()).map(([invoiceType, data]) => ({
    invoiceType,
    count: data.count,
    totalAmount: data.totalAmount
  }))

  const totalAmount = breakdownArray.reduce((sum, item) => sum + item.totalAmount, 0)

  return {
    filters,
    breakdown: breakdownArray,
    totalAmount
  }
}


/**
 * Genera reporte de comprobantes anulados
 */
export async function generateCancelledReport(
  filters: ReportFilters
): Promise<CancelledReport> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('electronic_invoices')
    .select(`
      *,
      cancelled_by_user:profiles!electronic_invoices_created_by_fkey(
        id,
        full_name,
        email
      )
    `)
    .eq('company_id', filters.companyId)
    .eq('status', 'CANCELLED')
    .gte('issue_date', filters.startDate.toISOString().split('T')[0])
    .lte('issue_date', filters.endDate.toISOString().split('T')[0])

  if (error) {
    console.error('Error generating cancelled report:', error)
    throw new Error(`Failed to generate report: ${error.message}`)
  }

  const cancelledInvoices = (data || []).map(row => ({
    invoice: mapDatabaseToInvoice(row),
    cancellationDate: row.updated_at ? new Date(row.updated_at) : new Date(),
    cancellationReason: 'Anulado', // TODO: Agregar campo cancellation_reason a la tabla
    cancelledBy: row.cancelled_by_user?.full_name || row.cancelled_by_user?.email || 'N/A'
  }))

  return {
    filters,
    cancelledInvoices,
    totalCount: cancelledInvoices.length
  }
}

/**
 * Genera reporte de errores
 */
export async function generateErrorReport(
  filters: ReportFilters
): Promise<ErrorReport> {
  const supabase = await createClient()

  // Obtener facturas rechazadas
  const { data: rejectedInvoices, error: rejectedError } = await supabase
    .from('electronic_invoices')
    .select('*')
    .eq('company_id', filters.companyId)
    .eq('status', 'REJECTED')
    .gte('issue_date', filters.startDate.toISOString().split('T')[0])
    .lte('issue_date', filters.endDate.toISOString().split('T')[0])

  if (rejectedError) {
    console.error('Error generating error report:', rejectedError)
    throw new Error(`Failed to generate report: ${rejectedError.message}`)
  }

  // Obtener reintentos
  const { data: retries, error: retriesError } = await supabase
    .from('arca_retry_queue')
    .select('invoice_id, error_message, created_at')
    .in('invoice_id', (rejectedInvoices || []).map(inv => inv.id))

  if (retriesError) {
    console.error('Error fetching retries:', retriesError)
  }

  // Construir mapa de reintentos por factura
  const retryMap = new Map<string, number>()
  for (const retry of retries || []) {
    retryMap.set(retry.invoice_id, (retryMap.get(retry.invoice_id) || 0) + 1)
  }

  const errors = (rejectedInvoices || []).map(inv => ({
    invoiceId: inv.id,
    errorType: 'REJECTED',
    errorMessage: 'Comprobante rechazado por ARCA', // TODO: Almacenar mensaje de error real
    attemptCount: retryMap.get(inv.id) || 1,
    lastAttempt: new Date(inv.updated_at)
  }))

  // Calcular desglose por tipo de error
  const errorsByType = [
    {
      errorType: 'REJECTED',
      count: errors.length,
      percentage: 100
    }
  ]

  return {
    filters,
    errors,
    errorsByType
  }
}


/**
 * Exporta reporte en el formato especificado
 */
export async function exportReport(
  report: IssuedInvoicesReport | ByTypeReport | CancelledReport | ErrorReport,
  format: ExportFormat
): Promise<Buffer> {
  switch (format) {
    case 'CSV':
      return exportToCSV(report)
    case 'EXCEL':
      return exportToExcel(report)
    case 'PDF':
      return exportToPDF(report)
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

/**
 * Exporta reporte a CSV
 */
function exportToCSV(report: any): Buffer {
  // Implementación simple de CSV
  // TODO: Mejorar con biblioteca como papaparse
  let content = ''

  if ('invoices' in report) {
    // Reporte de facturas emitidas
    content = 'Tipo,Punto de Venta,Número,Fecha,Cliente,Total,Estado,CAE\n'
    for (const inv of report.invoices) {
      content += `${inv.invoiceType},${inv.pointOfSale},${inv.invoiceNumber},${inv.issueDate.toLocaleDateString()},${inv.customer.businessName},${inv.total},${inv.status},${inv.cae || 'N/A'}\n`
    }
  } else if ('breakdown' in report) {
    // Reporte por tipo
    content = 'Tipo de Comprobante,Cantidad,Total\n'
    for (const item of report.breakdown) {
      content += `${item.invoiceType},${item.count},${item.totalAmount}\n`
    }
  } else if ('cancelledInvoices' in report) {
    // Reporte de anulados
    content = 'Tipo,Número,Fecha Anulación,Anulado Por,Motivo\n'
    for (const item of report.cancelledInvoices) {
      content += `${item.invoice.invoiceType},${item.invoice.invoiceNumber},${item.cancellationDate.toLocaleDateString()},${item.cancelledBy},${item.cancellationReason}\n`
    }
  } else if ('errors' in report) {
    // Reporte de errores
    content = 'ID Factura,Tipo de Error,Mensaje,Intentos,Último Intento\n'
    for (const error of report.errors) {
      content += `${error.invoiceId},${error.errorType},${error.errorMessage},${error.attemptCount},${error.lastAttempt.toLocaleDateString()}\n`
    }
  }

  return Buffer.from(content, 'utf-8')
}

/**
 * Exporta reporte a Excel
 * TODO: Implementar usando biblioteca como exceljs
 */
function exportToExcel(report: any): Buffer {
  // Por ahora, retornar CSV como fallback
  return exportToCSV(report)
}

/**
 * Exporta reporte a PDF
 * TODO: Implementar usando biblioteca como pdf-lib o pdfkit
 */
function exportToPDF(report: any): Buffer {
  // Por ahora, retornar texto plano como fallback
  return exportToCSV(report)
}


// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Mapea un registro de base de datos a ElectronicInvoice
 */
function mapDatabaseToInvoice(row: any): ElectronicInvoice {
  return {
    id: row.id,
    companyId: row.company_id,
    saleId: row.sale_id,
    invoiceType: row.invoice_type as InvoiceType,
    pointOfSale: row.point_of_sale,
    invoiceNumber: row.invoice_number,
    issueDate: new Date(row.issue_date),
    customer: {
      cuitCuil: row.customer_cuit_cuil,
      documentType: row.customer_document_type,
      documentNumber: row.customer_document_number,
      fiscalCondition: row.customer_fiscal_condition,
      businessName: row.customer_business_name,
      fiscalAddress: row.customer_fiscal_address
    },
    items: [], // TODO: Cargar ítems si es necesario
    concept: row.concept,
    currency: row.currency,
    exchangeRate: row.exchange_rate,
    subtotal: row.subtotal,
    vatAmount: row.vat_amount,
    total: row.total,
    status: row.status,
    cae: row.cae,
    caeExpirationDate: row.cae_expiration_date ? new Date(row.cae_expiration_date) : undefined,
    qrCode: row.qr_code,
    pdfUrl: row.pdf_url,
    relatedInvoiceId: row.related_invoice_id,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at)
  }
}

/**
 * Calcula el desglose de IVA desde un conjunto de facturas
 */
function calculateVATBreakdownFromInvoices(invoices: ElectronicInvoice[]): VATBreakdown[] {
  const breakdown = new Map<number, { taxableBase: number; vatAmount: number }>()

  for (const invoice of invoices) {
    // Por ahora, agrupar todo el IVA de cada factura
    // TODO: Obtener desglose real desde electronic_invoice_vat_breakdown
    const rate = invoice.vatAmount > 0 ? 21 : 0 // Simplificación
    const existing = breakdown.get(rate) || { taxableBase: 0, vatAmount: 0 }
    
    breakdown.set(rate, {
      taxableBase: existing.taxableBase + invoice.subtotal,
      vatAmount: existing.vatAmount + invoice.vatAmount
    })
  }

  return Array.from(breakdown.entries()).map(([rate, data]) => ({
    rate: rate as VATRate,
    taxableBase: data.taxableBase,
    vatAmount: data.vatAmount
  }))
}
