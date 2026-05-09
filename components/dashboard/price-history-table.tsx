"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Filter, X, TrendingUp, TrendingDown, Download } from "lucide-react"
import { exportPriceChangesToCSV } from "@/lib/actions/price-changes"
import { toast } from "sonner"
import type { PriceChange } from "@/lib/types/erp"

interface PriceHistoryTableProps {
  changes: PriceChange[]
  employees?: Array<{ id: string; name: string }>
  products?: Array<{ id: string; name: string }>
  currencySymbol?: string
}

export function PriceHistoryTable({ changes, employees = [], products = [], currencySymbol = "$" }: PriceHistoryTableProps) {
  const [filtered, setFiltered] = useState(changes)
  const [typeFilter, setTypeFilter] = useState("all")
  const [empFilter, setEmpFilter] = useState("all")
  const [prodFilter, setProdFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [exporting, setExporting] = useState(false)

  const applyFilters = () => {
    let f = changes
    if (typeFilter !== "all") f = f.filter(c => c.price_type === typeFilter)
    if (empFilter !== "all") f = f.filter(c => c.changed_by === empFilter)
    if (prodFilter !== "all") f = f.filter(c => c.product_id === prodFilter)
    if (dateFrom) f = f.filter(c => new Date(c.created_at) >= new Date(dateFrom))
    if (dateTo) { const end = new Date(dateTo); end.setHours(23,59,59,999); f = f.filter(c => new Date(c.created_at) <= end); }
    setFiltered(f)
  }

  const clearFilters = () => {
    setTypeFilter("all"); setEmpFilter("all"); setProdFilter("all"); setDateFrom(""); setDateTo(""); setFiltered(changes)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const filters: any = {}
      if (typeFilter !== "all") filters.priceType = typeFilter
      if (empFilter !== "all") filters.employeeId = empFilter
      if (prodFilter !== "all") filters.productId = prodFilter
      if (dateFrom) filters.dateFrom = new Date(dateFrom).toISOString()
      if (dateTo) filters.dateTo = new Date(dateTo).toISOString()
      const csv = await exportPriceChangesToCSV(filters)
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `historial-precios-${format(new Date(), "yyyy-MM-dd")}.csv`
      link.click()
      toast.success("Exportado correctamente")
    } catch { toast.error("Error al exportar") }
    finally { setExporting(false) }
  }

  const fmt = (n: number) => `${currencySymbol}${n.toFixed(2)}`
  const f = "border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]"

  return (
    <div className="space-y-2 text-black">
      {/* Filters */}
      <div className="bg-[#d4d0c8] border border-[#808080] p-2 flex flex-wrap gap-2 items-end">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold">Tipo</span>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={f}>
            <option value="all">Todos</option>
            <option value="sale_price">Precio Venta</option>
            <option value="cost_price">Precio Costo</option>
          </select>
        </div>
        {products.length > 0 && (
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold">Producto</span>
            <select value={prodFilter} onChange={e => setProdFilter(e.target.value)} className={f + " max-w-[160px]"}>
              <option value="all">Todos</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
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
        <button onClick={handleExport} disabled={exporting || filtered.length === 0} className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 disabled:opacity-50">
          <Download className="h-3 w-3" /> CSV
        </button>
        <span className="text-xs text-gray-600 ml-auto">{filtered.length} de {changes.length} cambios</span>
      </div>

      {/* Table */}
      <div className="border border-[#808080] bg-white overflow-x-auto">
        <div className="grid grid-cols-[120px_1fr_100px_110px_110px_110px_120px_1fr] border-b-2 border-[#808080] bg-[#d4d0c8] min-w-[900px]">
          {["Fecha/Hora", "Producto", "Tipo", "Precio Ant.", "Precio Nuevo", "Diferencia", "Empleado", "Razón"].map((h, i) => (
            <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-xs text-gray-500">Sin cambios de precio</div>
        ) : filtered.map((c, idx) => {
          const diff = c.new_value - c.old_value
          const pct = c.old_value > 0 ? ((diff / c.old_value) * 100).toFixed(1) : "0.0"
          return (
            <div key={c.id} className={`grid grid-cols-[120px_1fr_100px_110px_110px_110px_120px_1fr] border-b border-[#e0e0e0] text-black min-w-[900px] ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
              <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0]">
                <div className="font-medium">{format(new Date(c.created_at), "dd/MM/yyyy")}</div>
                <div className="text-gray-500">{format(new Date(c.created_at), "HH:mm:ss")}</div>
              </div>
              <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0]">
                <div className="font-medium truncate">{c.product?.name ?? "—"}</div>
                {c.product?.sku && <div className="text-gray-500">SKU: {c.product.sku}</div>}
              </div>
              <div className="px-2 py-1.5 text-xs font-bold border-r border-[#e0e0e0] text-blue-700">
                {c.price_type === "sale_price" ? "Venta" : "Costo"}
              </div>
              <div className="px-2 py-1.5 text-xs text-right font-mono border-r border-[#e0e0e0]">{fmt(c.old_value)}</div>
              <div className="px-2 py-1.5 text-xs text-right font-mono font-bold border-r border-[#e0e0e0]">{fmt(c.new_value)}</div>
              <div className="px-2 py-1.5 text-xs text-right font-mono border-r border-[#e0e0e0]">
                <span className={`flex items-center justify-end gap-0.5 ${diff > 0 ? "text-green-700" : "text-red-600"}`}>
                  {diff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {diff > 0 ? "+" : ""}{fmt(diff)}
                </span>
                <span className={`text-[10px] ${diff > 0 ? "text-green-700" : "text-red-600"}`}>({diff > 0 ? "+" : ""}{pct}%)</span>
              </div>
              <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0]">
                <div className="font-medium truncate">{c.changed_by_name}</div>
                <div className="text-gray-500 capitalize">{c.changed_by_role}</div>
              </div>
              <div className="px-2 py-1.5 text-xs text-gray-600 truncate">{c.reason ?? "—"}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
