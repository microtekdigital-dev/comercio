"use client";

import { useState } from "react";
import type { CartItem } from "@/lib/types/catalogo";
import { FormularioPedido } from "./formulario-pedido";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateItem: (productId: string, variantId: string | null, quantity: number) => void;
  onOrderSuccess: () => void;
  slug: string;
  primaryColor: string;
}

export function CarritoDrawer({
  open,
  onClose,
  cart,
  onUpdateItem,
  onOrderSuccess,
  slug,
  primaryColor,
}: Props) {
  const [showForm, setShowForm] = useState(false);

  const total = cart.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  function handleOrderSuccess() {
    setShowForm(false);
    onOrderSuccess();
    onClose();
  }

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 z-50 shadow-xl flex flex-col">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="font-semibold">Tu carrito</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Cerrar carrito"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        {showForm ? (
          <FormularioPedido
            cart={cart}
            slug={slug}
            onSuccess={handleOrderSuccess}
            onBack={() => setShowForm(false)}
          />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Tu carrito está vacío</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={`${item.product_id}-${item.variant_id}`}
                    className="flex gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                  >
                    {/* Imagen */}
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="h-14 w-14 rounded-md object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-md bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {item.product_name}
                      </p>
                      {item.variant_name && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.variant_name}</p>
                      )}
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
                        ${(item.unit_price * item.quantity).toLocaleString("es-AR")}
                      </p>
                    </div>

                    {/* Controles cantidad */}
                    <div className="flex flex-col items-end gap-1">
                      <button
                        onClick={() =>
                          onUpdateItem(item.product_id, item.variant_id, 0)
                        }
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Eliminar ítem"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            onUpdateItem(
                              item.product_id,
                              item.variant_id,
                              item.quantity - 1
                            )
                          }
                          className="h-6 w-6 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          aria-label="Reducir cantidad"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center text-gray-900 dark:text-gray-100">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateItem(
                              item.product_id,
                              item.variant_id,
                              item.quantity + 1
                            )
                          }
                          disabled={item.quantity >= item.max_stock}
                          className="h-6 w-6 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Total</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    ${total.toLocaleString("es-AR")}
                  </span>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full py-3 rounded-lg text-white font-semibold transition-colors"
                  style={{ backgroundColor: primaryColor }}
                >
                  Confirmar pedido
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
