"use client"

import { useState, startTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createInternalNote } from "@/lib/actions/internal-notes"
import type { NoteType, InternalNote } from "@/lib/types/erp"
import { toast } from "sonner"
import { Loader2, Plus } from "lucide-react"

interface InternalNoteFormProps {
  onNoteCreated?: (note: InternalNote) => void
}

const NOTE_TYPES: { value: NoteType; label: string; color: string }[] = [
  { value: "general", label: "General", color: "text-gray-600" },
  { value: "cliente", label: "Cliente", color: "text-blue-600" },
  { value: "stock", label: "Stock", color: "text-orange-600" },
  { value: "proveedor", label: "Proveedor", color: "text-purple-600" },
  { value: "urgente", label: "Urgente", color: "text-red-600" },
]

export function InternalNoteForm({ onNoteCreated }: InternalNoteFormProps) {
  const [content, setContent] = useState("")
  const [noteType, setNoteType] = useState<NoteType>("general")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validación de contenido vacío
    const trimmedContent = content.trim()
    if (trimmedContent.length === 0) {
      toast.error("El contenido de la nota no puede estar vacío")
      return
    }

    setLoading(true)

    try {
      const newNote = await createInternalNote({
        content: trimmedContent,
        note_type: noteType,
      })

      // Optimistic update - envolver en startTransition
      if (onNoteCreated) {
        startTransition(() => {
          onNoteCreated(newNote)
        })
      }

      // Limpiar formulario
      setContent("")
      setNoteType("general")
      
      toast.success("Nota creada exitosamente")
    } catch (error) {
      console.error("Error creating note:", error)
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Error al crear la nota. Por favor, intenta nuevamente."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="note-content">Contenido</Label>
        <Textarea
          id="note-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe tu nota aquí..."
          rows={3}
          disabled={loading}
          className="resize-none"
          aria-label="Contenido de la nota"
          aria-required="true"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note-type">Tipo de Nota</Label>
        <Select
          value={noteType}
          onValueChange={(value) => setNoteType(value as NoteType)}
          disabled={loading}
        >
          <SelectTrigger id="note-type" aria-label="Tipo de nota">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOTE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <span className={type.color}>{type.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        disabled={loading || content.trim().length === 0}
        className="w-full"
        aria-busy={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creando...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Crear Nota
          </>
        )}
      </Button>
    </form>
  )
}
