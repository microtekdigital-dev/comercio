"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Filter, X, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import type { StockMovement } from "@/lib/types/erp"

const TYPE_LABELS: Record<string, string> = {
  purchase: "Compra", sale: "Venta",
  adjustment_in: "Ajuste +", adjustment_out: "Ajuste -",
  return_in: "Devolución +", return_out: "Devolución -",
}
const TYPE_COLORS: Record<string, string> = {
  purchase: "text-green-700", sale: "text-blue-700",
  adjustment_in: "text-green-700", adjustment_out: "text-red-600",
  return_in: "text-green-700", return_out: "text-red-600",
}

interface StockHistoryTableProps {
  movements: StockMovement[]
  employees?: Array<{ id: string; name: string }>
}

export function StockHistoryTable({ movements, employees = [] }: StockHistoryTableProps) {
  const [filtered, setFiltered] = useState(movements)
  const [typeFilter, setTypeFilter] = useState("all")
  const [empFilter, setEmpFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const applyFilters = () => {
    let f = movements
    if (typeFilter !== "all") f = f.filter(m => m.movement_type === typeFilter)
    if (empFilter !== "all") f = f.filter(m => m.created_by === empFilter)
    if (dateFrom) f = f.filter(m => new Date(m.created_at) >= new Date(dateFrom))
    if (dateTo) { const end = new Date(dateTo); end.setHours(23,59,59,999); f = f.filter(m => new Date(m.created_at) <= end); }
    setFiltered(f)
  }

  const clearFilters = () => {
    setTypeFilter("all"); setEmpFilter("all"); setDateFrom(""); setDateTo(""); setFiltered(movements)
  }

  const f = "border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]"

  return (
    <div className="space-y-2 text-black">
      {/* Filters */}
      <div className="bg-[#d4d0c8] border border-[#808080] p-2 flex flex-wrap gap-2 items-end">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold">Tipo</span>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={f}>
            <option value="all">Todos</option>
            {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        {employees.length > 0 && (
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold">Empleado</span>
            <select value={empFilter} onChange={e => setEmpFilter(e.target.value)} className={f}>
              <option value="all">Todos</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold">Desde</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={f} />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold">Hasta</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={f} />
        </div>
        <button onClick={applyFilters} className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1">
          <Filter className="h-3 w-3" /> Filtrar
        </button>
        <button onClick={clearFilters} className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 text-red-700">
          <X className="h-3 w-3" /> Limpiar
        </button>
        <span className="text-xs text-gray-600 ml-auto">{filtered.length} de {movements.length} movimientos</span>
      </div>

      {/* Table */}
      <div className="border border-[#808080] bg-white overflow-x-auto">
        <div className="grid grid-cols-[120px_1fr_100px_80px_80px_80px_120px_80px] border-b-2 border-[#808080] bg-[#d4d0c8] min-w-[800px]">
          {["Fecha/Hora", "Producto", "Tipo", "Cantidad", "Ant.", "Nuevo", "Empleado", "Origen"].map((h, i) => (
            <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-xs text-gray-500">Sin movimientos</div>
        ) : filtered.map((m, idx) => (
          <div key={m.id} className={`grid grid-cols-[120px_1fr_100px_80px_80px_80px_120px_80px] border-b border-[#e0e0e0] text-black min-w-[800px] ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
            <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0]">
              <div className="font-medium">{format(new Date(m.created_at), "dd/MM/yyyy")}</div>
              <div className="text-gray-500">{format(new Date(m.created_at), "HH:mm:ss")}</div>
            </div>
            <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0]">
              <div className="font-medium truncate">{m.product?.name}</div>
              {m.product?.sku && <div className="text-gray-500">SKU: {m.product.sku}</div>}
            </div>
            <div className={`px-2 py-1.5 text-xs font-bold border-r border-[#e0e0e0] ${TYPE_COLORS[m.movement_type] ?? ""}`}>
              {TYPE_LABELS[m.movement_type] ?? m.movement_type}
            </div>
            <div className="px-2 py-1.5 text-xs text-right font-mono font-bold border-r border-[#e0e0e0]">
              <span className={`flex items-center justify-end gap-0.5 ${m.quantity > 0 ? "text-green-700" : "text-red-600"}`}>
                {m.quantity > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {m.quantity > 0 ? "+" : ""}{m.quantity}
              </span>
            </div>
            <div className="px-2 py-1.5 text-xs text-right font-mono border-r border-[#e0e0e0]">{m.stock_before}</div>
            <div className="px-2 py-1.5 text-xs text-right font-mono font-bold border-r border-[#e0e0e0]">{m.stock_after}</div>
            <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] truncate">{m.created_by_name}</div>
            <div className="px-2 py-1.5 text-xs text-gray-500">
              {m.sale_id ? "Venta" : m.purchase_order_id ? "O. Compra" : "Manual"}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
