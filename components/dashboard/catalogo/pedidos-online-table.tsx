"use client";

import { useState } from "react";
import type { OnlineOrder } from "@/lib/types/catalogo";
import { DetallePedidoOnline } from "./detalle-pedido-online";
import { ShoppingBag } from "lucide-react";

interface Props {
  pedidos: OnlineOrder[];
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pendiente: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800" },
  confirmado: { label: "Confirmado", className: "bg-green-100 text-green-800" },
  rechazado: { label: "Rechazado", className: "bg-red-100 text-red-800" },
};

type FilterStatus = "todos" | "pendiente" | "confirmado" | "rechazado";

export function PedidosOnlineTable({ pedidos: initialPedidos }: Props) {
  const [pedidos, setPedidos] = useState<OnlineOrder[]>(initialPedidos);
  const [filter, setFilter] = useState<FilterStatus>("todos");
  const [selected, setSelected] = useState<OnlineOrder | null>(null);

  const filtered = filter === "todos" ? pedidos : pedidos.filter((p) => p.status === filter);

  function handleStatusChange(orderId: string, newStatus: "confirmado" | "rechazado") {
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === orderId
          ? {
              ...p,
              status: newStatus,
              confirmed_at: newStatus === "confirmado" ? new Date().toISOString() : p.confirmed_at,
              rejected_at: newStatus === "rechazado" ? new Date().toISOString() : p.rejected_at,
            }
          : p
      )
    );
    setSelected(null);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">Pedidos online</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""} recibido{pedidos.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Filtros */}
        <div className="flex gap-1">
          {(["todos", "pendiente", "confirmado", "rechazado"] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors capitalize ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay pedidos{filter !== "todos" ? ` ${filter}s` : ""}.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3">Pedido</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((pedido) => {
                const badge = STATUS_LABELS[pedido.status];
                return (
                  <tr
                    key={pedido.id}
                    onClick={() => setSelected(pedido)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3 font-medium text-gray-900">{pedido.order_number}</td>
                    <td className="px-6 py-3 text-gray-700">
                      <div>{pedido.visitor_name}</div>
                      <div className="text-xs text-gray-400">{pedido.visitor_phone}</div>
                    </td>
                    <td className="px-6 py-3 font-semibold text-gray-900">
                      ${pedido.total.toLocaleString("es-AR")}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {new Date(pedido.created_at).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetallePedidoOnline
          pedido={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
