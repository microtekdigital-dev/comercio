"use client";

import { useState, useTransition } from "react";
import { toggleProductoPublicado } from "@/lib/actions/catalogo";
import { Package } from "lucide-react";

interface Producto {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock_quantity: number;
  published: boolean;
  image_url: string | null;
}

interface Props {
  productos: Producto[];
}

export function ProductosPublicadosTable({ productos }: Props) {
  const [states, setStates] = useState<Record<string, boolean>>(
    Object.fromEntries(productos.map((p) => [p.id, p.published]))
  );
  const [pending, startTransition] = useTransition();

  function handleToggle(productId: string) {
    const newValue = !states[productId];
    setStates((prev) => ({ ...prev, [productId]: newValue }));
    startTransition(async () => {
      await toggleProductoPublicado(productId, newValue);
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b">
        <h2 className="font-semibold text-gray-900">Productos publicados</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Activá los productos que querés mostrar en tu catálogo.
        </p>
      </div>

      {productos.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay productos activos.</p>
        </div>
      ) : (
        <div className="divide-y">
          {productos.map((producto) => (
            <div
              key={producto.id}
              className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors"
            >
              {/* Imagen */}
              {producto.image_url ? (
                <img
                  src={producto.image_url}
                  alt={producto.name}
                  className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-gray-300" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{producto.name}</p>
                <p className="text-xs text-gray-400">
                  {producto.sku && `SKU: ${producto.sku} · `}
                  Stock: {producto.stock_quantity} · ${producto.price.toLocaleString("es-AR")}
                </p>
              </div>

              {/* Toggle publicado */}
              <button
                onClick={() => handleToggle(producto.id)}
                disabled={pending}
                role="switch"
                aria-checked={states[producto.id]}
                aria-label={`${states[producto.id] ? "Despublicar" : "Publicar"} ${producto.name}`}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  states[producto.id] ? "bg-blue-600" : "bg-gray-200"
                } ${pending ? "opacity-60" : ""}`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    states[producto.id] ? "translate-x-4.5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
