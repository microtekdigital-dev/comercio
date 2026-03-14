'use server'

import { createClient } from '@/lib/supabase/server'
import {
  InvoiceType,
  FiscalCondition,
  VATRate,
  InvoiceConcept,
  ElectronicInvoice,
  InvoiceItem,
  VATBreakdown,
  InvoiceStatus
} from '@/lib/types/arca'
import { getNextNumber } from './sequences'

// ============================================================================
// Invoice Type Determination
// ============================================================================

/**
 * Determines the invoice type based on customer's fiscal condition
 * 
 * Rules:
 * - Responsable Inscripto → Factura A
 * - Consumidor Final → Factura B
 * - Monotributista → Factura C
 * - Exento → Factura A
 * 
 * @param fiscalCondition - Customer's fiscal condition
 * @returns Invoice type
 */
export function determineInvoiceType(fiscalCondition: FiscalCondition): InvoiceType {
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

// ============================================================================
// VAT Calculations
// ============================================================================

/**
 * Calculates VAT breakdown by rate for invoice items
 * Groups items by VAT rate and sums up taxable base and VAT amount
 * 
 * @param items - Invoice items
 * @param invoiceType - Type of invoice (affects VAT calculation)
 * @returns VAT breakdown by rate
 */
export function calculateVATByRate(
  items: InvoiceItem[],
  invoiceType: InvoiceType
): VATBreakdown[] {
  // For Factura B and C, VAT is included in the price (not discriminated)
  const shouldDiscriminateVAT = invoiceType === InvoiceType.FACTURA_A ||
                                 invoiceType === InvoiceType.NOTA_CREDITO_A ||
                                 invoiceType === InvoiceType.NOTA_DEBITO_A
  
  if (!shouldDiscriminateVAT) {
    return []
  }
  
  // Group by VAT rate
  const vatMap = new Map<number, { taxableBase: number; vatAmount: number }>()
  
  for (const item of items) {
    const rate = item.vatRate
    const existing = vatMap.get(rate) || { taxableBase: 0, vatAmount: 0 }
    
    vatMap.set(rate, {
      taxableBase: existing.taxableBase + item.subtotal,
      vatAmount: existing.vatAmount + item.vatAmount
    })
  }
  
  // Convert to array
  const breakdown: VATBreakdown[] = []
  vatMap.forEach((value, rate) => {
    breakdown.push({
      rate: rate as VATRate,
      taxableBase: Math.round(value.taxableBase * 100) / 100,
      vatAmount: Math.round(value.vatAmount * 100) / 100
    })
  })
  
  // Sort by rate descending
  breakdown.sort((a, b) => b.rate - a.rate)
  
  return breakdown
}

/**
 * Calculates item totals including VAT
 * 
 * @param quantity - Item quantity
 * @param unitPrice - Unit price
 * @param vatRate - VAT rate
 * @param invoiceType - Type of invoice
 * @returns Calculated subtotal, VAT amount, and total
 */
function calculateItemTotals(
  quantity: number,
  unitPrice: number,
  vatRate: VATRate,
  invoiceType: InvoiceType
): { subtotal: number; vatAmount: number; total: number } {
  const subtotal = Math.round(quantity * unitPrice * 100) / 100
  
  // For Factura A, VAT is discriminated (added on top)
  // For Factura B and C, VAT is included in the price
  const shouldDiscriminateVAT = invoiceType === InvoiceType.FACTURA_A ||
                                 invoiceType === InvoiceType.NOTA_CREDITO_A ||
                                 invoiceType === InvoiceType.NOTA_DEBITO_A
  
  let vatAmount: number
  let total: number
  
  if (shouldDiscriminateVAT) {
    vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100
    total = subtotal + vatAmount
  } else {
    // VAT is included in the price
    vatAmount = 0
    total = subtotal
  }
  
  return { subtotal, vatAmount, total }
}

// ============================================================================
// Invoice Generation
// ============================================================================

/**
 * Generates an electronic invoice from a sale
 * 
 * @param saleId - Sale ID
 * @param userId - User ID generating the invoice
 * @returns Generated invoice or error
 */
export async function generateInvoiceFromSale(
  saleId: string,
  userId: string
): Promise<{ success: boolean; invoice?: ElectronicInvoice; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get sale with customer and items
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select(`
        *,
        customer:customers(*),
        items:sale_items(*)
      `)
      .eq('id', saleId)
      .single()
    
    if (saleError || !sale) {
      return {
        success: false,
        error: 'No se encontró la venta'
      }
    }
    
    // Validate customer has fiscal data
    if (!sale.customer) {
      return {
        success: false,
        error: 'La venta no tiene un cliente asociado'
      }
    }
    
    // Check if customer has required fiscal data
    if (!sale.customer.fiscal_condition) {
      return {
        success: false,
        error: 'El cliente no tiene condición fiscal configurada. Por favor, complete los datos fiscales del cliente antes de facturar.'
      }
    }
    
    if (!sale.customer.document_type || !sale.customer.document_number) {
      return {
        success: false,
        error: 'El cliente no tiene tipo y número de documento configurados. Por favor, complete los datos fiscales del cliente antes de facturar.'
      }
    }
    
    if (!sale.customer.fiscal_address) {
      return {
        success: false,
        error: 'El cliente no tiene domicilio fiscal configurado. Por favor, complete los datos fiscales del cliente antes de facturar.'
      }
    }
    
    // Get company configuration
    const { data: config, error: configError } = await supabase
      .from('arca_configurations')
      .select('*')
      .eq('company_id', sale.company_id)
      .single()
    
    if (configError || !config) {
      return {
        success: false,
        error: 'No se encontró configuración de ARCA para esta empresa. Por favor, configure ARCA antes de generar facturas.'
      }
    }
    
    // Determine invoice type
    const invoiceType = determineInvoiceType(sale.customer.fiscal_condition as FiscalCondition)
    
    // Get next invoice number
    const sequenceResult = await getNextNumber(
      sale.company_id,
      config.point_of_sale,
      invoiceType
    )
    
    if (!sequenceResult.success || !sequenceResult.number) {
      return {
        success: false,
        error: sequenceResult.error || 'Error al obtener número de comprobante'
      }
    }
    
    const invoiceNumber = sequenceResult.number
    
    // Convert sale items to invoice items
    const invoiceItems: InvoiceItem[] = sale.items.map((item: any) => {
      const vatRate = item.vat_rate || VATRate.VAT_21
      const totals = calculateItemTotals(
        item.quantity,
        item.unit_price,
        vatRate,
        invoiceType
      )
      
      return {
        productId: item.product_id,
        description: item.product_name || item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        vatRate,
        subtotal: totals.subtotal,
        vatAmount: totals.vatAmount,
        total: totals.total
      }
    })
    
    // Calculate totals
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.subtotal, 0)
    const vatAmount = invoiceItems.reduce((sum, item) => sum + item.vatAmount, 0)
    const total = invoiceItems.reduce((sum, item) => sum + item.total, 0)
    
    // Create invoice record
    const invoice: Partial<ElectronicInvoice> = {
      companyId: sale.company_id,
      saleId: sale.id,
      invoiceType,
      pointOfSale: config.point_of_sale,
      invoiceNumber,
      issueDate: new Date(),
      customer: {
        cuitCuil: sale.customer.cuit_cuil,
        documentType: sale.customer.document_type,
        documentNumber: sale.customer.document_number,
        fiscalCondition: sale.customer.fiscal_condition as FiscalCondition,
        businessName: sale.customer.business_name || sale.customer.name,
        fiscalAddress: sale.customer.fiscal_address
      },
      items: invoiceItems,
      concept: InvoiceConcept.PRODUCTS,
      currency: sale.currency || 'ARS',
      exchangeRate: sale.exchange_rate,
      subtotal: Math.round(subtotal * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      status: InvoiceStatus.DRAFT,
      createdBy: userId,
      createdAt: new Date()
    }
    
    // Insert into database
    const { data: insertedInvoice, error: insertError } = await supabase
      .from('electronic_invoices')
      .insert({
        company_id: invoice.companyId,
        sale_id: invoice.saleId,
        invoice_type: invoice.invoiceType,
        point_of_sale: invoice.pointOfSale,
        invoice_number: invoice.invoiceNumber,
        issue_date: invoice.issueDate?.toISOString().split('T')[0],
        customer_cuit_cuil: invoice.customer?.cuitCuil,
        customer_document_type: invoice.customer?.documentType,
        customer_document_number: invoice.customer?.documentNumber,
        customer_fiscal_condition: invoice.customer?.fiscalCondition,
        customer_business_name: invoice.customer?.businessName,
        customer_fiscal_address: invoice.customer?.fiscalAddress,
        concept: invoice.concept,
        currency: invoice.currency,
        exchange_rate: invoice.exchangeRate,
        subtotal: invoice.subtotal,
        vat_amount: invoice.vatAmount,
        total: invoice.total,
        status: invoice.status,
        created_by: invoice.createdBy
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Error inserting invoice:', insertError)
      return {
        success: false,
        error: 'Error al crear el comprobante en la base de datos'
      }
    }
    
    // Insert invoice items
    const itemsToInsert = invoiceItems.map(item => ({
      invoice_id: insertedInvoice.id,
      product_id: item.productId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      vat_rate: item.vatRate,
      subtotal: item.subtotal,
      vat_amount: item.vatAmount,
      total: item.total
    }))
    
    const { error: itemsError } = await supabase
      .from('electronic_invoice_items')
      .insert(itemsToInsert)
    
    if (itemsError) {
      console.error('Error inserting invoice items:', itemsError)
      // Continue anyway, items can be added later
    }
    
    // Insert VAT breakdown (only for Factura A)
    const vatBreakdown = calculateVATByRate(invoiceItems, invoiceType)
    if (vatBreakdown.length > 0) {
      const breakdownToInsert = vatBreakdown.map(vat => ({
        invoice_id: insertedInvoice.id,
        vat_rate: vat.rate,
        taxable_base: vat.taxableBase,
        vat_amount: vat.vatAmount
      }))
      
      const { error: breakdownError } = await supabase
        .from('electronic_invoice_vat_breakdown')
        .insert(breakdownToInsert)
      
      if (breakdownError) {
        console.error('Error inserting VAT breakdown:', breakdownError)
        // Continue anyway
      }
    }
    
    return {
      success: true,
      invoice: {
        ...invoice,
        id: insertedInvoice.id
      } as ElectronicInvoice
    }
  } catch (error) {
    console.error('Error in generateInvoiceFromSale:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al generar factura'
    }
  }
}

/**
 * Generates a credit note for an existing invoice
 * 
 * @param originalInvoiceId - Original invoice ID
 * @param amount - Credit amount (partial or total)
 * @param reason - Reason for the credit note
 * @param userId - User ID generating the note
 * @returns Generated credit note or error
 */
export async function generateCreditNote(
  originalInvoiceId: string,
  amount: number,
  reason: string,
  userId: string
): Promise<{ success: boolean; invoice?: ElectronicInvoice; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get original invoice
    const { data: originalInvoice, error: invoiceError } = await supabase
      .from('electronic_invoices')
      .select('*')
      .eq('id', originalInvoiceId)
      .single()
    
    if (invoiceError || !originalInvoice) {
      return {
        success: false,
        error: 'No se encontró el comprobante original'
      }
    }
    
    // Validate invoice is authorized
    if (originalInvoice.status !== InvoiceStatus.AUTHORIZED) {
      return {
        success: false,
        error: 'Solo se pueden generar notas de crédito para comprobantes autorizados'
      }
    }
    
    // Determine credit note type based on original invoice type
    let creditNoteType: InvoiceType
    if (originalInvoice.invoice_type === InvoiceType.FACTURA_A) {
      creditNoteType = InvoiceType.NOTA_CREDITO_A
    } else if (originalInvoice.invoice_type === InvoiceType.FACTURA_B) {
      creditNoteType = InvoiceType.NOTA_CREDITO_B
    } else if (originalInvoice.invoice_type === InvoiceType.FACTURA_C) {
      creditNoteType = InvoiceType.NOTA_CREDITO_C
    } else {
      return {
        success: false,
        error: 'El tipo de comprobante original no permite generar notas de crédito'
      }
    }
    
    // Get next number for credit note
    const sequenceResult = await getNextNumber(
      originalInvoice.company_id,
      originalInvoice.point_of_sale,
      creditNoteType
    )
    
    if (!sequenceResult.success || !sequenceResult.number) {
      return {
        success: false,
        error: sequenceResult.error || 'Error al obtener número de nota de crédito'
      }
    }
    
    // Calculate proportional amounts
    const proportion = amount / originalInvoice.total
    const subtotal = Math.round(originalInvoice.subtotal * proportion * 100) / 100
    const vatAmount = Math.round(originalInvoice.vat_amount * proportion * 100) / 100
    
    // Create credit note
    const { data: creditNote, error: insertError } = await supabase
      .from('electronic_invoices')
      .insert({
        company_id: originalInvoice.company_id,
        invoice_type: creditNoteType,
        point_of_sale: originalInvoice.point_of_sale,
        invoice_number: sequenceResult.number,
        issue_date: new Date().toISOString().split('T')[0],
        customer_cuit_cuil: originalInvoice.customer_cuit_cuil,
        customer_document_type: originalInvoice.customer_document_type,
        customer_document_number: originalInvoice.customer_document_number,
        customer_fiscal_condition: originalInvoice.customer_fiscal_condition,
        customer_business_name: originalInvoice.customer_business_name,
        customer_fiscal_address: originalInvoice.customer_fiscal_address,
        concept: originalInvoice.concept,
        currency: originalInvoice.currency,
        exchange_rate: originalInvoice.exchange_rate,
        subtotal,
        vat_amount: vatAmount,
        total: amount,
        status: InvoiceStatus.DRAFT,
        related_invoice_id: originalInvoiceId,
        created_by: userId
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Error creating credit note:', insertError)
      return {
        success: false,
        error: 'Error al crear la nota de crédito'
      }
    }
    
    return {
      success: true,
      invoice: creditNote as any
    }
  } catch (error) {
    console.error('Error in generateCreditNote:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al generar nota de crédito'
    }
  }
}

/**
 * Generates a debit note for an existing invoice
 * 
 * @param originalInvoiceId - Original invoice ID
 * @param amount - Debit amount
 * @param reason - Reason for the debit note
 * @param userId - User ID generating the note
 * @returns Generated debit note or error
 */
export async function generateDebitNote(
  originalInvoiceId: string,
  amount: number,
  reason: string,
  userId: string
): Promise<{ success: boolean; invoice?: ElectronicInvoice; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get original invoice
    const { data: originalInvoice, error: invoiceError } = await supabase
      .from('electronic_invoices')
      .select('*')
      .eq('id', originalInvoiceId)
      .single()
    
    if (invoiceError || !originalInvoice) {
      return {
        success: false,
        error: 'No se encontró el comprobante original'
      }
    }
    
    // Validate invoice is authorized
    if (originalInvoice.status !== InvoiceStatus.AUTHORIZED) {
      return {
        success: false,
        error: 'Solo se pueden generar notas de débito para comprobantes autorizados'
      }
    }
    
    // Determine debit note type based on original invoice type
    let debitNoteType: InvoiceType
    if (originalInvoice.invoice_type === InvoiceType.FACTURA_A) {
      debitNoteType = InvoiceType.NOTA_DEBITO_A
    } else if (originalInvoice.invoice_type === InvoiceType.FACTURA_B) {
      debitNoteType = InvoiceType.NOTA_DEBITO_B
    } else if (originalInvoice.invoice_type === InvoiceType.FACTURA_C) {
      debitNoteType = InvoiceType.NOTA_DEBITO_C
    } else {
      return {
        success: false,
        error: 'El tipo de comprobante original no permite generar notas de débito'
      }
    }
    
    // Get next number for debit note
    const sequenceResult = await getNextNumber(
      originalInvoice.company_id,
      originalInvoice.point_of_sale,
      debitNoteType
    )
    
    if (!sequenceResult.success || !sequenceResult.number) {
      return {
        success: false,
        error: sequenceResult.error || 'Error al obtener número de nota de débito'
      }
    }
    
    // Calculate VAT for debit amount
    const proportion = amount / (originalInvoice.total || 1)
    const subtotal = Math.round(originalInvoice.subtotal * proportion * 100) / 100
    const vatAmount = Math.round(originalInvoice.vat_amount * proportion * 100) / 100
    
    // Create debit note
    const { data: debitNote, error: insertError } = await supabase
      .from('electronic_invoices')
      .insert({
        company_id: originalInvoice.company_id,
        invoice_type: debitNoteType,
        point_of_sale: originalInvoice.point_of_sale,
        invoice_number: sequenceResult.number,
        issue_date: new Date().toISOString().split('T')[0],
        customer_cuit_cuil: originalInvoice.customer_cuit_cuil,
        customer_document_type: originalInvoice.customer_document_type,
        customer_document_number: originalInvoice.customer_document_number,
        customer_fiscal_condition: originalInvoice.customer_fiscal_condition,
        customer_business_name: originalInvoice.customer_business_name,
        customer_fiscal_address: originalInvoice.customer_fiscal_address,
        concept: originalInvoice.concept,
        currency: originalInvoice.currency,
        exchange_rate: originalInvoice.exchange_rate,
        subtotal,
        vat_amount: vatAmount,
        total: amount,
        status: InvoiceStatus.DRAFT,
        related_invoice_id: originalInvoiceId,
        created_by: userId
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Error creating debit note:', insertError)
      return {
        success: false,
        error: 'Error al crear la nota de débito'
      }
    }
    
    return {
      success: true,
      invoice: debitNote as any
    }
  } catch (error) {
    console.error('Error in generateDebitNote:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al generar nota de débito'
    }
  }
}
