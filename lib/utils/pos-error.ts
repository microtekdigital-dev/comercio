/**
 * POS Error Handling
 *
 * Clase POSError, códigos de error, función handlePOSError
 * y estrategias de recuperación para el sistema de Punto de Venta.
 *
 * Requirement: 14.5
 */

// ─── Categorías de error ────────────────────────────────────────────────────

export type POSErrorCategory = 'validation' | 'business' | 'network' | 'system';

// ─── Códigos de error ────────────────────────────────────────────────────────

export type POSErrorCode =
  // Validation
  | 'CART_EMPTY'
  | 'TOTAL_ZERO'
  | 'DISCOUNT_EXCEEDS_SUBTOTAL'
  | 'QUANTITY_INVALID'
  // Business
  | 'NO_CASH_REGISTER_OPENING'
  | 'INSUFFICIENT_STOCK'
  | 'PAYMENT_MISMATCH'
  | 'CUSTOMER_NOT_FOUND'
  // Network
  | 'NETWORK_ERROR'
  | 'SYNC_FAILED'
  // System
  | 'UNKNOWN_ERROR';

// ─── Clase POSError ──────────────────────────────────────────────────────────

export class POSError extends Error {
  readonly code: POSErrorCode;
  readonly category: POSErrorCategory;
  readonly recoverable: boolean;
  readonly userMessage: string;

  constructor(
    code: POSErrorCode,
    userMessage: string,
    recoverable: boolean = true,
    cause?: unknown
  ) {
    super(userMessage);
    this.name = 'POSError';
    this.code = code;
    this.category = POS_ERROR_CATEGORY_MAP[code];
    this.recoverable = recoverable;
    this.userMessage = userMessage;

    // Preservar causa original si está disponible
    if (cause !== undefined) {
      (this as any).cause = cause;
    }
  }
}

// Mapa interno: código → categoría
const POS_ERROR_CATEGORY_MAP: Record<POSErrorCode, POSErrorCategory> = {
  CART_EMPTY: 'validation',
  TOTAL_ZERO: 'validation',
  DISCOUNT_EXCEEDS_SUBTOTAL: 'validation',
  QUANTITY_INVALID: 'validation',
  NO_CASH_REGISTER_OPENING: 'business',
  INSUFFICIENT_STOCK: 'business',
  PAYMENT_MISMATCH: 'business',
  CUSTOMER_NOT_FOUND: 'business',
  NETWORK_ERROR: 'network',
  SYNC_FAILED: 'network',
  UNKNOWN_ERROR: 'system',
};

// ─── Función handlePOSError ──────────────────────────────────────────────────

/**
 * Convierte cualquier error en un POSError tipado con mensaje amigable.
 *
 * - Si ya es POSError, lo retorna tal cual.
 * - Si es un Error con mensaje conocido, lo mapea al código apropiado.
 * - Cualquier otro caso → UNKNOWN_ERROR (no recuperable).
 */
export function handlePOSError(error: unknown): POSError {
  // Ya es un POSError, retornar directamente
  if (error instanceof POSError) {
    return error;
  }

  if (error instanceof Error) {
    const msg = error.message;

    if (msg.includes('No hay una caja abierta') || msg.includes('caja abierta')) {
      return new POSError(
        'NO_CASH_REGISTER_OPENING',
        'No hay una caja abierta. Debes abrir la caja antes de vender.',
        true,
        error
      );
    }

    if (msg.includes('Stock insuficiente') || msg.includes('stock insuficiente')) {
      return new POSError(
        'INSUFFICIENT_STOCK',
        msg, // conservar el mensaje original que incluye el producto y cantidad
        true,
        error
      );
    }

    if (msg.includes('suma de los pagos') || msg.includes('total de pagos')) {
      return new POSError(
        'PAYMENT_MISMATCH',
        'La suma de los pagos no coincide con el total de la venta.',
        true,
        error
      );
    }

    if (msg.includes('carrito está vacío') || msg.includes('carrito vacío')) {
      return new POSError(
        'CART_EMPTY',
        'El carrito está vacío. Agrega productos antes de finalizar la venta.',
        true,
        error
      );
    }

    if (
      msg.includes('total de la venta debe ser mayor') ||
      msg.includes('total debe ser mayor')
    ) {
      return new POSError(
        'TOTAL_ZERO',
        'El total de la venta debe ser mayor a cero.',
        true,
        error
      );
    }

    if (
      msg.includes('network') ||
      msg.includes('fetch') ||
      msg.includes('conexión') ||
      msg.includes('connection')
    ) {
      return new POSError(
        'NETWORK_ERROR',
        'Error de conexión. Verifica tu internet e intenta nuevamente.',
        true,
        error
      );
    }
  }

  // Error desconocido — no recuperable
  return new POSError(
    'UNKNOWN_ERROR',
    'Error inesperado. Por favor intenta nuevamente.',
    false,
    error
  );
}

// ─── Estrategias de recuperación ─────────────────────────────────────────────

/**
 * Mensajes de acción sugerida para el usuario según el código de error.
 * Úsalos para mostrar al cajero qué hacer para resolver el problema.
 */
export const RECOVERY_STRATEGIES: Record<POSErrorCode, string> = {
  // Validation
  CART_EMPTY: 'Agrega productos al carrito antes de finalizar la venta.',
  TOTAL_ZERO: 'Verifica que los productos tengan precio mayor a cero.',
  DISCOUNT_EXCEEDS_SUBTOTAL: 'Reduce el descuento para que no supere el subtotal.',
  QUANTITY_INVALID: 'Ingresa una cantidad válida (número entero mayor a cero).',
  // Business
  NO_CASH_REGISTER_OPENING: 'Abre la caja registradora antes de continuar.',
  INSUFFICIENT_STOCK: 'Reduce la cantidad o elimina el producto del carrito.',
  PAYMENT_MISMATCH: 'Verifica que la suma de los pagos sea igual al total.',
  CUSTOMER_NOT_FOUND: 'Selecciona otro cliente o continúa con cliente genérico.',
  // Network
  NETWORK_ERROR: 'Verifica tu conexión a internet e intenta nuevamente.',
  SYNC_FAILED: 'La venta se guardó localmente y se sincronizará cuando haya conexión.',
  // System
  UNKNOWN_ERROR: 'Recarga la página. Si el problema persiste, contacta soporte.',
};
