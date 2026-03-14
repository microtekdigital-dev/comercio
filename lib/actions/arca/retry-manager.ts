'use server'

import { createClient } from '@/lib/supabase/server'
import { RetryResult } from '@/lib/types/arca'

// ============================================================================
// Constants
// ============================================================================

const MAX_RETRY_ATTEMPTS = 5
const BASE_DELAY_MS = 1000 // 1 second
const BACKOFF_MULTIPLIER = 2
const MAX_DELAY_MS = 16000 // 16 seconds

// ============================================================================
// Retry Calculation
// ============================================================================

/**
 * Calculates the next retry time using exponential backoff
 * 
 * Formula: delay = BASE_DELAY * (BACKOFF_MULTIPLIER ^ (attemptNumber - 1))
 * Sequence: 1s, 2s, 4s, 8s, 16s
 * 
 * @param attemptNumber - Current attempt number (1-based)
 * @returns Date for next retry
 */
export function calculateNextRetry(attemptNumber: number): Date {
  // Calculate delay: 1s, 2s, 4s, 8s, 16s
  const delay = Math.min(
    BASE_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, attemptNumber - 1),
    MAX_DELAY_MS
  )
  
  const nextRetry = new Date()
  nextRetry.setMilliseconds(nextRetry.getMilliseconds() + delay)
  
  return nextRetry
}

/**
 * Gets the delay in milliseconds for a given attempt number
 * 
 * @param attemptNumber - Current attempt number (1-based)
 * @returns Delay in milliseconds
 */
export function getRetryDelay(attemptNumber: number): number {
  return Math.min(
    BASE_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, attemptNumber - 1),
    MAX_DELAY_MS
  )
}

// ============================================================================
// Retry Scheduling
// ============================================================================

/**
 * Schedules a retry for a failed invoice
 * 
 * @param invoiceId - Invoice ID to retry
 * @param attemptNumber - Current attempt number
 * @returns Success status
 */
export async function scheduleRetry(
  invoiceId: string,
  attemptNumber: number
): Promise<{ success: boolean; error?: string; nextRetryAt?: Date }> {
  try {
    // Validate attempt number
    if (attemptNumber > MAX_RETRY_ATTEMPTS) {
      return {
        success: false,
        error: `Se alcanzó el límite máximo de ${MAX_RETRY_ATTEMPTS} reintentos`
      }
    }
    
    const supabase = await createClient()
    
    // Calculate next retry time
    const nextRetryAt = calculateNextRetry(attemptNumber)
    
    // Insert retry record
    const { error: insertError } = await supabase
      .from('arca_retry_queue')
      .insert({
        invoice_id: invoiceId,
        attempt_number: attemptNumber,
        scheduled_at: nextRetryAt.toISOString()
      })
    
    if (insertError) {
      console.error('Error scheduling retry:', insertError)
      return {
        success: false,
        error: 'Error al programar reintento'
      }
    }
    
    return {
      success: true,
      nextRetryAt
    }
  } catch (error) {
    console.error('Error in scheduleRetry:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al programar reintento'
    }
  }
}

/**
 * Cancels all pending retries for an invoice
 * 
 * @param invoiceId - Invoice ID
 * @returns Success status
 */
export async function cancelRetries(
  invoiceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Delete all pending retries (not yet processed)
    const { error: deleteError } = await supabase
      .from('arca_retry_queue')
      .delete()
      .eq('invoice_id', invoiceId)
      .is('processed_at', null)
    
    if (deleteError) {
      console.error('Error canceling retries:', deleteError)
      return {
        success: false,
        error: 'Error al cancelar reintentos'
      }
    }
    
    return {
      success: true
    }
  } catch (error) {
    console.error('Error in cancelRetries:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al cancelar reintentos'
    }
  }
}

// ============================================================================
// Retry Processing
// ============================================================================

/**
 * Processes pending retries that are due
 * This function should be called by a scheduled job
 * 
 * @returns Array of retry results
 */
export async function processRetries(): Promise<RetryResult[]> {
  try {
    const supabase = await createClient()
    
    // Get pending retries that are due
    const { data: pendingRetries, error: fetchError } = await supabase
      .from('arca_retry_queue')
      .select('*')
      .is('processed_at', null)
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(50) // Process in batches
    
    if (fetchError) {
      console.error('Error fetching pending retries:', fetchError)
      return []
    }
    
    if (!pendingRetries || pendingRetries.length === 0) {
      return []
    }
    
    const results: RetryResult[] = []
    
    // Process each retry
    for (const retry of pendingRetries) {
      try {
        // Note: This will be implemented when invoice-processor is created
        // For now, we'll mark as placeholder
        const result = { success: false, retryable: true, errors: ['Invoice processor not yet implemented'] }
        
        // TODO: Uncomment when invoice-processor is implemented
        // const { retryInvoice } = await import('./invoice-processor')
        // const result = await retryInvoice(retry.invoice_id)
        
        // Mark retry as processed
        await supabase
          .from('arca_retry_queue')
          .update({
            processed_at: new Date().toISOString(),
            success: result.success,
            error_message: result.errors?.join(', ')
          })
          .eq('id', retry.id)
        
        // Prepare result
        const retryResult: RetryResult = {
          invoiceId: retry.invoice_id,
          attemptNumber: retry.attempt_number,
          success: result.success
        }
        
        // If failed and under max attempts, schedule next retry
        if (!result.success && result.retryable && retry.attempt_number < MAX_RETRY_ATTEMPTS) {
          const nextAttempt = retry.attempt_number + 1
          const scheduleResult = await scheduleRetry(retry.invoice_id, nextAttempt)
          
          if (scheduleResult.success) {
            retryResult.nextRetryAt = scheduleResult.nextRetryAt
          }
        }
        
        // If failed after max attempts, notify user
        if (!result.success && retry.attempt_number >= MAX_RETRY_ATTEMPTS) {
          await notifyRetryExhausted(retry.invoice_id)
        }
        
        results.push(retryResult)
      } catch (error) {
        console.error(`Error processing retry for invoice ${retry.invoice_id}:`, error)
        
        // Mark as processed with error
        await supabase
          .from('arca_retry_queue')
          .update({
            processed_at: new Date().toISOString(),
            success: false,
            error_message: error instanceof Error ? error.message : 'Error desconocido'
          })
          .eq('id', retry.id)
        
        results.push({
          invoiceId: retry.invoice_id,
          attemptNumber: retry.attempt_number,
          success: false
        })
      }
    }
    
    return results
  } catch (error) {
    console.error('Error in processRetries:', error)
    return []
  }
}

/**
 * Gets retry statistics for an invoice
 * 
 * @param invoiceId - Invoice ID
 * @returns Retry statistics
 */
export async function getRetryStats(
  invoiceId: string
): Promise<{
  success: boolean
  totalAttempts?: number
  lastAttempt?: Date
  nextRetry?: Date
  exhausted?: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // Get all retries for this invoice
    const { data: retries, error: fetchError } = await supabase
      .from('arca_retry_queue')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('attempt_number', { ascending: false })
    
    if (fetchError) {
      return {
        success: false,
        error: 'Error al obtener estadísticas de reintentos'
      }
    }
    
    if (!retries || retries.length === 0) {
      return {
        success: true,
        totalAttempts: 0
      }
    }
    
    const totalAttempts = retries.length
    const lastRetry = retries[0]
    const lastAttempt = lastRetry.processed_at ? new Date(lastRetry.processed_at) : undefined
    
    // Find next pending retry
    const pendingRetry = retries.find(r => !r.processed_at)
    const nextRetry = pendingRetry ? new Date(pendingRetry.scheduled_at) : undefined
    
    // Check if exhausted (max attempts reached and all processed)
    const exhausted = totalAttempts >= MAX_RETRY_ATTEMPTS && 
                     retries.every(r => r.processed_at !== null)
    
    return {
      success: true,
      totalAttempts,
      lastAttempt,
      nextRetry,
      exhausted
    }
  } catch (error) {
    console.error('Error in getRetryStats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

// ============================================================================
// Notifications
// ============================================================================

/**
 * Notifies user when retries are exhausted
 * 
 * @param invoiceId - Invoice ID
 */
async function notifyRetryExhausted(invoiceId: string): Promise<void> {
  try {
    const supabase = await createClient()
    
    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('electronic_invoices')
      .select('*, company:companies(name)')
      .eq('id', invoiceId)
      .single()
    
    if (invoiceError || !invoice) {
      console.error('Error fetching invoice for notification:', invoiceError)
      return
    }
    
    // Create notification for company users
    const notificationMessage = `La factura electrónica ${invoice.invoice_type} #${String(invoice.point_of_sale).padStart(5, '0')}-${String(invoice.invoice_number).padStart(8, '0')} no pudo ser autorizada después de ${MAX_RETRY_ATTEMPTS} intentos. Por favor, revise los errores y reintente manualmente.`
    
    // Get company admin users
    const { data: companyUsers } = await supabase
      .from('company_users')
      .select('user_id')
      .eq('company_id', invoice.company_id)
      .eq('role', 'admin')
    
    if (companyUsers && companyUsers.length > 0) {
      // Create notifications for each admin
      const notifications = companyUsers.map(cu => ({
        user_id: cu.user_id,
        company_id: invoice.company_id,
        type: 'error',
        title: 'Factura electrónica no autorizada',
        message: notificationMessage,
        link: `/dashboard/arca/invoices/${invoiceId}`,
        read: false
      }))
      
      await supabase
        .from('notifications')
        .insert(notifications)
    }
    
    console.log(`Notification sent for exhausted retries: invoice ${invoiceId}`)
  } catch (error) {
    console.error('Error in notifyRetryExhausted:', error)
  }
}

/**
 * Gets pending retry count for a company
 * 
 * @param companyId - Company ID
 * @returns Count of pending retries
 */
export async function getPendingRetryCount(
  companyId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get count of pending retries for company's invoices
    const { data: companyInvoices } = await supabase
      .from('electronic_invoices')
      .select('id')
      .eq('company_id', companyId)
    
    if (!companyInvoices || companyInvoices.length === 0) {
      return {
        success: true,
        count: 0
      }
    }
    
    const invoiceIds = companyInvoices.map(inv => inv.id)
    
    const { count, error: countError } = await supabase
      .from('arca_retry_queue')
      .select('id', { count: 'exact', head: true })
      .is('processed_at', null)
      .in('invoice_id', invoiceIds)
    
    if (countError) {
      return {
        success: false,
        error: 'Error al obtener conteo de reintentos pendientes'
      }
    }
    
    return {
      success: true,
      count: count || 0
    }
  } catch (error) {
    console.error('Error in getPendingRetryCount:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}
