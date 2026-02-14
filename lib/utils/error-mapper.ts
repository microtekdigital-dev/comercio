/**
 * Error Mapper - Maps error types and codes to user-friendly Spanish messages
 * 
 * This module provides translation from technical error codes to actionable
 * messages that users can understand and act upon.
 */

import type { ErrorType } from './error-types';

/**
 * Error mapping configuration
 */
interface ErrorMapping {
  errorType: ErrorType;
  code?: string;
  message: string;
}

/**
 * Comprehensive error message mappings
 * Maps error types and PostgreSQL error codes to Spanish messages
 */
const ERROR_MESSAGES: ErrorMapping[] = [
  // RLS (Row Level Security) Errors
  {
    errorType: 'RLS_ERROR',
    code: '42501',
    message: 'No tienes permisos para crear órdenes de compra. Contacta al administrador de tu empresa.',
  },
  
  // Constraint Errors - Unique Violation
  {
    errorType: 'CONSTRAINT_ERROR',
    code: '23505',
    message: 'Ya existe una orden de compra con este número. El sistema generará un nuevo número automáticamente.',
  },
  
  // Constraint Errors - Foreign Key Violation
  {
    errorType: 'CONSTRAINT_ERROR',
    code: '23503',
    message: 'El proveedor o producto seleccionado no existe. Por favor, verifica los datos.',
  },
  
  // Constraint Errors - Not Null Violation
  {
    errorType: 'CONSTRAINT_ERROR',
    code: '23502',
    message: 'Faltan campos obligatorios. Por favor, completa todos los campos requeridos.',
  },
  
  // Plan Limit Errors
  {
    errorType: 'PLAN_LIMIT_ERROR',
    message: 'Has alcanzado el límite de órdenes de compra de tu plan. Actualiza tu suscripción para continuar.',
  },
  
  // Validation Errors
  {
    errorType: 'VALIDATION_ERROR',
    message: 'Los datos ingresados no son válidos. Por favor, verifica la información.',
  },
  
  // Unknown Errors
  {
    errorType: 'UNKNOWN_ERROR',
    message: 'Error al crear la orden de compra. Por favor, intenta nuevamente.',
  },
];

/**
 * Default fallback messages by error type
 */
const DEFAULT_MESSAGES: Record<ErrorType, string> = {
  RLS_ERROR: 'No tienes permisos para realizar esta operación. Contacta al administrador.',
  CONSTRAINT_ERROR: 'Error de integridad de datos. Por favor, verifica la información.',
  VALIDATION_ERROR: 'Los datos ingresados no son válidos. Por favor, verifica la información.',
  PLAN_LIMIT_ERROR: 'Has alcanzado el límite de tu plan. Actualiza tu suscripción para continuar.',
  UNKNOWN_ERROR: 'Error al procesar la solicitud. Por favor, intenta nuevamente.',
};

/**
 * Gets a user-friendly error message based on error type and code
 * 
 * @param errorType - The classified error type
 * @param errorCode - Optional PostgreSQL error code
 * @returns User-friendly error message in Spanish
 * 
 * @example
 * ```typescript
 * const message = getErrorMessage('RLS_ERROR', '42501');
 * // Returns: "No tienes permisos para crear órdenes de compra..."
 * ```
 */
export function getErrorMessage(
  errorType: ErrorType,
  errorCode?: string
): string {
  // Try to find specific mapping with error code
  if (errorCode) {
    const specificMapping = ERROR_MESSAGES.find(
      (mapping) => mapping.errorType === errorType && mapping.code === errorCode
    );
    
    if (specificMapping) {
      return specificMapping.message;
    }
  }
  
  // Try to find mapping without code (generic for error type)
  const genericMapping = ERROR_MESSAGES.find(
    (mapping) => mapping.errorType === errorType && !mapping.code
  );
  
  if (genericMapping) {
    return genericMapping.message;
  }
  
  // Fallback to default message for error type
  return DEFAULT_MESSAGES[errorType] || DEFAULT_MESSAGES.UNKNOWN_ERROR;
}
