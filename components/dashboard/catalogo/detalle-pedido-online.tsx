"use client";

import { useState, useTransition } from "react";
import type { OnlineOrder } from "@/lib/types/catalogo";
import { confirmarPedidoOnline, rechazarPedidoOnline } from "@/lib/actions/catalogo";
import { X, User, Phone, MapPin, MessageSquare, Check, XCircle } from "lucide-react";

interface Props {
  pedido: OnlineOrder;
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: "confirmado" | "rechazado") => void;
}

export function DetallePedidoOnline({ pedido, onClose, onStatusChange }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirmar() {
    setError(null);
    startTransition(async () => {
      const result = await confirmarPedidoOnline(pedido.id);
      if (result.success) {
        onStatusChange(pedido.id, "confirmado");
      } else {
        setError(result.error ?? "Error al confirmar el pedido");
      }
    });
  }

  function handleRechazar() {
    setError(null);
    startTransition(async () => {
      const result = await rechazarPedidoOnline(pedido.id);
      if (result.success) {
        onStatusChange(pedido.id, "rechazado");
      } else {
        setError(result.error ?? "Error al rechazar el pedido");
      }
    });
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h3 className="font-semibold text-gray-900">
                Pedido {pedido.order_number}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(pedido.created_at).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Datos del visitante */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Datos del cliente
              </h4>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  {pedido.visitor_name}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  {pedido.visitor_phone}
                </div>
                {pedido.visitor_address && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    {pedido.visitor_address}
                  </div>
                )}
                {pedido.visitor_notes && (
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="italic">{pedido.visitor_notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ítems */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Productos
              </h4>
              <div className="border rounded-lg divide-y">
                {pedido.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">{item.product_name}</span>
                      {item.variant_name && (
                        <span className="text-gray-400 ml-1">({item.variant_name})</span>
                      )}
                      <span className="text-gray-500 ml-2">× {item.quantity}</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      ${item.subtotal.toLocaleString("es-AR")}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 font-semibold text-sm">
                  <span>Total</span>
                  <span className="text-lg">${pedido.total.toLocaleString("es-AR")}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Acciones */}
            {pedido.status === "pendiente" && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleRechazar}
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Rechazar
                </button>
                <button
                  onClick={handleConfirmar}
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <Check className="h-4 w-4" />
                  Confirmar
                </button>
              </div>
            )}

            {pedido.status !== "pendiente" && (
              <div className={`text-center text-sm font-medium py-2 rounded-lg ${
                pedido.status === "confirmado"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}>
                Pedido {pedido.status}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
