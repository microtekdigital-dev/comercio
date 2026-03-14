'use server'

// ============================================================================
// Error Categories
// ============================================================================

export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  COMMUNICATION = 'COMMUNICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  BUSINESS = 'BUSINESS',
  SYSTEM = 'SYSTEM'
}

export interface CategorizedError {
  category: ErrorCategory
  message: string
  originalError?: any
  retryable: boolean
  userMessage: string
  adminNotification: boolean
}

// ============================================================================
// Error Categorization
// ============================================================================

/**
 * Categorizes an error and provides appropriate handling instructions
 * 
 * @param error - Error to categorize
 * @param context - Additional context about where the error occurred
 * @returns Categorized error with handling instructions
 */
export function categorizeError(
  error: any,
  context?: string
): CategorizedError {
  const errorMessage = error?.message || String(error)
  
  // Validation errors
  if (
    errorMessage.includes('CUIT') ||
    errorMessage.includes('certificado') ||
    errorMessage.includes('datos fiscales') ||
    errorMessage.includes('formato') ||
    errorMessage.includes('inválido')
  ) {
    return {
      category: ErrorCategory.VALIDATION,
      message: errorMessage,
      originalError: error,
      retryable: false,
      userMessage: `Error de validación: ${errorMessage}. Por favor, corrija los datos e intente nuevamente.`,
      adminNotification: false
    }
  }
  
  // Communication errors
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('network') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('no disponible')
  ) {
    return {
      category: ErrorCategory.COMMUNICATION,
      message: errorMessage,
      originalError: error,
      retryable: true,
      userMessage: 'Error de comunicación con ARCA. El comprobante se reintentará automáticamente.',
      adminNotification: false
    }
  }
  
  // Authorization errors
  if (
    errorMessage.includes('401') ||
    errorMessage.includes('403') ||
    errorMessage.includes('no autorizado') ||
    errorMessage.includes('certificado rechazado') ||
    errorMessage.includes('token expirado')
  ) {
    return {
      category: ErrorCategory.AUTHORIZATION,
      message: errorMessage,
      originalError: error,
      retryable: false,
      userMessage: 'Error de autenticación con ARCA. Por favor, contacte al administrador para verificar la configuración del certificado digital.',
      adminNotification: true
    }
  }
  
  // Business logic errors (ARCA rejection)
  if (
    errorMessage.includes('rechazado') ||
    errorMessage.includes('ARCA') ||
    errorMessage.includes('padrón') ||
    errorMessage.includes('no válido en')
  ) {
    return {
      category: ErrorCategory.BUSINESS,
      message: errorMessage,
      originalError: error,
      retryable: false,
      userMessage: `ARCA rechazó el comprobante: ${errorMessage}. Por favor, verifique los datos fiscales del cliente.`,
      adminNotification: false
    }
  }
  
  // System errors (default)
  return {
    category: ErrorCategory.SYSTEM,
    message: errorMessage,
    originalError: error,
    retryable: true,
    userMessage: 'Error interno del sistema. El comprobante se reintentará automáticamente. Si el problema persiste, contacte al administrador.',
    adminNotification: true
  }
}

// ============================================================================
// Circuit Breaker Pattern
// ============================================================================

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Too many failures, reject immediately
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

interface CircuitBreakerConfig {
  failureThreshold: number
  successThreshold: number
  timeout: number // milliseconds
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount: number = 0
  private successCount: number = 0
  private lastFailureTime: number = 0
  private config: CircuitBreakerConfig
  
  constructor(config: CircuitBreakerConfig) {
    this.config = config
  }
  
  getState(): CircuitState {
    // Check if timeout has passed and we should try HALF_OPEN
    if (
      this.state === CircuitState.OPEN &&
      Date.now() - this.lastFailureTime >= this.config.timeout
    ) {
      this.state = CircuitState.HALF_OPEN
      this.successCount = 0
    }
    
    return this.state
  }
  
  recordSuccess(): void {
    this.failureCount = 0
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++
      
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED
        this.successCount = 0
      }
    }
  }
  
  recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN
    }
  }
  
  reset(): void {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = 0
  }
}

// Global circuit breaker instance for ARCA API
const arcaCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000 // 1 minute
})

/**
 * Gets the current circuit breaker state
 * 
 * @returns Current circuit state
 */
export function getCircuitState(): CircuitState {
  return arcaCircuitBreaker.getState()
}

/**
 * Records a successful operation
 */
export function recordSuccess(): void {
  arcaCircuitBreaker.recordSuccess()
}

/**
 * Records a failed operation
 */
export function recordFailure(): void {
  arcaCircuitBreaker.recordFailure()
}

/**
 * Resets the circuit breaker (admin action)
 */
export function resetCircuitBreaker(): void {
  arcaCircuitBreaker.reset()
}

/**
 * Checks if operation should be allowed based on circuit breaker state
 * 
 * @returns True if operation should proceed, false if circuit is open
 */
export function shouldAllowOperation(): boolean {
  const state = arcaCircuitBreaker.getState()
  
  // Allow operations in CLOSED and HALF_OPEN states
  // Reject in OPEN state
  return state !== CircuitState.OPEN
}

// ============================================================================
// Graceful Degradation
// ============================================================================

/**
 * Checks if system should operate in degraded mode
 * In degraded mode, sales can continue but invoices are marked as pending
 * 
 * @returns True if system should operate in degraded mode
 */
export function shouldUseDegradedMode(): boolean {
  const state = arcaCircuitBreaker.getState()
  
  // Use degraded mode when circuit is OPEN
  return state === CircuitState.OPEN
}

/**
 * Gets a user-friendly message for degraded mode
 * 
 * @returns Message to display to user
 */
export function getDegradedModeMessage(): string {
  return 'El servicio de ARCA no está disponible temporalmente. Las ventas se pueden continuar normalmente, pero los comprobantes electrónicos se generarán automáticamente cuando el servicio se restablezca.'
}

// ============================================================================
// Error Message Generation
// ============================================================================

/**
 * Generates a descriptive and actionable error message
 * 
 * @param error - Categorized error
 * @param invoiceNumber - Invoice number (if applicable)
 * @param cae - CAE (if applicable)
 * @returns User-friendly error message
 */
export function generateErrorMessage(
  error: CategorizedError,
  invoiceNumber?: string,
  cae?: string
): string {
  let message = error.userMessage
  
  // Add context if available
  if (invoiceNumber) {
    message = `Comprobante #${invoiceNumber}: ${message}`
  }
  
  if (cae) {
    message += ` (CAE: ${cae})`
  }
  
  // Add retry information if retryable
  if (error.retryable) {
    message += ' El sistema reintentará automáticamente.'
  }
  
  return message
}

/**
 * Generates an admin notification message
 * 
 * @param error - Categorized error
 * @param companyId - Company ID
 * @returns Admin notification details
 */
export function generateAdminNotification(
  error: CategorizedError,
  companyId: string
): {
  title: string
  message: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
} {
  let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  
  if (error.category === ErrorCategory.AUTHORIZATION) {
    priority = 'urgent'
  } else if (error.category === ErrorCategory.SYSTEM) {
    priority = 'high'
  }
  
  return {
    title: `Error en Facturación Electrónica - ${error.category}`,
    message: `Se detectó un error de tipo ${error.category}: ${error.message}. Por favor, revise la configuración de ARCA.`,
    priority
  }
}

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Handles an error with full categorization and appropriate actions
 * 
 * @param error - Error to handle
 * @param context - Context information
 * @returns Handling result with user message and actions taken
 */
export async function handleError(
  error: any,
  context?: {
    invoiceId?: string
    invoiceNumber?: string
    companyId?: string
    userId?: string
  }
): Promise<{
  success: false
  error: string
  retryable: boolean
  degradedMode: boolean
}> {
  // Categorize the error
  const categorized = categorizeError(error, context?.invoiceId)
  
  // Record failure in circuit breaker for communication errors
  if (categorized.category === ErrorCategory.COMMUNICATION) {
    recordFailure()
  }
  
  // Generate user message
  const userMessage = generateErrorMessage(
    categorized,
    context?.invoiceNumber
  )
  
  // Send admin notification if needed
  if (categorized.adminNotification && context?.companyId) {
    try {
      const notification = generateAdminNotification(categorized, context.companyId)
      
      // TODO: Implement notification sending
      // await sendAdminNotification(context.companyId, notification)
      
      console.warn('Admin notification needed:', notification)
    } catch (notifError) {
      console.error('Error sending admin notification:', notifError)
    }
  }
  
  // Check if should use degraded mode
  const degradedMode = shouldUseDegradedMode()
  
  return {
    success: false,
    error: userMessage,
    retryable: categorized.retryable,
    degradedMode
  }
}

/**
 * Wraps an async operation with error handling and circuit breaker
 * 
 * @param operation - Async operation to execute
 * @param context - Context information
 * @returns Operation result or error
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: {
    invoiceId?: string
    invoiceNumber?: string
    companyId?: string
    userId?: string
  }
): Promise<{ success: true; data: T } | { success: false; error: string; retryable: boolean; degradedMode: boolean }> {
  // Check circuit breaker
  if (!shouldAllowOperation()) {
    return {
      success: false,
      error: getDegradedModeMessage(),
      retryable: true,
      degradedMode: true
    }
  }
  
  try {
    const result = await operation()
    
    // Record success
    recordSuccess()
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    return await handleError(error, context)
  }
}
