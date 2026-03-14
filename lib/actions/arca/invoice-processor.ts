'use server'

import { createClient } from '@/lib/supabase/server'
import {
  ProcessResult,
  CancelResult,
  InvoiceStatus,
  InvoiceType,
  InvoiceRequest,
  InvoiceConcept
} from '@/lib/types/arca'
import { createARCAClient } from './api-client'
import { scheduleRetry, cancelRetries } from './retry-manager'

// ============================================================================
// Invoice Processing
// ============================================================================

/**
 * Processes an invoice by sending it to ARCA for authorization
 * Implements state machine: DRAFT → PENDING → AUTHORIZED/REJECTED
 * 
 * @param invoiceId - Invoice ID to process
 * @returns Process result with CAE or error
 */
export async function processInvoice(
  invoiceId: string
): Promise<ProcessResult> {
  try {
    const supabase = await createClient()
    
    // Get invoice with items
    const { data: invoice, error: invoiceError } = await supabase
      .from('electronic_invoices')
      .select(`
        *,
        items:electronic_invoice_items(*)
      `)
      .eq('id', invoiceId)
      .single()
    
    if (invoiceError || !invoice) {
      return {
        success: false,
        invoiceId,
        errors: ['No se encontró el comprobante'],
        retryable: false
      }
    }

    // Validate invoice is in DRAFT status
    if (invoice.status !== InvoiceStatus.DRAFT) {
      return {
        success: false,
        invoiceId,
        errors: [`El comprobante debe estar en estado DRAFT para ser procesado. Estado actual: ${invoice.status}`],
        retryable: false
      }
    }
    
    // Update status to PENDING
    await supabase
      .from('electronic_invoices')
      .update({ status: InvoiceStatus.PENDING })
      .eq('id', invoiceId)
    
    // Create ARCA client
    const clientResult = await createARCAClient(invoice.company_id)
    if (!clientResult.success || !clientResult.client) {
      // Schedule retry for communication errors
      await scheduleRetry(invoiceId, 1)
      
      return {
        success: false,
        invoiceId,
        errors: [clientResult.error || 'Error al crear cliente de ARCA'],
        retryable: true
      }
    }
    
    const client = clientResult.client

    // Prepare invoice request
    const invoiceRequest: InvoiceRequest = {
      pointOfSale: invoice.point_of_sale,
      invoiceType: invoice.invoice_type as InvoiceType,
      invoiceNumber: invoice.invoice_number,
      issueDate: new Date(invoice.issue_date),
      customer: {
        cuitCuil: invoice.customer_cuit_cuil,
        documentType: invoice.customer_document_type,
        documentNumber: invoice.customer_document_number,
        fiscalCondition: invoice.customer_fiscal_condition as any,
        businessName: invoice.customer_business_name,
        fiscalAddress: invoice.customer_fiscal_address
      },
      items: invoice.items.map((item: any) => ({
        productId: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        vatRate: item.vat_rate,
        subtotal: item.subtotal,
        vatAmount: item.vat_amount,
        total: item.total
      })),
      concept: invoice.concept as InvoiceConcept,
      currency: invoice.currency,
      exchangeRate: invoice.exchange_rate
    }

    // Request CAE from ARCA
    const caeResult = await client.requestCAE(invoiceRequest)
    
    if (!caeResult.success || !caeResult.response) {
      // Communication error - schedule retry
      await scheduleRetry(invoiceId, 1)
      
      return {
        success: false,
        invoiceId,
        errors: [caeResult.error || 'Error al solicitar CAE'],
        retryable: true
      }
    }
    
    const caeResponse = caeResult.response
    
    if (!caeResponse.success) {
      // Business logic error - mark as REJECTED
      await supabase
        .from('electronic_invoices')
        .update({ 
          status: InvoiceStatus.REJECTED,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
      
      return {
        success: false,
        invoiceId,
        errors: caeResponse.errors || ['Comprobante rechazado por ARCA'],
        retryable: false
      }
    }

    // Success - update invoice with CAE
    await supabase
      .from('electronic_invoices')
      .update({
        status: InvoiceStatus.AUTHORIZED,
        cae: caeResponse.cae,
        cae_expiration_date: caeResponse.caeExpirationDate.toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
    
    // Cancel any pending retries
    await cancelRetries(invoiceId)
    
    return {
      success: true,
      invoiceId,
      cae: caeResponse.cae,
      caeExpirationDate: caeResponse.caeExpirationDate,
      retryable: false
    }
  } catch (error) {
    console.error('Error in processInvoice:', error)
    
    // Schedule retry for unexpected errors
    await scheduleRetry(invoiceId, 1)
    
    return {
      success: false,
      invoiceId,
      errors: [error instanceof Error ? error.message : 'Error desconocido al procesar comprobante'],
      retryable: true
    }
  }
}

/**
 * Retries a failed invoice
 * Called by retry manager or manually by user
 * 
 * @param invoiceId - Invoice ID to retry
 * @returns Process result
 */
export async function retryInvoice(
  invoiceId: string
): Promise<ProcessResult> {
  try {
    const supabase = await createClient()
    
    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('electronic_invoices')
      .select('status')
      .eq('id', invoiceId)
      .single()
    
    if (invoiceError || !invoice) {
      return {
        success: false,
        invoiceId,
        errors: ['No se encontró el comprobante'],
        retryable: false
      }
    }
    
    // Reset to DRAFT if REJECTED or PENDING
    if (invoice.status === InvoiceStatus.REJECTED || invoice.status === InvoiceStatus.PENDING) {
      await supabase
        .from('electronic_invoices')
        .update({ status: InvoiceStatus.DRAFT })
        .eq('id', invoiceId)
    }
    
    // Process the invoice
    return await processInvoice(invoiceId)
  } catch (error) {
    console.error('Error in retryInvoice:', error)
    return {
      success: false,
      invoiceId,
      errors: [error instanceof Error ? error.message : 'Error desconocido al reintentar'],
      retryable: true
    }
  }
}

// ============================================================================
// Invoice Cancellation
// ============================================================================

/**
 * Cancels (anula) an authorized invoice
 * 
 * @param invoiceId - Invoice ID to cancel
 * @param reason - Reason for cancellation
 * @param userId - User ID performing the cancellation
 * @returns Cancellation result
 */
export async function cancelInvoice(
  invoiceId: string,
  reason: string,
  userId: string
): Promise<CancelResult> {
  try {
    const supabase = await createClient()
    
    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('electronic_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()
    
    if (invoiceError || !invoice) {
      return {
        success: false,
        invoiceId,
        errors: ['No se encontró el comprobante']
      }
    }
    
    // Validate invoice is AUTHORIZED
    if (invoice.status !== InvoiceStatus.AUTHORIZED) {
      return {
        success: false,
        invoiceId,
        errors: [`Solo se pueden anular comprobantes autorizados. Estado actual: ${invoice.status}`]
      }
    }

    // Check if already cancelled
    if (invoice.status === InvoiceStatus.CANCELLED) {
      return {
        success: false,
        invoiceId,
        errors: ['El comprobante ya está anulado']
      }
    }
    
    // Check CAE expiration
    if (invoice.cae_expiration_date) {
      const expirationDate = new Date(invoice.cae_expiration_date)
      if (expirationDate < new Date()) {
        // Warning but allow cancellation
        console.warn(`Attempting to cancel invoice with expired CAE: ${invoiceId}`)
      }
    }
    
    // Create ARCA client
    const clientResult = await createARCAClient(invoice.company_id)
    if (!clientResult.success || !clientResult.client) {
      return {
        success: false,
        invoiceId,
        errors: [clientResult.error || 'Error al crear cliente de ARCA']
      }
    }
    
    const client = clientResult.client
    
    // Cancel in ARCA
    const cancelResult = await client.cancelInvoice(
      invoice.cae,
      invoice.invoice_number,
      invoice.point_of_sale,
      invoice.invoice_type as InvoiceType
    )

    if (!cancelResult.success || !cancelResult.response) {
      return {
        success: false,
        invoiceId,
        errors: [cancelResult.error || 'Error al anular comprobante en ARCA']
      }
    }
    
    if (!cancelResult.response.success) {
      return {
        success: false,
        invoiceId,
        errors: cancelResult.response.errors || ['Error al anular comprobante']
      }
    }
    
    // Update invoice status to CANCELLED
    const cancellationDate = new Date()
    await supabase
      .from('electronic_invoices')
      .update({
        status: InvoiceStatus.CANCELLED,
        updated_at: cancellationDate.toISOString()
      })
      .eq('id', invoiceId)
    
    // Log cancellation in audit (would be implemented in audit-logger)
    // await logOperation({
    //   companyId: invoice.company_id,
    //   userId,
    //   operationType: OperationType.CANCEL,
    //   entityType: EntityType.INVOICE,
    //   entityId: invoiceId,
    //   timestamp: cancellationDate,
    //   details: { reason },
    //   success: true
    // })
    
    return {
      success: true,
      invoiceId,
      cancellationDate
    }
  } catch (error) {
    console.error('Error in cancelInvoice:', error)
    return {
      success: false,
      invoiceId,
      errors: [error instanceof Error ? error.message : 'Error desconocido al anular comprobante']
    }
  }
}

// ============================================================================
// Invoice Status Synchronization
// ============================================================================

/**
 * Synchronizes invoice status with ARCA
 * Queries ARCA for current status and updates local database
 * 
 * @param invoiceId - Invoice ID to sync
 * @returns Updated invoice status
 */
export async function syncInvoiceStatus(
  invoiceId: string
): Promise<{ success: boolean; status?: InvoiceStatus; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('electronic_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()
    
    if (invoiceError || !invoice) {
      return {
        success: false,
        error: 'No se encontró el comprobante'
      }
    }
    
    // Only sync if invoice has CAE
    if (!invoice.cae) {
      return {
        success: false,
        error: 'El comprobante no tiene CAE para sincronizar'
      }
    }
    
    // Create ARCA client
    const clientResult = await createARCAClient(invoice.company_id)
    if (!clientResult.success || !clientResult.client) {
      return {
        success: false,
        error: clientResult.error || 'Error al crear cliente de ARCA'
      }
    }
    
    const client = clientResult.client

    // Query status from ARCA
    const statusResult = await client.queryInvoiceStatus(
      invoice.cae,
      invoice.invoice_number,
      invoice.point_of_sale,
      invoice.invoice_type as InvoiceType
    )
    
    if (!statusResult.success || !statusResult.status) {
      return {
        success: false,
        error: statusResult.error || 'Error al consultar estado en ARCA'
      }
    }
    
    const arcaStatus = statusResult.status
    
    // Determine new status
    let newStatus: InvoiceStatus = invoice.status
    
    if (arcaStatus.cancelled) {
      newStatus = InvoiceStatus.CANCELLED
    } else if (arcaStatus.authorized) {
      newStatus = InvoiceStatus.AUTHORIZED
    } else {
      newStatus = InvoiceStatus.REJECTED
    }
    
    // Update if status changed
    if (newStatus !== invoice.status) {
      await supabase
        .from('electronic_invoices')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
    }
    
    return {
      success: true,
      status: newStatus
    }
  } catch (error) {
    console.error('Error in syncInvoiceStatus:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al sincronizar estado'
    }
  }
}
