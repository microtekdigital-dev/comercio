'use client';

import { useEffect, useCallback } from 'react';

// =====================================================
// Types
// =====================================================

export interface POSKeyboardShortcutHandlers {
  /** F1: Enfocar campo de búsqueda de productos */
  onFocusProductSearch: () => void;
  /** F2: Enfocar campo de búsqueda de clientes */
  onFocusCustomerSearch: () => void;
  /** F3: Abrir modal de descuento */
  onOpenDiscount: () => void;
  /** F4: Abrir selector de método de pago */
  onOpenPayment: () => void;
  /** F9: Cancelar venta (solo si el carrito no está vacío) */
  onCancelSale: () => void;
  /** F12: Finalizar venta */
  onFinalizeSale: () => void;
  /** Si el carrito está vacío (F9 no se ejecuta cuando es true) */
  cartIsEmpty?: boolean;
}

// =====================================================
// Hook
// =====================================================

/**
 * Registra atajos de teclado globales para el POS.
 *
 * Atajos soportados:
 * - F1  → Enfocar búsqueda de productos
 * - F2  → Enfocar búsqueda de clientes
 * - F3  → Abrir modal de descuento
 * - F4  → Abrir selector de método de pago
 * - F9  → Cancelar venta (con confirmación, solo si carrito no está vacío)
 * - F12 → Finalizar venta
 * - Enter → Confirmar acción (delegado al handler del modal activo)
 * - Esc  → Cancelar/cerrar modal (delegado al handler del modal activo)
 *
 * Previene el comportamiento por defecto del navegador para F1–F12.
 * Limpia los listeners automáticamente al desmontar el componente.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 */
export function usePOSKeyboardShortcuts(
  handlers: POSKeyboardShortcutHandlers
): void {
  const {
    onFocusProductSearch,
    onFocusCustomerSearch,
    onOpenDiscount,
    onOpenPayment,
    onCancelSale,
    onFinalizeSale,
    cartIsEmpty = false,
  } = handlers;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Only handle function keys F1–F12 (prevent browser defaults)
      const isFKey = e.key.match(/^F(\d+)$/);
      if (isFKey) {
        e.preventDefault();
      }

      switch (e.key) {
        // F1: Enfocar búsqueda de productos (Req 5.1)
        case 'F1':
          onFocusProductSearch();
          break;

        // F2: Enfocar búsqueda de clientes (Req 5.2)
        case 'F2':
          onFocusCustomerSearch();
          break;

        // F3: Abrir modal de descuento (Req 5.3)
        case 'F3':
          onOpenDiscount();
          break;

        // F4: Abrir selector de método de pago (Req 5.4)
        case 'F4':
          onOpenPayment();
          break;

        // F9: Cancelar venta — solo si el carrito no está vacío (Req 5.5)
        case 'F9':
          if (!cartIsEmpty) {
            onCancelSale();
          }
          break;

        // F12: Finalizar venta (Req 5.6)
        case 'F12':
          onFinalizeSale();
          break;

        // Enter y Esc son manejados por los modales activos (Req 5.7, 5.8)
        // No se interceptan aquí para no interferir con inputs y modales nativos.

        default:
          break;
      }
    },
    [
      onFocusProductSearch,
      onFocusCustomerSearch,
      onOpenDiscount,
      onOpenPayment,
      onCancelSale,
      onFinalizeSale,
      cartIsEmpty,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
