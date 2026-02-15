"use client"

import { useState, useEffect, useOptimistic } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
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

export function InternalNotesSidebar({
  isOpen,
  onClose,
}: InternalNotesSidebarProps) {
  const [notes, setNotes] = useState<InternalNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    note_type: "all",
    show_resolved: false,
  })

  const [optimisticNotes, addOptimisticNote] = useOptimistic(
    notes,
    (state, newNote: InternalNote) => [newNote, ...state]
  )

  useEffect(() => {
    if (isOpen) {
      loadNotes()
      const cleanup = subscribeToNotes()
      
      // Handle ESC key to close sidebar
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose()
        }
      }
      
      document.addEventListener("keydown", handleEscape)
      
      return () => {
        cleanup()
        document.removeEventListener("keydown", handleEscape)
      }
    }
  }, [isOpen, onClose])

  async function loadNotes() {
    setIsLoading(true)
    try {
      const data = await getInternalNotes()
      setNotes(data)
    } catch (error) {
      console.error("Error loading notes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function subscribeToNotes() {
    const supabase = createClient()

    const channel = supabase
      .channel("internal_notes_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "internal_notes" },
        () => loadNotes()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "internal_notes" },
        () => loadNotes()
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "internal_notes" },
        () => loadNotes()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  // Deduplicate notes by ID (to avoid showing optimistic + realtime duplicates)
  const uniqueNotes = Array.from(
    new Map(optimisticNotes.map((note) => [note.id, note])).values()
  )

  // Filter notes based on current filters
  const filteredNotes = uniqueNotes.filter((note) => {
    if (!filters.show_resolved && note.is_resolved) return false
    if (filters.note_type !== "all" && note.note_type !== filters.note_type)
      return false
    return true
  })

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-label="Cerrar sidebar"
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-background">
          <h2 className="text-lg font-semibold">Notas Internas</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <div className="p-4 border-b bg-background">
          <InternalNoteForm onNoteCreated={addOptimisticNote} />
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-background">
          <InternalNotesFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Notes List */}
        <div className="flex-1 p-4 bg-background">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">
              Cargando notas...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {filters.show_resolved || filters.note_type !== "all"
                ? "No hay notas que coincidan con los filtros"
                : "No hay notas para mostrar"}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map((note) => (
                <InternalNoteItem key={note.id} note={note} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
