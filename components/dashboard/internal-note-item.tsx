"use client"

import { useState, useOptimistic, startTransition } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { updateInternalNote, deleteInternalNote } from "@/lib/actions/internal-notes"
import type { InternalNote, NoteType } from "@/lib/types/erp"
import { toast } from "sonner"
import { Check, Trash2, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface InternalNoteItemProps {
  note: InternalNote
  currentUserId?: string
  isAdmin?: boolean
}

const NOTE_TYPE_CONFIG: Record<NoteType, { label: string; color: string; bgColor: string }> = {
  general: { 
    label: "General", 
    color: "text-gray-900 dark:text-gray-100", 
    bgColor: "bg-gray-200 dark:bg-gray-700" 
  },
  cliente: { 
    label: "Cliente", 
    color: "text-blue-900 dark:text-blue-100", 
    bgColor: "bg-blue-200 dark:bg-blue-800" 
  },
  stock: { 
    label: "Stock", 
    color: "text-orange-900 dark:text-orange-100", 
    bgColor: "bg-orange-200 dark:bg-orange-800" 
  },
  proveedor: { 
    label: "Proveedor", 
    color: "text-purple-900 dark:text-purple-100", 
    bgColor: "bg-purple-200 dark:bg-purple-800" 
  },
  urgente: { 
    label: "Urgente", 
    color: "text-red-900 dark:text-red-100", 
    bgColor: "bg-red-200 dark:bg-red-800" 
  },
}

export function InternalNoteItem({ 
  note, 
  currentUserId, 
  isAdmin = false 
}: InternalNoteItemProps) {
  const [isResolving, setIsResolving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Optimistic state for resolved status
  const [optimisticResolved, setOptimisticResolved] = useOptimistic(
    note.is_resolved,
    (_, newValue: boolean) => newValue
  )

  const typeConfig = NOTE_TYPE_CONFIG[note.note_type]
  const isAuthor = currentUserId === note.user_id
  const canDelete = isAuthor || isAdmin

  // Format relative time
  const relativeTime = formatDistanceToNow(new Date(note.created_at), {
    addSuffix: true,
    locale: es,
  })

  const handleResolve = async () => {
    if (optimisticResolved) return

    setIsResolving(true)
    
    // Optimistic update - envolver en startTransition
    startTransition(() => {
      setOptimisticResolved(true)
    })

    try {
      await updateInternalNote({
        id: note.id,
        is_resolved: true,
      })
      
      toast.success("Nota marcada como resuelta")
    } catch (error) {
      // Rollback on error
      startTransition(() => {
        setOptimisticResolved(false)
      })
      
      console.error("Error resolving note:", error)
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Error al marcar la nota como resuelta"
      )
    } finally {
      setIsResolving(false)
    }
  }

  const handleDelete = async () => {
    if (!canDelete) return

    setIsDeleting(true)

    try {
      await deleteInternalNote(note.id)
      
      toast.success("Nota eliminada exitosamente")
    } catch (error) {
      console.error("Error deleting note:", error)
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Error al eliminar la nota"
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div 
      className={`rounded-lg border bg-card p-3 space-y-2 transition-opacity ${
        optimisticResolved ? "opacity-60" : ""
      }`}
      role="article"
      aria-label={`Nota de ${note.user_name}`}
    >
      {/* Header: Type badge and timestamp */}
      <div className="flex items-start justify-between gap-2">
        <Badge 
          variant="secondary" 
          className={`${typeConfig.bgColor} ${typeConfig.color} text-xs`}
        >
          {typeConfig.label}
        </Badge>
        
        <time 
          className="text-xs text-muted-foreground"
          dateTime={note.created_at}
          title={new Date(note.created_at).toLocaleString("es-AR")}
        >
          {relativeTime}
        </time>
      </div>

      {/* Content */}
      <p className="text-sm text-foreground whitespace-pre-wrap break-words">
        {note.content}
      </p>

      {/* Footer: Author and actions */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-medium">{note.user_name}</span>
          {optimisticResolved && (
            <Badge variant="outline" className="ml-2 text-xs">
              Resuelta
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Resolve button - only for active notes */}
          {!optimisticResolved && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResolve}
              disabled={isResolving}
              className="h-7 px-2 text-xs"
              aria-label="Marcar como resuelta"
              aria-busy={isResolving}
            >
              {isResolving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </Button>
          )}

          {/* Delete button - only for author or admin */}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              aria-label="Eliminar nota"
              aria-busy={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
