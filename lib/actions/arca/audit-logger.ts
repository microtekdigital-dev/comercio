'use server'

import { createClient } from '@/lib/supabase/server'

export type OperationType = 
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'AUTHORIZE'
  | 'CANCEL'
  | 'QUERY'
  | 'SYNC'
  | 'RETRY'

export type EntityType =
  | 'INVOICE'
  | 'CREDIT_NOTE'
  | 'DEBIT_NOTE'
  | 'CERTIFICATE'
  | 'CONFIGURATION'

export interface AuditOperation {
  companyId: string
  userId: string
  operationType: OperationType
  entityType: EntityType
  entityId: string
  timestamp: Date
  details: Record<string, any>
  success: boolean
  errorMessage?: string
}

export interface LogFilters {
  companyId: string
  startDate?: Date
  endDate?: Date
  operationType?: OperationType
  entityType?: EntityType
  userId?: string
}

export type ExportFormat = 'PDF' | 'EXCEL' | 'CSV'

/**
 * Registra una operación en el log de auditoría
 */
export async function logOperation(operation: AuditOperation): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('arca_audit_logs')
    .insert({
      company_id: operation.companyId,
      user_id: operation.userId,
      operation_type: operation.operationType,
      entity_type: operation.entityType,
      entity_id: operation.entityId,
      timestamp: operation.timestamp.toISOString(),
      details: operation.details,
      success: operation.success,
      error_message: operation.errorMessage
    })

  if (error) {
    console.error('Error logging audit operation:', error)
    throw new Error(`Failed to log audit operation: ${error.message}`)
  }
}

/**
 * Consulta logs de auditoría con filtros
 */
export async function queryLogs(filters: LogFilters) {
  const supabase = await createClient()

  let query = supabase
    .from('arca_audit_logs')
    .select(`
      *,
      user:profiles!arca_audit_logs_user_id_fkey(
        id,
        full_name,
        email
      )
    `)
    .eq('company_id', filters.companyId)
    .order('timestamp', { ascending: false })

  // Aplicar filtros opcionales
  if (filters.startDate) {
    query = query.gte('timestamp', filters.startDate.toISOString())
  }

  if (filters.endDate) {
    query = query.lte('timestamp', filters.endDate.toISOString())
  }

  if (filters.operationType) {
    query = query.eq('operation_type', filters.operationType)
  }

  if (filters.entityType) {
    query = query.eq('entity_type', filters.entityType)
  }

  if (filters.userId) {
    query = query.eq('user_id', filters.userId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error querying audit logs:', error)
    throw new Error(`Failed to query audit logs: ${error.message}`)
  }

  return data || []
}


/**
 * Exporta logs de auditoría en el formato especificado
 */
export async function exportLogs(
  filters: LogFilters,
  format: ExportFormat
): Promise<Buffer> {
  const logs = await queryLogs(filters)

  switch (format) {
    case 'CSV':
      return exportToCSV(logs)
    case 'EXCEL':
      return exportToExcel(logs)
    case 'PDF':
      return exportToPDF(logs)
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

/**
 * Exporta logs a formato CSV
 */
function exportToCSV(logs: any[]): Buffer {
  if (logs.length === 0) {
    return Buffer.from('No data to export')
  }

  // Encabezados
  const headers = [
    'Fecha/Hora',
    'Usuario',
    'Operación',
    'Entidad',
    'ID Entidad',
    'Resultado',
    'Error'
  ]

  // Filas
  const rows = logs.map(log => [
    new Date(log.timestamp).toLocaleString('es-AR'),
    log.user?.full_name || log.user?.email || 'N/A',
    log.operation_type,
    log.entity_type,
    log.entity_id,
    log.success ? 'Éxito' : 'Error',
    log.error_message || ''
  ])

  // Construir CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return Buffer.from(csvContent, 'utf-8')
}

/**
 * Exporta logs a formato Excel
 * TODO: Implementar usando biblioteca como exceljs
 */
function exportToExcel(logs: any[]): Buffer {
  // Por ahora, retornar CSV como fallback
  // En producción, usar biblioteca como exceljs para generar archivos .xlsx reales
  return exportToCSV(logs)
}

/**
 * Exporta logs a formato PDF
 * TODO: Implementar usando biblioteca como pdf-lib o pdfkit
 */
function exportToPDF(logs: any[]): Buffer {
  // Por ahora, retornar texto plano como fallback
  // En producción, usar biblioteca de PDF para generar documentos formateados
  const content = logs.map(log => 
    `${new Date(log.timestamp).toLocaleString('es-AR')} - ${log.operation_type} - ${log.entity_type} - ${log.success ? 'Éxito' : 'Error'}`
  ).join('\n')

  return Buffer.from(content, 'utf-8')
}
