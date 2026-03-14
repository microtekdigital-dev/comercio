'use server'

import type { ElectronicInvoice, InvoiceItem, VATBreakdown, VATRate } from '@/lib/types/arca'

export interface PDFDocument {
  buffer: Buffer
  filename: string
  mimeType: string
}

export interface PDFLayout {
  header: HeaderSection
  customerData: CustomerSection
  items: ItemsSection
  totals: TotalsSection
  fiscalData: FiscalSection
  qrCode: QRSection
}

interface HeaderSection {
  companyName: string
  companyCUIT: string
  companyAddress: string
  invoiceType: string
  pointOfSale: string
  invoiceNumber: string
  issueDate: string
}

interface CustomerSection {
  businessName: string
  cuitCuil: string
  fiscalCondition: string
  fiscalAddress: string
}

interface ItemsSection {
  items: InvoiceItem[]
}

interface TotalsSection {
  subtotal: number
  vatAmount: number
  total: number
  vatBreakdown: VATBreakdown[]
}

interface FiscalSection {
  cae: string
  caeExpirationDate: string
}

interface QRSection {
  qrData: string
}

/**
 * Genera un PDF de factura electrónica
 * TODO: Implementar usando biblioteca como pdf-lib o pdfkit
 */
export async function generateInvoicePDF(
  invoice: ElectronicInvoice
): Promise<PDFDocument> {
  // Formatear el layout según especificaciones ARCA
  const layout = await formatARCACompliant(invoice)

  // TODO: Generar PDF real usando biblioteca de PDF
  // Por ahora, generar un documento de texto simple como placeholder
  const content = generateTextContent(layout)
  const buffer = Buffer.from(content, 'utf-8')

  const filename = `factura_${invoice.invoiceType}_${invoice.pointOfSale.toString().padStart(4, '0')}_${invoice.invoiceNumber.toString().padStart(8, '0')}.pdf`

  return {
    buffer,
    filename,
    mimeType: 'application/pdf'
  }
}


/**
 * Incluye código QR de ARCA en el PDF
 * TODO: Implementar generación de QR usando biblioteca como qrcode
 */
export function embedQRCode(pdf: PDFDocument, qrData: string): PDFDocument {
  // TODO: Generar imagen QR y embeber en el PDF
  // Por ahora, retornar el PDF sin modificar
  return pdf
}

/**
 * Formatea el comprobante según especificaciones de ARCA
 */
export async function formatARCACompliant(invoice: ElectronicInvoice): Promise<PDFLayout> {
  // Calcular desglose de IVA desde los ítems
  const vatBreakdown = calculateVATBreakdown(invoice.items)

  return {
    header: {
      companyName: 'Empresa', // TODO: Obtener de company_settings
      companyCUIT: '', // TODO: Obtener de arca_configurations
      companyAddress: '', // TODO: Obtener de company_settings
      invoiceType: invoice.invoiceType,
      pointOfSale: invoice.pointOfSale.toString().padStart(4, '0'),
      invoiceNumber: invoice.invoiceNumber.toString().padStart(8, '0'),
      issueDate: invoice.issueDate.toLocaleDateString('es-AR')
    },
    customerData: {
      businessName: invoice.customer.businessName,
      cuitCuil: invoice.customer.cuitCuil || 'N/A',
      fiscalCondition: invoice.customer.fiscalCondition,
      fiscalAddress: invoice.customer.fiscalAddress
    },
    items: {
      items: invoice.items
    },
    totals: {
      subtotal: invoice.subtotal,
      vatAmount: invoice.vatAmount,
      total: invoice.total,
      vatBreakdown
    },
    fiscalData: {
      cae: invoice.cae || 'PENDIENTE',
      caeExpirationDate: invoice.caeExpirationDate 
        ? invoice.caeExpirationDate.toLocaleDateString('es-AR')
        : 'PENDIENTE'
    },
    qrCode: {
      qrData: invoice.qrCode || ''
    }
  }
}

/**
 * Calcula el desglose de IVA por alícuota desde los ítems
 */
function calculateVATBreakdown(items: InvoiceItem[]): VATBreakdown[] {
  const breakdown = new Map<number, { taxableBase: number; vatAmount: number }>()

  for (const item of items) {
    const rate = item.vatRate
    const existing = breakdown.get(rate) || { taxableBase: 0, vatAmount: 0 }
    
    breakdown.set(rate, {
      taxableBase: existing.taxableBase + item.subtotal,
      vatAmount: existing.vatAmount + item.vatAmount
    })
  }

  return Array.from(breakdown.entries()).map(([rate, data]) => ({
    rate: rate as VATRate,
    taxableBase: data.taxableBase,
    vatAmount: data.vatAmount
  }))
}

/**
 * Genera contenido de texto para el PDF (placeholder)
 */
function generateTextContent(layout: PDFLayout): string {
  const lines: string[] = []

  // Encabezado
  lines.push('='.repeat(80))
  lines.push(`COMPROBANTE ELECTRÓNICO - ${layout.header.invoiceType}`)
  lines.push('='.repeat(80))
  lines.push('')
  lines.push(`Empresa: ${layout.header.companyName}`)
  lines.push(`CUIT: ${layout.header.companyCUIT}`)
  lines.push(`Dirección: ${layout.header.companyAddress}`)
  lines.push('')
  lines.push(`Punto de Venta: ${layout.header.pointOfSale}`)
  lines.push(`Número: ${layout.header.invoiceNumber}`)
  lines.push(`Fecha de Emisión: ${layout.header.issueDate}`)
  lines.push('')

  // Datos del cliente
  lines.push('-'.repeat(80))
  lines.push('DATOS DEL CLIENTE')
  lines.push('-'.repeat(80))
  lines.push(`Razón Social: ${layout.customerData.businessName}`)
  lines.push(`CUIT/CUIL: ${layout.customerData.cuitCuil}`)
  lines.push(`Condición Fiscal: ${layout.customerData.fiscalCondition}`)
  lines.push(`Domicilio Fiscal: ${layout.customerData.fiscalAddress}`)
  lines.push('')

  // Ítems
  lines.push('-'.repeat(80))
  lines.push('DETALLE DE ÍTEMS')
  lines.push('-'.repeat(80))
  lines.push(
    'Descripción'.padEnd(40) +
    'Cant.'.padStart(10) +
    'Precio Unit.'.padStart(15) +
    'Total'.padStart(15)
  )
  lines.push('-'.repeat(80))

  for (const item of layout.items.items) {
    lines.push(
      item.description.substring(0, 40).padEnd(40) +
      item.quantity.toFixed(2).padStart(10) +
      `$${item.unitPrice.toFixed(2)}`.padStart(15) +
      `$${item.total.toFixed(2)}`.padStart(15)
    )
  }

  lines.push('')

  // Totales
  lines.push('-'.repeat(80))
  lines.push('TOTALES')
  lines.push('-'.repeat(80))
  lines.push(`Subtotal: $${layout.totals.subtotal.toFixed(2)}`.padStart(80))
  
  if (layout.totals.vatBreakdown.length > 0) {
    lines.push('')
    lines.push('Desglose de IVA:')
    for (const vat of layout.totals.vatBreakdown) {
      lines.push(
        `  IVA ${vat.rate}%: $${vat.vatAmount.toFixed(2)} (Base: $${vat.taxableBase.toFixed(2)})`.padStart(80)
      )
    }
  }

  lines.push(`IVA Total: $${layout.totals.vatAmount.toFixed(2)}`.padStart(80))
  lines.push(`TOTAL: $${layout.totals.total.toFixed(2)}`.padStart(80))
  lines.push('')

  // Datos fiscales
  lines.push('-'.repeat(80))
  lines.push('DATOS FISCALES')
  lines.push('-'.repeat(80))
  lines.push(`CAE: ${layout.fiscalData.cae}`)
  lines.push(`Fecha de Vencimiento CAE: ${layout.fiscalData.caeExpirationDate}`)
  lines.push('')

  if (layout.qrCode.qrData) {
    lines.push('Código QR: [QR CODE PLACEHOLDER]')
    lines.push('')
  }

  lines.push('='.repeat(80))

  return lines.join('\n')
}
