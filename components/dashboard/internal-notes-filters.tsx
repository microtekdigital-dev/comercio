"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { InternalNotesFilters, NoteType } from "@/lib/types/erp"

interface InternalNotesFiltersProps {
  filters: InternalNotesFilters
  onFiltersChange: (filters: InternalNotesFilters) => void
}

const NOTE_TYPE_OPTIONS: { value: NoteType | "all"; label: string }[] = [
  { value: "all", label: "Todos los tipos" },
  { value: "general", label: "General" },
  { value: "cliente", label: "Cliente" },
  { value: "stock", label: "Stock" },
  { value: "proveedor", label: "Proveedor" },
  { value: "urgente", label: "Urgente" },
]

export function InternalNotesFilters({
  filters,
  onFiltersChange,
}: InternalNotesFiltersProps) {
  const handleTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      note_type: value as NoteType | "all",
    })
  }

  const handleShowResolvedChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      show_resolved: checked,
    })
  }

  return (
    <div className="space-y-4">
      {/* Filter by note type */}
      <div className="space-y-2">
        <Label htmlFor="note-type-filter" className="text-sm font-medium">
          Filtrar por Tipo
        </Label>
        <Select
          value={filters.note_type || "all"}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger
            id="note-type-filter"
            className="text-sm"
            aria-label="Filtrar por tipo de nota"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOTE_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Toggle to show/hide resolved notes */}
      <div className="flex items-center justify-between">
        <Label
          htmlFor="show-resolved"
          className="text-sm font-medium cursor-pointer"
        >
          Mostrar notas resueltas
        </Label>
        <Switch
          id="show-resolved"
          checked={filters.show_resolved}
          onCheckedChange={handleShowResolvedChange}
          aria-label="Mostrar notas resueltas"
        />
      </div>
    </div>
  )
}
