"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { deleteCashMovement } from "@/lib/actions/cash-movements"
import { getCompanySettings } from "@/lib/actions/company-settings"
import { formatCompanyCurrency } from "@/lib/utils/currency"
import type { CompanySettings, CashMovement } from "@/lib/types/erp"
import { toast } from "sonner"
import { TrendingUp, TrendingDown, Trash2, Loader2 } from "lucide-react"

interface CashMovementsListProps {
  movements: CashMovement[]
  onDelete?: () => void
}

export function CashMovementsList({ movements, onDelete }: CashMovementsListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getCompanySettings().then(setSettings).catch(console.error)
  }, [])

  const fmt = (n: number) => settings ? formatCompanyCurrency(n, settings) : `$${n.toFixed(2)}`

  const fmtDate = (d: string) => {
    const dt = new Date(d)
    return `${dt.getDate().toString().padStart(2,"0")}/${(dt.getMonth()+1).toString().padStart(2,"0")}/${dt.getFullYear()} ${dt.getHours().toString().padStart(2,"0")}:${dt.getMinutes().toString().padStart(2,"0")}`
  }

  const handleDelete = useCallback(async () => {
    if (!deleteId) return
    setLoading(true)
    try {
      const result = await deleteCashMovement(deleteId)
      if (result.error) { toast.error(result.error); return }
      toast.success("Movimiento eliminado")
      onDelete?.()
    } catch {
      toast.error("Error al eliminar el movimiento")
    } finally {
      setLoading(false)
      setDeleteId(null)
    }
  }, [deleteId, onDelete])

  const totalIncome = movements.filter(m => m.movement_type === "income").reduce((s, m) => s + m.amount, 0)
  const totalWithdrawals = movements.filter(m => m.movement_type === "withdrawal").reduce((s, m) => s + m.amount, 0)
  const net = totalIncome - totalWithdrawals

  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-500">
        <TrendingUp className="h-8 w-8 opacity-30" />
        <p className="text-xs">Sin movimientos en este turno</p>
      </div>
    )
  }

  return (
    <>
      {/* Confirm delete dialog */}
      {deleteId && (
        <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="border-2 border-[#808080] shadow-[4px_4px_0px_#000] w-80">
            <div className="bg-[#000080] px-3 py-1">
              <span className="text-white text-sm font-bold">⚠ Confirmar eliminación</span>
            </div>
            <div className="bg-[#d4d0c8] p-4 space-y-3">
              <p className="text-xs">¿Estás seguro? Esta acción no se puede deshacer.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteId(null)} disabled={loading}
                  className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={handleDelete} disabled={loading}
                  className="border border-[#808080] bg-[#ffcccc] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#ffaaaa] disabled:opacity-50 flex items-center gap-1">
                  {loading ? <><Loader2 className="h-3 w-3 animate-spin" /> Eliminando...</> : "🗑 Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {/* Totales */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Ingresos", value: fmt(totalIncome), color: "text-green-700", icon: <TrendingUp className="h-3 w-3" /> },
            { label: "Retiros", value: fmt(totalWithdrawals), color: "text-red-700", icon: <TrendingDown className="h-3 w-3" /> },
            { label: "Neto", value: fmt(net), color: net >= 0 ? "text-green-700" : "text-red-700", icon: null },
          ].map((s, i) => (
            <div key={i} className="border-2 border-[#808080] bg-white p-2 shadow-[inset_1px_1px_2px_#808080]">
              <div className="flex items-center gap-1 text-gray-500 mb-1">
                {s.icon}<span className="text-[10px]">{s.label}</span>
              </div>
              <div className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="border-2 border-[#808080] overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#d4d0c8] border-b-2 border-[#808080]">
                {["Tipo", "Monto", "Descripción", "Usuario", "Fecha", ""].map((h, i) => (
                  <th key={i} className={`px-2 py-1 font-bold border-r border-[#808080] last:border-r-0 ${i >= 1 && i <= 2 ? "text-left" : i >= 3 ? "text-left" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movements.map((m, idx) => (
                <tr key={m.id} className={`border-b border-[#e0e0e0] ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
                  <td className="px-2 py-1.5 border-r border-[#e0e0e0]">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold border ${
                      m.movement_type === "income"
                        ? "bg-[#d4edda] border-[#28a745] text-[#155724]"
                        : "bg-[#f8d7da] border-[#dc3545] text-[#721c24]"
                    }`}>
                      {m.movement_type === "income"
                        ? <><TrendingUp className="h-2.5 w-2.5" /> Ingreso</>
                        : <><TrendingDown className="h-2.5 w-2.5" /> Retiro</>}
                    </span>
                  </td>
                  <td className={`px-2 py-1.5 border-r border-[#e0e0e0] font-mono font-bold ${m.movement_type === "income" ? "text-green-700" : "text-red-700"}`}>
                    {fmt(m.amount)}
                  </td>
                  <td className="px-2 py-1.5 border-r border-[#e0e0e0] max-w-[180px] truncate">{m.description}</td>
                  <td className="px-2 py-1.5 border-r border-[#e0e0e0] text-gray-600">{m.created_by_name}</td>
                  <td className="px-2 py-1.5 border-r border-[#e0e0e0] text-gray-600 whitespace-nowrap">{fmtDate(m.created_at)}</td>
                  <td className="px-2 py-1.5 text-center">
                    <button onClick={() => setDeleteId(m.id)} disabled={loading}
                      className="text-red-600 hover:text-red-800 disabled:opacity-40">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
