"use client"

import type { InternalNotesFilters, NoteType } from "@/lib/types/erp"

const NOTE_TYPE_OPTIONS: { value: NoteType | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "general", label: "General" },
  { value: "cliente", label: "Cliente" },
  { value: "stock", label: "Stock" },
  { value: "proveedor", label: "Proveedor" },
  { value: "urgente", label: "⚠ Urgente" },
]

interface InternalNotesFiltersProps {
  filters: InternalNotesFilters
  onFiltersChange: (filters: InternalNotesFilters) => void
}

export function InternalNotesFilters({ filters, onFiltersChange }: InternalNotesFiltersProps) {
  const f = "border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]"

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-bold text-black">Tipo:</span>
        <select value={filters.note_type || "all"} onChange={e => onFiltersChange({ ...filters, note_type: e.target.value as NoteType | "all" })} className={f}>
          {NOTE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-black">
        <input type="checkbox" checked={filters.show_resolved} onChange={e => onFiltersChange({ ...filters, show_resolved: e.target.checked })} className="border border-[#808080]" />
        Mostrar resueltas
      </label>
    </div>
  )
}
