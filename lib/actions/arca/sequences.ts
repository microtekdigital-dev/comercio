'use server'

import { createClient } from '@/lib/supabase/server'
import { InvoiceType, SequenceValidation } from '@/lib/types/arca'

// ============================================================================
// Sequence Management Functions
// ============================================================================

/**
 * Gets the next invoice number for a given company, point of sale, and invoice type
 * Uses database transactions to prevent race conditions
 * 
 * @param companyId - Company ID
 * @param pointOfSale - Point of sale number
 * @param invoiceType - Type of invoice
 * @returns Next invoice number
 */
export async function getNextNumber(
  companyId: string,
  pointOfSale: number,
  invoiceType: InvoiceType
): Promise<{ success: boolean; number?: number; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Start a transaction by using a stored procedure
    // This ensures atomicity and prevents race conditions
    const { data, error } = await supabase.rpc('get_next_arca_sequence', {
      p_company_id: companyId,
      p_point_of_sale: pointOfSale,
      p_invoice_type: invoiceType
    })
    
    if (error) {
      console.error('Error getting next sequence number:', error)
      return {
        success: false,
        error: 'Error al obtener el próximo número de comprobante'
      }
    }
    
    return {
      success: true,
      number: data
    }
  } catch (error) {
    console.error('Error in getNextNumber:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al obtener número de secuencia'
    }
  }
}

/**
 * Validates the sequence for a given company, point of sale, and invoice type
 * Checks for gaps or inconsistencies in the numbering
 * 
 * @param companyId - Company ID
 * @param pointOfSale - Point of sale number
 * @param invoiceType - Type of invoice
 * @returns Sequence validation result
 */
export async function validateSequence(
  companyId: string,
  pointOfSale: number,
  invoiceType: InvoiceType
): Promise<{ success: boolean; validation?: SequenceValidation; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get current sequence
    const { data: sequenceData, error: sequenceError } = await supabase
      .from('arca_sequences')
      .select('last_number')
      .eq('company_id', companyId)
      .eq('point_of_sale', pointOfSale)
      .eq('invoice_type', invoiceType)
      .single()
    
    if (sequenceError || !sequenceData) {
      return {
        success: true,
        validation: {
          valid: true,
          expectedNext: 1,
          actualNext: 1,
          gaps: []
        }
      }
    }
    
    const expectedNext = sequenceData.last_number + 1
    
    // Get all invoice numbers for this sequence
    const { data: invoices, error: invoicesError } = await supabase
      .from('electronic_invoices')
      .select('invoice_number')
      .eq('company_id', companyId)
      .eq('point_of_sale', pointOfSale)
      .eq('invoice_type', invoiceType)
      .order('invoice_number', { ascending: true })
    
    if (invoicesError) {
      console.error('Error getting invoices for validation:', invoicesError)
      return {
        success: false,
        error: 'Error al validar la secuencia de comprobantes'
      }
    }
    
    // Check for gaps
    const gaps: number[] = []
    if (invoices && invoices.length > 0) {
      for (let i = 0; i < invoices.length - 1; i++) {
        const current = invoices[i].invoice_number
        const next = invoices[i + 1].invoice_number
        
        if (next - current > 1) {
          // There's a gap
          for (let j = current + 1; j < next; j++) {
            gaps.push(j)
          }
        }
      }
    }
    
    const validation: SequenceValidation = {
      valid: gaps.length === 0,
      expectedNext,
      actualNext: expectedNext,
      gaps
    }
    
    return {
      success: true,
      validation
    }
  } catch (error) {
    console.error('Error in validateSequence:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al validar secuencia'
    }
  }
}

/**
 * Synchronizes the local sequence with ARCA's last authorized number
 * This should be called periodically or when there's a discrepancy
 * 
 * @param companyId - Company ID
 * @param pointOfSale - Point of sale number
 * @param invoiceType - Type of invoice
 * @returns Success status
 */
export async function syncWithARCA(
  companyId: string,
  pointOfSale: number,
  invoiceType: InvoiceType
): Promise<{ success: boolean; lastNumber?: number; error?: string }> {
  try {
    // TODO: This will be implemented when we have the ARCA API client
    // For now, we'll just update the last_sync timestamp
    
    const supabase = await createClient()
    
    // Get current sequence
    const { data: sequenceData, error: sequenceError } = await supabase
      .from('arca_sequences')
      .select('last_number')
      .eq('company_id', companyId)
      .eq('point_of_sale', pointOfSale)
      .eq('invoice_type', invoiceType)
      .single()
    
    if (sequenceError && sequenceError.code !== 'PGRST116') {
      console.error('Error getting sequence for sync:', sequenceError)
      return {
        success: false,
        error: 'Error al sincronizar con ARCA'
      }
    }
    
    // Update last_sync timestamp
    const { error: updateError } = await supabase
      .from('arca_sequences')
      .upsert({
        company_id: companyId,
        point_of_sale: pointOfSale,
        invoice_type: invoiceType,
        last_number: sequenceData?.last_number || 0,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'company_id,point_of_sale,invoice_type'
      })
    
    if (updateError) {
      console.error('Error updating sync timestamp:', updateError)
      return {
        success: false,
        error: 'Error al actualizar sincronización con ARCA'
      }
    }
    
    return {
      success: true,
      lastNumber: sequenceData?.last_number || 0
    }
  } catch (error) {
    console.error('Error in syncWithARCA:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al sincronizar con ARCA'
    }
  }
}
