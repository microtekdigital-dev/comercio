"use client"

import { useState, useOptimistic, startTransition } from "react"
import { updateInternalNote, deleteInternalNote } from "@/lib/actions/internal-notes"
import type { InternalNote, NoteType } from "@/lib/types/erp"
import { toast } from "sonner"
import { Check, Trash2, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

const TYPE_CONFIG: Record<NoteType, { label: string; border: string; bg: string }> = {
  general:   { label: "General",   border: "border-gray-400",   bg: "bg-gray-50" },
  cliente:   { label: "Cliente",   border: "border-blue-400",   bg: "bg-blue-50" },
  stock:     { label: "Stock",     border: "border-orange-400", bg: "bg-orange-50" },
  proveedor: { label: "Proveedor", border: "border-purple-400", bg: "bg-purple-50" },
  urgente:   { label: "⚠ Urgente", border: "border-red-500",   bg: "bg-red-50" },
}

interface InternalNoteItemProps {
  note: InternalNote
  currentUserId?: string
  isAdmin?: boolean
}

export function InternalNoteItem({ note, currentUserId, isAdmin = false }: InternalNoteItemProps) {
  const [isResolving, setIsResolving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [optimisticResolved, setOptimisticResolved] = useOptimistic(note.is_resolved, (_, v: boolean) => v)

  const cfg = TYPE_CONFIG[note.note_type]
  const canDelete = currentUserId === note.user_id || isAdmin
  const relTime = formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: es })

  const handleResolve = async () => {
    if (optimisticResolved) return
    setIsResolving(true)
    startTransition(() => setOptimisticResolved(true))
    try {
      await updateInternalNote({ id: note.id, is_resolved: true })
      toast.success("Nota resuelta")
    } catch (error) {
      startTransition(() => setOptimisticResolved(false))
      toast.error(error instanceof Error ? error.message : "Error al resolver")
    } finally { setIsResolving(false) }
  }

  const handleDelete = async () => {
    if (!canDelete) return
    setIsDeleting(true)
    try { await deleteInternalNote(note.id); toast.success("Nota eliminada") }
    catch (error) { toast.error(error instanceof Error ? error.message : "Error al eliminar") }
    finally { setIsDeleting(false) }
  }

  return (
    <div className={`border-2 ${cfg.border} ${cfg.bg} p-2 space-y-1.5 ${optimisticResolved ? "opacity-50" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${cfg.border} bg-white`}>{cfg.label}</span>
        <span className="text-[10px] text-gray-500">{relTime}</span>
      </div>

      {/* Content */}
      <p className="text-xs text-black whitespace-pre-wrap break-words">{note.content}</p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#e0e0e0]">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-gray-600">{note.user_name}</span>
          {optimisticResolved && <span className="text-[10px] text-green-700 font-bold ml-1">✓ Resuelta</span>}
        </div>
        <div className="flex items-center gap-1">
          {!optimisticResolved && (
            <button onClick={handleResolve} disabled={isResolving} title="Marcar como resuelta"
              className="w-5 h-5 border border-[#808080] bg-[#d4d0c8] flex items-center justify-center hover:bg-[#c0c0c0] disabled:opacity-50">
              {isResolving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </button>
          )}
          {canDelete && (
            <button onClick={handleDelete} disabled={isDeleting} title="Eliminar"
              className="w-5 h-5 border border-[#808080] bg-[#d4d0c8] flex items-center justify-center hover:bg-[#c0c0c0] disabled:opacity-50 text-red-700">
              {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
