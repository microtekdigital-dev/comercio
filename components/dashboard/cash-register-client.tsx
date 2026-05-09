"use client"

import { useEffect, useState } from "react"
import { getCashRegisterClosures, getCashRegisterOpenings } from "@/lib/actions/cash-register"
import { getCashMovements } from "@/lib/actions/cash-movements"
import { getCompanySettings } from "@/lib/actions/company-settings"
import { formatCompanyCurrency } from "@/lib/utils/currency"
import type { CompanySettings } from "@/lib/types/erp"
import { Plus, TrendingUp, TrendingDown, Lock, Eye, Loader2, DollarSign } from "lucide-react"
import Link from "next/link"
import type { CashRegisterClosure, CashRegisterOpening, CashMovement } from "@/lib/types/erp"
import { CashMovementModal } from "@/components/dashboard/cash-movement-modal"
import { CashMovementsList } from "@/components/dashboard/cash-movements-list"

export function CashRegisterClient() {
  const [closures, setClosures] = useState<CashRegisterClosure[]>([])
  const [openings, setOpenings] = useState<CashRegisterOpening[]>([])
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [incomeModalOpen, setIncomeModalOpen] = useState(false)
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false)
  const [settings, setSettings] = useState<CompanySettings | null>(null)

  const loadData = async () => {
    const [closuresData, openingsData] = await Promise.all([getCashRegisterClosures(), getCashRegisterOpenings()])
    setClosures(closuresData)
    setOpenings(openingsData)
    const closedIds = new Set(closuresData.map(c => c.opening_id).filter(Boolean))
    const activeOpening = openingsData.find(op => !closedIds.has(op.id))
    if (activeOpening) {
      const movements = await getCashMovements({ openingId: activeOpening.id })
      setCashMovements(movements)
    } else { setCashMovements([]) }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    getCompanySettings().then(setSettings).catch(console.error)
  }, [])

  const fmt = (n: number) => settings ? formatCompanyCurrency(n, settings) : `$${n.toFixed(2)}`
  const fmtDate = (d: string) => {
    const dt = new Date(d)
    return `${dt.getDate().toString().padStart(2,"0")}/${(dt.getMonth()+1).toString().padStart(2,"0")}/${dt.getFullYear()} ${dt.getHours().toString().padStart(2,"0")}:${dt.getMinutes().toString().padStart(2,"0")}`
  }

  const recentOpenings = openings.slice(0, 5)
  const hasOpenOpening = openings.some(op => !closures.some(c => c.opening_id === op.id))

  if (loading) return (
    <div className="flex items-center justify-center py-8 gap-2 text-xs text-gray-500">
      <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
    </div>
  )

  const btn = (disabled: boolean, onClick: () => void, icon: React.ReactNode, label: string) => (
    <button onClick={onClick} disabled={disabled}
      className="border border-[#808080] bg-[#d4d0c8] px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-40 flex items-center gap-1">
      {icon}{label}
    </button>
  )

  return (
    <div className="space-y-3 text-black">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {btn(!hasOpenOpening, () => setIncomeModalOpen(true),
          hasOpenOpening ? <TrendingUp className="h-3 w-3" /> : <Lock className="h-3 w-3" />, "Registrar Ingreso")}
        {btn(!hasOpenOpening, () => setWithdrawalModalOpen(true),
          hasOpenOpening ? <TrendingDown className="h-3 w-3" /> : <Lock className="h-3 w-3" />, "Registrar Retiro")}
        <Link href="/dashboard/cash-register/opening/new"
          className={`border border-[#808080] bg-[#d4d0c8] px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 ${hasOpenOpening ? "opacity-40 pointer-events-none" : ""}`}>
          {hasOpenOpening ? <Lock className="h-3 w-3" /> : <Plus className="h-3 w-3" />} Nueva Apertura
        </Link>
        <Link href="/dashboard/cash-register/new"
          className={`border border-[#808080] bg-[#d4d0c8] px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 ${!hasOpenOpening ? "opacity-40 pointer-events-none" : ""}`}>
          {!hasOpenOpening ? <Lock className="h-3 w-3" /> : <Plus className="h-3 w-3" />} Nuevo Cierre
        </Link>
      </div>

      {/* Status alert */}
      <div className={`border-2 px-3 py-2 text-xs font-bold ${hasOpenOpening ? "border-blue-400 bg-blue-50 text-blue-800" : "border-amber-400 bg-amber-50 text-amber-800"}`}>
        {hasOpenOpening
          ? "ℹ Hay una apertura pendiente de cierre."
          : "⚠ No hay aperturas activas. Creá una apertura antes de registrar movimientos."}
      </div>

      {/* Cash movements */}
      {hasOpenOpening && cashMovements.length > 0 && (
        <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
          <div className="bg-[#000080] px-3 py-1">
            <span className="text-white text-sm font-bold">💵 Movimientos del Turno Actual</span>
          </div>
          <div className="bg-[#d4d0c8] p-2">
            <CashMovementsList movements={cashMovements} onDelete={loadData} />
          </div>
        </div>
      )}

      {/* Recent openings */}
      {recentOpenings.length > 0 && (
        <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
          <div className="bg-[#000080] px-3 py-1">
            <span className="text-white text-sm font-bold">🕐 Aperturas Recientes</span>
          </div>
          <div className="bg-white overflow-x-auto">
            <div className="grid grid-cols-[140px_100px_1fr_120px] border-b-2 border-[#808080] bg-[#d4d0c8]">
              {["Fecha", "Turno", "Abierto por", "Monto Inicial"].map((h, i) => (
                <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>
              ))}
            </div>
            {recentOpenings.map((op, idx) => (
              <div key={op.id} className={`grid grid-cols-[140px_100px_1fr_120px] border-b border-[#e0e0e0] ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0]">{fmtDate(op.opening_date)}</div>
                <div className="px-2 py-1.5 text-xs font-bold border-r border-[#e0e0e0]">{op.shift}</div>
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] truncate">{op.opened_by_name}</div>
                <div className="px-2 py-1.5 text-xs text-right font-mono font-bold text-green-700">{fmt(op.initial_cash_amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Closures */}
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1">
          <span className="text-white text-sm font-bold">💰 Cierres de Caja ({closures.length})</span>
        </div>
        {closures.length === 0 ? (
          <div className="bg-white flex flex-col items-center justify-center py-10 gap-2 text-gray-500">
            <DollarSign className="h-8 w-8 opacity-30" />
            <p className="text-xs">Sin cierres de caja</p>
          </div>
        ) : (
          <div className="bg-white overflow-x-auto">
            <div className="grid grid-cols-[140px_80px_1fr_100px_100px_100px_100px_80px] border-b-2 border-[#808080] bg-[#d4d0c8]">
              {["Fecha", "Turno", "Cerrado por", "Total Ventas", "Efectivo", "Tarjeta", "Transfer.", ""].map((h, i) => (
                <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>
              ))}
            </div>
            {closures.map((c, idx) => (
              <div key={c.id} className={`grid grid-cols-[140px_80px_1fr_100px_100px_100px_100px_80px] border-b border-[#e0e0e0] hover:bg-[#000080] hover:text-white group text-black ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{fmtDate(c.closure_date)}</div>
                <div className="px-2 py-1.5 text-xs font-bold border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{c.shift ?? "—"}</div>
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">{c.closed_by_name}</div>
                <div className="px-2 py-1.5 text-xs text-right font-mono font-bold border-r border-[#e0e0e0] group-hover:border-[#3333aa]">
                  {fmt(c.total_sales_amount)}
                  <div className="text-[10px] font-normal opacity-70">{c.total_sales_count} ventas</div>
                </div>
                <div className="px-2 py-1.5 text-xs text-right font-mono border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{fmt(c.cash_sales)}</div>
                <div className="px-2 py-1.5 text-xs text-right font-mono border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{fmt(c.card_sales)}</div>
                <div className="px-2 py-1.5 text-xs text-right font-mono border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{fmt(c.transfer_sales)}</div>
                <div className="px-2 py-1.5 text-xs text-center">
                  <Link href={`/dashboard/cash-register/${c.id}`} className="text-[#000080] group-hover:text-white underline flex items-center justify-center gap-0.5">
                    <Eye className="h-3 w-3" /> Ver
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CashMovementModal type="income" open={incomeModalOpen} onOpenChange={setIncomeModalOpen} onSuccess={loadData} />
      <CashMovementModal type="withdrawal" open={withdrawalModalOpen} onOpenChange={setWithdrawalModalOpen} onSuccess={loadData} />
    </div>
  )
}
