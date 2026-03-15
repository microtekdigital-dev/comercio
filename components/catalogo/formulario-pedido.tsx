"use client";

import { useState } from "react";
import type { CartItem } from "@/lib/types/catalogo";
import { ConfirmacionPedido } from "./confirmacion-pedido";
import { ArrowLeft, Loader2 } from "lucide-react";

interface Props {
  cart: CartItem[];
  slug: string;
  onSuccess: () => void;
  onBack: () => void;
}

interface FormData {
  visitor_name: string;
  visitor_phone: string;
  visitor_address: string;
  visitor_notes: string;
}

interface FormErrors {
  visitor_name?: string;
  visitor_phone?: string;
}

export function FormularioPedido({ cart, slug, onSuccess, onBack }: Props) {
  const [form, setForm] = useState<FormData>({
    visitor_name: "",
    visitor_phone: "",
    visitor_address: "",
    visitor_notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!form.visitor_name.trim()) {
      newErrors.visitor_name = "El nombre es obligatorio";
    }
    if (!form.visitor_phone.trim()) {
      newErrors.visitor_phone = "El teléfono es obligatorio";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError(null);

    try {
      const items = cart.map((i) => ({
        product_id: i.product_id,
        variant_id: i.variant_id,
        quantity: i.quantity,
      }));

      const res = await fetch("/api/catalogo/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          visitor_name: form.visitor_name.trim(),
          visitor_phone: form.visitor_phone.trim(),
          visitor_address: form.visitor_address.trim() || undefined,
          visitor_notes: form.visitor_notes.trim() || undefined,
          items,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error ?? "Error al procesar el pedido");
        return;
      }

      setOrderNumber(data.order_number);
    } catch {
      setServerError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (orderNumber) {
    return <ConfirmacionPedido orderNumber={orderNumber} onBack={onSuccess} />;
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Volver al carrito"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Tus datos</h3>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.visitor_name}
            onChange={(e) => setForm({ ...form, visitor_name: e.target.value })}
            placeholder="Tu nombre"
            className={`w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.visitor_name ? "border-red-400" : "border-gray-300 dark:border-gray-600"
            }`}
          />
          {errors.visitor_name && (
            <p className="text-xs text-red-500 mt-1">{errors.visitor_name}</p>
          )}
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Teléfono <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={form.visitor_phone}
            onChange={(e) => setForm({ ...form, visitor_phone: e.target.value })}
            placeholder="Tu número de teléfono"
            className={`w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.visitor_phone ? "border-red-400" : "border-gray-300 dark:border-gray-600"
            }`}
          />
          {errors.visitor_phone && (
            <p className="text-xs text-red-500 mt-1">{errors.visitor_phone}</p>
          )}
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Dirección de entrega <span className="text-gray-400 text-xs">(opcional)</span>
          </label>
          <input
            type="text"
            value={form.visitor_address}
            onChange={(e) => setForm({ ...form, visitor_address: e.target.value })}
            placeholder="Tu dirección"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notas adicionales <span className="text-gray-400 text-xs">(opcional)</span>
          </label>
          <textarea
            value={form.visitor_notes}
            onChange={(e) => setForm({ ...form, visitor_notes: e.target.value })}
            placeholder="Alguna aclaración sobre tu pedido..."
            rows={3}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {serverError && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-sm text-red-700 dark:text-red-400">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Enviando pedido..." : "Enviar pedido"}
        </button>
      </form>
    </div>
  );
}
