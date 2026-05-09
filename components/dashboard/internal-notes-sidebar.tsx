"use client"

import { useState, useEffect, useOptimistic } from "react"
import { X, Loader2 } from "lucide-react"
import { InternalNoteForm } from "./internal-note-form"
import { InternalNoteItem } from "./internal-note-item"
import { InternalNotesFilters } from "./internal-notes-filters"
import { getInternalNotes } from "@/lib/actions/internal-notes"
import { createClient } from "@/lib/supabase/client"
import type { InternalNote, InternalNotesFilters as Filters } from "@/lib/types/erp"

interface InternalNotesSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function InternalNotesSidebar({ isOpen, onClose }: InternalNotesSidebarProps) {
  const [notes, setNotes] = useState<InternalNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({ note_type: "all", show_resolved: false })

  const [optimisticNotes, addOptimisticNote] = useOptimistic(
    notes,
    (state, newNote: InternalNote) => [newNote, ...state]
  )

  useEffect(() => {
    if (!isOpen) return
    loadNotes()
    const cleanup = subscribeToNotes()
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handleEscape)
    return () => { cleanup(); document.removeEventListener("keydown", handleEscape) }
  }, [isOpen, onClose])

  async function loadNotes() {
    setIsLoading(true)
    try { const data = await getInternalNotes(); setNotes(data) }
    catch (error) { console.error("Error loading notes:", error) }
    finally { setIsLoading(false) }
  }

  function subscribeToNotes() {
    const supabase = createClient()
    const channel = supabase.channel("internal_notes_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "internal_notes" }, () => loadNotes())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "internal_notes" }, () => loadNotes())
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "internal_notes" }, () => loadNotes())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }

  const uniqueNotes = Array.from(new Map(optimisticNotes.map(n => [n.id, n])).values())
  const filteredNotes = uniqueNotes.filter(n => {
    if (!filters.show_resolved && n.is_resolved) return false
    if (filters.note_type !== "all" && n.note_type !== filters.note_type) return false
    return true
  })

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Sidebar — retro window */}
      <div className="fixed right-0 top-0 h-full w-96 z-50 flex flex-col border-l-2 border-[#808080] shadow-[-4px_0_0_#000] bg-[#d4d0c8] select-none">

        {/* Title bar */}
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between shrink-0">
          <span className="text-white text-sm font-bold">📝 Notas Internas</span>
          <button onClick={onClose}
            className="w-5 h-5 bg-[#d4d0c8] border border-[#808080] text-black text-xs flex items-center justify-center font-bold hover:bg-[#c0c0c0]">
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="border-b-2 border-[#808080] p-3 shrink-0 bg-[#d4d0c8]">
          <InternalNoteForm onNoteCreated={addOptimisticNote} />
        </div>

        {/* Filters */}
        <div className="border-b border-[#808080] px-3 py-2 shrink-0 bg-[#c0c0c0]">
          <InternalNotesFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#d4d0c8]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-xs text-gray-600">
              <Loader2 className="h-3 w-3 animate-spin" /> Cargando notas...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-600">
              {filters.show_resolved || filters.note_type !== "all"
                ? "No hay notas con los filtros aplicados"
                : "No hay notas para mostrar"}
            </div>
          ) : filteredNotes.map(note => (
            <InternalNoteItem key={note.id} note={note} />
          ))}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-[#808080] px-3 py-1 bg-[#c0c0c0] shrink-0">
          <span className="text-[10px] text-gray-600">{filteredNotes.length} nota(s)</span>
        </div>
      </div>
    </>
  )
}

