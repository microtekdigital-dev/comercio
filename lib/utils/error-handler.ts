/**
 * Error Handler - Central utility for processing and formatting server errors
 * 
 * This module provides a unified approach to error handling across server actions,
 * classifying errors, logging details, and returning structured responses.
 */

import type {
  ErrorType,
  ErrorContext,
  StructuredErrorResponse,
  PostgrestError,
} from './error-types';
import { getErrorMessage } from './error-mapper';

/**
 * Classifies an error based on its properties and PostgreSQL error code
 * 
 * @param error - The error object to classify
 * @returns The classified error type
 */
function classifyError(error: any): ErrorType {
  // Check for PostgreSQL error codes
  const errorCode = error?.code;
  
  if (errorCode) {
    // RLS (Row Level Security) errors
    if (errorCode === '42501') {
      return 'RLS_ERROR';
    }
    
    // Constraint errors
    if (['23505', '23503', '23502'].includes(errorCode)) {
      return 'CONSTRAINT_ERROR';
    }
  }
  
  // Check for plan limit errors (custom error messages)
  const errorMessage = error?.message?.toLowerCase() || '';
  if (
    errorMessage.includes('plan') ||
    errorMessage.includes('limit') ||
    errorMessage.includes('subscription')
  ) {
    return 'PLAN_LIMIT_ERROR';
  }
  
  // Check for validation errors
  if (
    errorMessage.includes('invalid') ||
    errorMessage.includes('validation') ||
    errorMessage.includes('required')
  ) {
    return 'VALIDATION_ERROR';
  }
  
  // Default to unknown error
  return 'UNKNOWN_ERROR';
}

/**
 * Extracts error information from various error types
 * 
 * @param error - The error object
 * @returns Extracted error information
 */
function extractErrorInfo(error: any): {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  stack?: string;
} {
  // Handle null/undefined
  if (!error) {
    return { message: 'Unknown error occurred' };
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return { message: error };
  }
  
  // Handle Error objects and Supabase PostgrestError
  return {
    message: error.message || 'Unknown error occurred',
    code: error.code,
    details: error.details,
    hint: error.hint,
    stack: error.stack,
  };
}

/**
 * Sanitizes error information for client response
 * Removes sensitive information like stack traces and internal IDs
 * 
 * @param errorInfo - The error information to sanitize
 * @returns Sanitized error details safe for client
 */
function sanitizeErrorForClient(errorInfo: {
  code?: string;
  hint?: string;
}): { code?: string; hint?: string } | undefined {
  // Only include PostgreSQL code and hint if available
  // Never include stack traces, internal IDs, or database details
  if (errorInfo.code || errorInfo.hint) {
    return {
      code: errorInfo.code,
      hint: errorInfo.hint,
    };
  }
  
  return undefined;
}

/**
 * Logs detailed error information to the server console
 * 
 * @param error - The original error object
 * @param errorType - The classified error type
 * @param context - The error context
 * @param errorInfo - Extracted error information
 */
function logError(
  error: any,
  errorType: ErrorType,
  context: ErrorContext,
  errorInfo: ReturnType<typeof extractErrorInfo>
): void {
  const timestamp = new Date().toISOString();
  
  console.error('=== Server Error ===');
  console.error('Timestamp:', timestamp);
  console.error('Operation:', context.operation);
  console.error('Error Type:', errorType);
  console.error('Error Message:', errorInfo.message);
  
  if (errorInfo.code) {
    console.error('PostgreSQL Code:', errorInfo.code);
  }
  
  if (errorInfo.details) {
    console.error('Details:', errorInfo.details);
  }
  
  if (errorInfo.hint) {
    console.error('Hint:', errorInfo.hint);
  }
  
  if (context.userId) {
    console.error('User ID:', context.userId);
  }
  
  if (context.companyId) {
    console.error('Company ID:', context.companyId);
  }
  
  if (context.entityId) {
    console.error('Entity ID:', context.entityId);
  }
  
  if (context.additionalInfo) {
    console.error('Additional Info:', JSON.stringify(context.additionalInfo, null, 2));
  }
  
  if (errorInfo.stack) {
    console.error('Stack Trace:', errorInfo.stack);
  }
  
  // Log the original error object for complete debugging
  console.error('Original Error:', error);
  console.error('===================');
}

/**
 * Handles server errors with classification, logging, and structured response
 * 
 * This is the main entry point for error handling in server actions.
 * It processes any error type, classifies it, logs detailed information,
 * and returns a structured response safe for the client.
 * 
 * @param error - The error to handle (can be any type)
 * @param context - Context information about the operation
 * @returns Structured error response for the client
 * 
 * @example
 * ```typescript
 * try {
 *   // ... server action code
 *   return { success: true, data: result };
 * } catch (error) {
 *   return handleServerError(error, {
 *     operation: 'createPurchaseOrder',
 *     userId: user.id,
 *     companyId: profile.company_id,
 *   });
 * }
 * ```
 */
export function handleServerError(
  error: unknown,
  context: ErrorContext
): StructuredErrorResponse {
  // Extract error information
  const errorInfo = extractErrorInfo(error);
  
  // Classify the error
  const errorType = classifyError(error);
  
  // Log detailed error information (server-side only)
  logError(error, errorType, context, errorInfo);
  
  // Get user-friendly message
  const userMessage = getErrorMessage(errorType, errorInfo.code);
  
  // Sanitize error details for client
  const clientErrorDetails = sanitizeErrorForClient({
    code: errorInfo.code,
    hint: errorInfo.hint,
  });
  
  // Return structured error response
  return {
    success: false,
    error: userMessage,
    errorType,
    errorDetails: clientErrorDetails,
  };
}
