"use client"

import { useState, useTransition, useCallback } from "react"
import { getAuditLogs } from "@/lib/actions/audit-log"
import type { AuditLogEntry, AuditModule, AuditAction, AuditLogFilters } from "@/lib/actions/audit-log"
import { ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const MODULES: AuditModule[] = [
  "ventas", "devoluciones", "stock", "compras",
  "pagos", "reparaciones", "caja", "productos",
  "presupuestos", "clientes", "proveedores",
]

const ACTIONS: AuditAction[] = [
  "crear", "modificar", "cancelar", "eliminar",
  "recibir", "abrir", "cerrar", "movimiento",
  "cambio_precio", "pagar", "procesar",
]

const MODULE_COLORS: Record<AuditModule, string> = {
  ventas:       "bg-[#cce5ff] border-[#004085] text-[#004085]",
  devoluciones: "bg-[#ffeeba] border-[#856404] text-[#856404]",
  stock:        "bg-[#fff3cd] border-[#856404] text-[#856404]",
  compras:      "bg-[#e2d9f3] border-[#4a235a] text-[#4a235a]",
  pagos:        "bg-[#d4edda] border-[#155724] text-[#155724]",
  reparaciones: "bg-[#f8d7da] border-[#721c24] text-[#721c24]",
  caja:         "bg-[#d1ecf1] border-[#0c5460] text-[#0c5460]",
  productos:    "bg-[#dde5ff] border-[#1a237e] text-[#1a237e]",
  presupuestos: "bg-[#fce4ec] border-[#880e4f] text-[#880e4f]",
  clientes:     "bg-[#e0f7fa] border-[#006064] text-[#006064]",
  proveedores:  "bg-[#f1f8e9] border-[#33691e] text-[#33691e]",
}

const f = "border border-[#808080] bg-white text-xs px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]"

interface Props { initialLogs: AuditLogEntry[] }

export function AuditLogTable({ initialLogs }: Props) {
  const [logs, setLogs] = useState<AuditLogEntry[]>(initialLogs)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialLogs.length === 50)
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null)
  const [isPending, startTransition] = useTransition()

  const [filters, setFilters] = useState({
    module: "", action: "", userId: "", dateFrom: "", dateTo: "",
  })

  const fetchLogs = useCallback((newFilters: typeof filters, newPage: number) => {
    startTransition(async () => {
      const params: AuditLogFilters = {
        page: newPage, pageSize: 50,
        ...(newFilters.module   && { module:   newFilters.module   as AuditModule }),
        ...(newFilters.action   && { action:   newFilters.action   as AuditAction }),
        ...(newFilters.userId   && { userId:   newFilters.userId }),
        ...(newFilters.dateFrom && { dateFrom: newFilters.dateFrom }),
        ...(newFilters.dateTo   && { dateTo:   newFilters.dateTo }),
      }
      const result = await getAuditLogs(params)
      setLogs(result)
      setHasMore(result.length === 50)
    })
  }, [])

  const handleFilterChange = useCallback((key: keyof typeof filters, value: string) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value }
      setPage(1)
      fetchLogs(next, 1)
      return next
    })
  }, [fetchLogs])

  const clearFilters = useCallback(() => {
    const empty = { module: "", action: "", userId: "", dateFrom: "", dateTo: "" }
    setFilters(empty)
    setPage(1)
    fetchLogs(empty, 1)
  }, [fetchLogs])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
    fetchLogs(filters, newPage)
  }, [filters, fetchLogs])

  const hasActiveFilters = Object.values(filters).some(Boolean)

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="border-2 border-[#808080] bg-white p-2 shadow-[inset_1px_1px_2px_#808080]">
        <div className="bg-[#c0c0c0] border-b border-[#808080] -mx-2 -mt-2 px-2 py-1 mb-2">
          <span className="text-xs font-bold">Filtros</span>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <div className="text-[10px] font-bold mb-0.5">Módulo</div>
            <select value={filters.module || ""} onChange={e => handleFilterChange("module", e.target.value)} className={f + " w-36"}>
              <option value="">Todos</option>
              {MODULES.map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[10px] font-bold mb-0.5">Acción</div>
            <select value={filters.action || ""} onChange={e => handleFilterChange("action", e.target.value)} className={f + " w-36"}>
              <option value="">Todas</option>
              {ACTIONS.map(a => <option key={a} value={a} className="capitalize">{a.replace("_", " ")}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[10px] font-bold mb-0.5">Usuario</div>
            <input
              placeholder="ID de usuario..."
              value={filters.userId}
              onChange={e => handleFilterChange("userId", e.target.value)}
              className={f + " w-44"}
            />
          </div>
          <div>
            <div className="text-[10px] font-bold mb-0.5">Desde</div>
            <input type="date" value={filters.dateFrom} onChange={e => handleFilterChange("dateFrom", e.target.value)} className={f} />
          </div>
          <div>
            <div className="text-[10px] font-bold mb-0.5">Hasta</div>
            <input type="date" value={filters.dateTo} onChange={e => handleFilterChange("dateTo", e.target.value)} className={f} />
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="border border-[#808080] bg-[#d4d0c8] px-2 py-1 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1">
              <X className="h-3 w-3" /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="border-2 border-[#808080] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#d4d0c8] border-b-2 border-[#808080]">
                {["Fecha / Hora", "Módulo", "Acción", "Entidad", "Usuario", ""].map((h, i) => (
                  <th key={i} className="px-2 py-1.5 font-bold text-left border-r border-[#808080] last:border-r-0 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> Cargando...
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Sin registros para los filtros seleccionados</td></tr>
              ) : logs.map((entry, idx) => (
                <tr
                  key={entry.id}
                  className={`border-b border-[#e0e0e0] cursor-pointer hover:bg-[#e8e4dc] ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}
                  onClick={() => setSelectedEntry(entry)}
                >
                  <td className="px-2 py-1 border-r border-[#e0e0e0] whitespace-nowrap font-mono text-[10px] text-gray-600">
                    {format(new Date(entry.created_at), "dd/MM/yy HH:mm:ss", { locale: es })}
                  </td>
                  <td className="px-2 py-1 border-r border-[#e0e0e0]">
                    <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold border capitalize ${MODULE_COLORS[entry.module] ?? "bg-[#e0e0e0] border-[#808080]"}`}>
                      {entry.module}
                    </span>
                  </td>
                  <td className="px-2 py-1 border-r border-[#e0e0e0]">
                    <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold border border-[#808080] bg-[#d4d0c8] capitalize">
                      {entry.action.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-2 py-1 border-r border-[#e0e0e0]">
                    <span className="text-gray-600">{entry.entity_type}</span>
                    <span className="ml-1 font-mono text-[10px] text-gray-400">#{entry.entity_id.slice(0, 8)}</span>
                  </td>
                  <td className="px-2 py-1 border-r border-[#e0e0e0]">
                    {entry.user_name ?? <span className="font-mono text-[10px] text-gray-400">{entry.user_id.slice(0, 8)}...</span>}
                  </td>
                  <td className="px-2 py-1 text-center">
                    {entry.metadata && (
                      <span className="text-blue-700 underline text-[10px] cursor-pointer">Ver</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">Página {page} · {logs.length} registros</span>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || isPending}
            className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-40 flex items-center gap-1"
          >
            <ChevronLeft className="h-3 w-3" /> Anterior
          </button>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={!hasMore || isPending}
            className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-40 flex items-center gap-1"
          >
            Siguiente <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Panel de detalle (retro drawer) */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40" onClick={() => setSelectedEntry(null)}>
          <div
            className="w-full max-w-md h-full border-l-2 border-[#808080] shadow-[-4px_0px_0px_#000] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[#000080] px-3 py-1 flex items-center justify-between flex-shrink-0">
              <span className="text-white text-sm font-bold">🔍 Detalle del Evento</span>
              <button onClick={() => setSelectedEntry(null)} className="text-white hover:bg-[#cc0000] px-2 py-0.5 text-xs font-bold border border-[#6060a0]">✕</button>
            </div>
            <div className="bg-[#d4d0c8] p-3 overflow-y-auto flex-1 space-y-3">
              <div className="border-2 border-[#808080] bg-white p-3 shadow-[inset_1px_1px_2px_#808080]">
                <div className="bg-[#c0c0c0] border-b border-[#808080] -mx-3 -mt-3 px-3 py-1 mb-3">
                  <span className="text-xs font-bold">Información</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    ["Fecha", format(new Date(selectedEntry.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })],
                    ["Usuario", selectedEntry.user_name ?? selectedEntry.user_id],
                    ["Módulo", selectedEntry.module],
                    ["Acción", selectedEntry.action.replace("_", " ")],
                    ["Tipo entidad", selectedEntry.entity_type],
                    ["ID entidad", selectedEntry.entity_id.slice(0, 16) + "..."],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="text-[10px] text-gray-500 mb-0.5">{k}</div>
                      <div className="font-bold capitalize break-all">{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedEntry.metadata && (
                <div className="border-2 border-[#808080] bg-white p-3 shadow-[inset_1px_1px_2px_#808080]">
                  <div className="bg-[#c0c0c0] border-b border-[#808080] -mx-3 -mt-3 px-3 py-1 mb-3">
                    <span className="text-xs font-bold">Metadata</span>
                  </div>
                  <pre className="text-[10px] font-mono bg-[#f5f5f5] border border-[#808080] p-2 overflow-auto max-h-80 whitespace-pre-wrap break-all">
                    {JSON.stringify(selectedEntry.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="bg-[#d4d0c8] border-t-2 border-[#808080] px-3 py-2 flex justify-end flex-shrink-0">
              <button onClick={() => setSelectedEntry(null)} className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
