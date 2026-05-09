"use client"

import { useState, startTransition } from "react"
import { createInternalNote } from "@/lib/actions/internal-notes"
import type { NoteType, InternalNote } from "@/lib/types/erp"
import { toast } from "sonner"
import { Loader2, Plus } from "lucide-react"

const NOTE_TYPES: { value: NoteType; label: string }[] = [
  { value: "general", label: "General" },
  { value: "cliente", label: "Cliente" },
  { value: "stock", label: "Stock" },
  { value: "proveedor", label: "Proveedor" },
  { value: "urgente", label: "⚠ Urgente" },
]

interface InternalNoteFormProps {
  onNoteCreated?: (note: InternalNote) => void
}

export function InternalNoteForm({ onNoteCreated }: InternalNoteFormProps) {
  const [content, setContent] = useState("")
  const [noteType, setNoteType] = useState<NoteType>("general")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) { toast.error("El contenido no puede estar vacío"); return }
    setLoading(true)
    try {
      const newNote = await createInternalNote({ content: trimmed, note_type: noteType })
      if (onNoteCreated) startTransition(() => onNoteCreated(newNote))
      setContent(""); setNoteType("general")
      toast.success("Nota creada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear la nota")
    } finally { setLoading(false) }
  }

  const f = "border border-[#808080] bg-white text-xs px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full"

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div>
        <label className="text-[10px] font-bold text-black block mb-0.5">Tipo</label>
        <select value={noteType} onChange={e => setNoteType(e.target.value as NoteType)} disabled={loading} className={f}>
          {NOTE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-bold text-black block mb-0.5">Contenido</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Escribí tu nota aquí..."
          rows={3}
          disabled={loading}
          className={f + " resize-none"}
        />
      </div>
      <button type="submit" disabled={loading || !content.trim()}
        className="w-full border border-[#808080] bg-[#d4d0c8] py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center justify-center gap-1">
        {loading ? <><Loader2 className="h-3 w-3 animate-spin" /> Creando...</> : <><Plus className="h-3 w-3" /> Crear Nota</>}
      </button>
    </form>
  )
}
