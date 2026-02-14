/**
 * Error handling types for server actions
 * 
 * This module defines TypeScript types for structured error handling
 * across server actions, providing consistent error classification and
 * response formats.
 */

/**
 * Error type classification for different categories of errors
 */
export type ErrorType = 
  | 'RLS_ERROR'           // Row Level Security / Permission errors
  | 'CONSTRAINT_ERROR'    // Database constraint violations
  | 'VALIDATION_ERROR'    // Input validation errors
  | 'PLAN_LIMIT_ERROR'    // Subscription plan limit errors
  | 'UNKNOWN_ERROR';      // Unclassified errors

/**
 * Context information for error logging and debugging
 */
export interface ErrorContext {
  /** Name of the operation that failed (e.g., "createPurchaseOrder") */
  operation: string;
  
  /** ID of the user who triggered the operation */
  userId?: string;
  
  /** ID of the company context */
  companyId?: string;
  
  /** ID of the entity being operated on */
  entityId?: string;
  
  /** Any other relevant context information */
  additionalInfo?: Record<string, any>;
}

/**
 * Structured error response returned by server actions
 */
export interface StructuredErrorResponse {
  /** Always false for error responses */
  success: false;
  
  /** User-friendly error message in Spanish */
  error: string;
  
  /** Classification of the error type */
  errorType: ErrorType;
  
  /** Optional technical details (PostgreSQL code, hints, etc.) */
  errorDetails?: {
    code?: string;
    hint?: string;
  };
}

/**
 * Success response returned by server actions
 */
export interface SuccessResponse<T> {
  /** Always true for success responses */
  success: true;
  
  /** The data returned by the operation */
  data: T;
}

/**
 * Union type for all server action responses
 * Allows type discrimination based on the 'success' field
 */
export type ServerActionResponse<T> = SuccessResponse<T> | StructuredErrorResponse;

/**
 * Supabase PostgrestError structure
 * Based on Supabase client error format
 */
export interface PostgrestError {
  /** Human-readable error message */
  message: string;
  
  /** Additional error details */
  details: string;
  
  /** Suggestion for fixing the error */
  hint: string;
  
  /** PostgreSQL error code (e.g., "23505", "42501") */
  code: string;
}
